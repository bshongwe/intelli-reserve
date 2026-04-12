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

      // Get revenue trend (last 5 months)
      const revenueResult = await pool.query(
        `SELECT 
           TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as month,
           COALESCE(SUM(base_price), 0)::integer as revenue,
           COUNT(*)::integer as bookings
         FROM services
         WHERE host_id = $1 
         AND created_at >= NOW() - INTERVAL '5 months'
         GROUP BY DATE_TRUNC('month', created_at)
         ORDER BY DATE_TRUNC('month', created_at) ASC`,
        [hostId]
      );

      // Mock occupancy data (last 7 days)
      const occupancyData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toISOString().split('T')[0],
          occupancy: Math.floor(Math.random() * 40 + 60), // 60-100%
        };
      });

      // Get total service count (upcoming bookings placeholder)
      const serviceCountResult = await pool.query(
        `SELECT COUNT(*)::integer as count FROM services WHERE host_id = $1`,
        [hostId]
      );

      // Calculate total revenue
      const totalRevenueResult = await pool.query(
        `SELECT COALESCE(SUM(base_price), 0)::integer as total
         FROM services
         WHERE host_id = $1
         AND created_at >= NOW() - INTERVAL '30 days'`,
        [hostId]
      );

      // Get average occupancy (last 7 days)
      const occupancyResult = await pool.query(
        `SELECT ROUND(
          COALESCE(
            SUM(booked_count)::float / NULLIF(COUNT(*), 0) * 100, 
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
            COUNT(CASE WHEN status IN ('CONFIRMED', 'COMPLETED') THEN 1 END)::float 
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
        upcomingBookings: serviceCountResult.rows[0]?.count || 0,
        totalRevenue: `R${(totalRevenueResult.rows[0]?.total || 0).toLocaleString()}`,
        avgOccupancy: occupancyResult.rows[0]?.avg_occupancy || 0,
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
