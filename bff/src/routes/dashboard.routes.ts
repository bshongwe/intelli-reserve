import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

export interface DashboardMetrics {
  revenueData: Array<{
    month: string;
    revenue: number;
    bookings: number;
  }>;
  occupancyData: Array<{
    date: string;
    occupancy: number;
  }>;
  upcomingBookings: number;
  totalRevenue: string;
  avgOccupancy: number;
  responseRate: number;
}

export function createDashboardRoutes(pool: Pool): Router {
  const router = Router();

  // Get dashboard metrics
  router.get('/metrics', async (req: Request, res: Response) => {
    try {
      const hostId = req.query.hostId as string;

      if (!hostId) {
        return res.status(400).json({ error: 'hostId required' });
      }

      // Get revenue trend from actual bookings (last 5 months)
      const revenueResult = await pool.query(
        `SELECT 
           TO_CHAR(DATE_TRUNC('month', b.created_at), 'Mon') as month,
           COALESCE(SUM(s.base_price), 0)::integer as revenue,
           COUNT(b.id)::integer as bookings
         FROM bookings b
         JOIN services s ON b.service_id = s.id
         WHERE b.host_id = $1 
         AND b.created_at >= NOW() - INTERVAL '5 months'
         GROUP BY DATE_TRUNC('month', b.created_at)
         ORDER BY DATE_TRUNC('month', b.created_at) ASC`,
        [hostId]
      );

      // Get actual occupancy data (last 7 days) - percentage of time slots booked
      const occupancyResult = await pool.query(
        `SELECT 
           ts.slot_date as date,
           ROUND(
             COALESCE(
               COUNT(DISTINCT b.id)::float / NULLIF(COUNT(DISTINCT ts.id), 0) * 100,
               0
             )
           )::integer as occupancy
         FROM time_slots ts
         LEFT JOIN bookings b ON ts.id = b.time_slot_id AND b.status IN ('confirmed', 'completed')
         WHERE ts.service_id IN (
           SELECT id FROM services WHERE host_id = $1
         )
         AND ts.slot_date >= CURRENT_DATE - INTERVAL '7 days'
         AND ts.slot_date < CURRENT_DATE + INTERVAL '1 day'
         GROUP BY ts.slot_date
         ORDER BY ts.slot_date ASC`,
        [hostId]
      );
      
      const occupancyData = occupancyResult.rows.map(row => ({
        date: row.date,
        occupancy: row.occupancy || 0,
      }));

      // Get upcoming bookings count (next 30 days)
      const bookingCountResult = await pool.query(
        `SELECT COUNT(*)::integer as count FROM bookings 
         WHERE host_id = $1 
         AND status IN ('pending', 'confirmed')
         AND created_at >= CURRENT_DATE
         AND created_at <= CURRENT_DATE + INTERVAL '30 days'`,
        [hostId]
      );

      // Calculate total revenue from actual bookings (last 30 days)
      const totalRevenueResult = await pool.query(
        `SELECT COALESCE(SUM(s.base_price), 0)::integer as total
         FROM bookings b
         JOIN services s ON b.service_id = s.id
         WHERE b.host_id = $1
         AND b.created_at >= NOW() - INTERVAL '30 days'`,
        [hostId]
      );

      // Get average occupancy (last 7 days)
      const avgOccupancyResult = await pool.query(
        `SELECT ROUND(
          COALESCE(
            AVG(
              CASE WHEN booked_count > 0 THEN 1 ELSE 0 END
            ) * 100,
            0
          )
        )::integer as avg_occupancy
        FROM time_slots
        WHERE service_id IN (
          SELECT id FROM services WHERE host_id = $1
        )
        AND slot_date >= CURRENT_DATE - INTERVAL '7 days'
        AND slot_date < CURRENT_DATE + INTERVAL '1 day'`,
        [hostId]
      );

      // Get response rate (last 30 days)
      const responseRateResult = await pool.query(
        `SELECT ROUND(
          COALESCE(
            COUNT(CASE WHEN status IN ('confirmed', 'completed') THEN 1 END)::float 
            / NULLIF(COUNT(*), 0) * 100, 
            0
          )
        )::integer as response_rate
        FROM bookings
        WHERE service_id IN (
          SELECT id FROM services WHERE host_id = $1
        )
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'`,
        [hostId]
      );

      const dashboardMetrics: DashboardMetrics = {
        revenueData: revenueResult.rows.map(row => ({
          month: row.month,
          revenue: row.revenue,
          bookings: row.bookings,
        })),
        occupancyData,
        upcomingBookings: bookingCountResult.rows[0]?.count || 0,
        totalRevenue: `R${(totalRevenueResult.rows[0]?.total || 0).toLocaleString()}`,
        avgOccupancy: avgOccupancyResult.rows[0]?.avg_occupancy || 0,
        responseRate: responseRateResult.rows[0]?.response_rate || 0,
      };

      res.json(dashboardMetrics);
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
    }
  });

  // Placeholder for other dashboard routes
  router.get('/', (req, res) => {
    res.json({ message: 'Dashboard routes' });
  });

  return router;
}

export default createDashboardRoutes;
