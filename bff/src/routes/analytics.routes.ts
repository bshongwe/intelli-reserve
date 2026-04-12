import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

export interface AnalyticsData {
  revenueData: Array<{
    month: string;
    revenue: number;
    bookings: number;
  }>;
  bookingStatusData: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  topServices: Array<{
    id: string;
    name: string;
    bookings: number;
    revenue: number;
  }>;
  topCustomers: Array<{
    id: string;
    name: string;
    bookings: number;
    totalSpent: number;
  }>;
  metrics: {
    totalRevenue: string;
    totalBookings: number;
    activeCustomers: number;
    avgRating: number;
  };
}

// Helper to get months array for date range
function getMonthsForRange(range: '1m' | '3m' | '6m' | '1y'): number {
  switch (range) {
    case '1m':
      return 1;
    case '3m':
      return 3;
    case '6m':
      return 6;
    case '1y':
      return 12;
    default:
      return 6;
  }
}

export function createAnalyticsRoutes(pool: Pool): Router {
  const router = Router();

  // Get analytics dashboard data
  router.get('/', async (req: Request, res: Response) => {
    try {
      const hostId = req.query.hostId as string;
      const timeRange = (req.query.timeRange as '1m' | '3m' | '6m' | '1y') || '6m';

      if (!hostId) {
        return res.status(400).json({ error: 'hostId required' });
      }

      const months = getMonthsForRange(timeRange);

      // Get revenue trend for selected period
      const revenueResult = await pool.query(
        `SELECT 
           TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as month,
           COALESCE(SUM(base_price), 0)::integer as revenue,
           COUNT(*)::integer as bookings
         FROM services
         WHERE host_id = $1 
         AND created_at >= NOW() - INTERVAL '${months} months'
         GROUP BY DATE_TRUNC('month', created_at)
         ORDER BY DATE_TRUNC('month', created_at) DESC`,
        [hostId]
      );

      // Mock booking status data (would come from bookings table)
      const bookingStatusData = [
        { name: 'Completed', value: 65, color: 'var(--analytics-completed)' },
        { name: 'Pending', value: 20, color: 'var(--analytics-pending)' },
        { name: 'Cancelled', value: 15, color: 'var(--analytics-cancelled)' },
      ];

      // Get top services
      const topServicesResult = await pool.query(
        `SELECT 
           id,
           name,
           COUNT(*)::integer as bookings,
           (base_price * COUNT(*))::integer as revenue
         FROM services
         WHERE host_id = $1
         GROUP BY id, name, base_price
         ORDER BY revenue DESC
         LIMIT 3`,
        [hostId]
      );

      // Mock top customers (would come from bookings table)
      const topCustomers = [
        { id: 'cust-1', name: 'John Doe', bookings: 5, totalSpent: 2500 },
        { id: 'cust-2', name: 'Jane Smith', bookings: 4, totalSpent: 2000 },
        { id: 'cust-3', name: 'Bob Johnson', bookings: 3, totalSpent: 1500 },
      ];

      // Calculate metrics
      const totalRevenueResult = await pool.query(
        `SELECT COALESCE(SUM(base_price), 0)::integer as total
         FROM services
         WHERE host_id = $1`,
        [hostId]
      );

      const totalRevenue = totalRevenueResult.rows[0]?.total || 0;
      const totalBookings = revenueResult.rows.reduce((sum, row) => sum + (row.bookings || 0), 0);

      const analyticsData: AnalyticsData = {
        revenueData: revenueResult.rows.map(row => ({
          month: row.month,
          revenue: row.revenue,
          bookings: row.bookings,
        })),
        bookingStatusData,
        topServices: topServicesResult.rows.map((row: any) => ({
          id: row.id,
          name: row.name,
          bookings: row.bookings,
          revenue: row.revenue,
        })),
        topCustomers,
        metrics: {
          totalRevenue: `R${totalRevenue.toLocaleString()}`,
          totalBookings,
          activeCustomers: topCustomers.length,
          avgRating: 4.8,
        },
      };

      res.json(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  return router;
}

export default createAnalyticsRoutes;
