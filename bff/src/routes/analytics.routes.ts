import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

export interface AnalyticsData {
  revenueData: Array<{ month: string; revenue: number; bookings: number }>;
  bookingStatusData: Array<{ name: string; value: number; color?: string }>;
  topServices: Array<{ id: string; name: string; bookings: number; revenue: number }>;
  topCustomers: Array<{ id: string; name: string; bookings: number; totalSpent: number }>;
  metrics: { totalRevenue: string; totalBookings: number; activeCustomers: number; avgRating: number };
}

function monthsForRange(range: string): number {
  return range === '1m' ? 1 : range === '3m' ? 3 : range === '1y' ? 12 : 6;
}

export function createAnalyticsRoutes(pool: Pool): Router {
  const router = Router();

  router.get('/', async (req: Request, res: Response) => {
    try {
      const hostId = req.query.hostId as string;
      const timeRange = (req.query.timeRange as string) || '6m';

      if (!hostId) return res.status(400).json({ error: 'hostId required' });

      const months = monthsForRange(timeRange);

      // Revenue trend — from actual completed/confirmed bookings
      const revenueResult = await pool.query(
        `SELECT
           TO_CHAR(DATE_TRUNC('month', b.created_at), 'Mon YYYY') AS month,
           COALESCE(SUM(s.base_price), 0)::float AS revenue,
           COUNT(b.id)::integer AS bookings
         FROM bookings b
         JOIN services s ON b.service_id = s.id
         WHERE b.host_id = $1
           AND b.status IN ('confirmed', 'completed')
           AND b.created_at >= NOW() - ($2 || ' months')::interval
         GROUP BY DATE_TRUNC('month', b.created_at)
         ORDER BY DATE_TRUNC('month', b.created_at) ASC`,
        [hostId, months]
      );

      // Booking status distribution — real counts as percentages
      const statusResult = await pool.query(
        `SELECT
           status,
           COUNT(*)::integer AS count
         FROM bookings
         WHERE host_id = $1
         GROUP BY status`,
        [hostId]
      );

      const totalBookingsAllTime = statusResult.rows.reduce((s, r) => s + r.count, 0);
      const statusColors: Record<string, string> = {
        completed: 'var(--analytics-completed)',
        confirmed: 'var(--analytics-confirmed)',
        pending:   'var(--analytics-pending)',
        cancelled: 'var(--analytics-cancelled)',
      };
      const bookingStatusData = statusResult.rows.map(r => ({
        name: r.status.charAt(0).toUpperCase() + r.status.slice(1),
        value: totalBookingsAllTime > 0 ? Math.round((r.count / totalBookingsAllTime) * 100) : 0,
        color: statusColors[r.status] ?? '#888',
      }));

      // Top services — by booking count and revenue from bookings
      const topServicesResult = await pool.query(
        `SELECT
           s.id,
           s.name,
           COUNT(b.id)::integer AS bookings,
           COALESCE(SUM(s.base_price), 0)::float AS revenue
         FROM services s
         LEFT JOIN bookings b ON b.service_id = s.id
           AND b.status IN ('confirmed', 'completed')
         WHERE s.host_id = $1
         GROUP BY s.id, s.name
         ORDER BY bookings DESC, revenue DESC
         LIMIT 5`,
        [hostId]
      );

      // Top customers — by total spend from bookings
      const topCustomersResult = await pool.query(
        `SELECT
           b.client_email AS id,
           b.client_name AS name,
           COUNT(b.id)::integer AS bookings,
           COALESCE(SUM(s.base_price), 0)::float AS total_spent
         FROM bookings b
         JOIN services s ON b.service_id = s.id
         WHERE b.host_id = $1
           AND b.status IN ('confirmed', 'completed')
         GROUP BY b.client_email, b.client_name
         ORDER BY total_spent DESC
         LIMIT 5`,
        [hostId]
      );

      // Total revenue — completed/confirmed bookings in selected range
      const totalRevenueResult = await pool.query(
        `SELECT COALESCE(SUM(s.base_price), 0)::float AS total
         FROM bookings b
         JOIN services s ON b.service_id = s.id
         WHERE b.host_id = $1
           AND b.status IN ('confirmed', 'completed')
           AND b.created_at >= NOW() - ($2 || ' months')::interval`,
        [hostId, months]
      );

      // Active customers — distinct clients with a booking in the selected range
      const activeCustomersResult = await pool.query(
        `SELECT COUNT(DISTINCT client_email)::integer AS count
         FROM bookings
         WHERE host_id = $1
           AND status IN ('confirmed', 'completed')
           AND created_at >= NOW() - ($2 || ' months')::interval`,
        [hostId, months]
      );

      // Total bookings in range
      const totalBookingsInRange = revenueResult.rows.reduce((s, r) => s + r.bookings, 0);
      const totalRevenue = totalRevenueResult.rows[0]?.total ?? 0;

      const analyticsData: AnalyticsData = {
        revenueData: revenueResult.rows.map(r => ({
          month: r.month,
          revenue: parseFloat(r.revenue),
          bookings: r.bookings,
        })),
        bookingStatusData,
        topServices: topServicesResult.rows.map(r => ({
          id: r.id,
          name: r.name,
          bookings: r.bookings,
          revenue: parseFloat(r.revenue),
        })),
        topCustomers: topCustomersResult.rows.map(r => ({
          id: r.id,
          name: r.name,
          bookings: r.bookings,
          totalSpent: parseFloat(r.total_spent),
        })),
        metrics: {
          totalRevenue: `R${parseFloat(totalRevenue).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          totalBookings: totalBookingsInRange,
          activeCustomers: activeCustomersResult.rows[0]?.count ?? 0,
          avgRating: 0, // No ratings table yet — placeholder until ratings feature is built
        },
      };

      res.json(analyticsData);
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  return router;
}

export default createAnalyticsRoutes;
