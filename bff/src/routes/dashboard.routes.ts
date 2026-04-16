import { Router, Request, Response } from 'express';
import { AnalyticsServiceAdapter } from '../grpc/adapters';

export function createDashboardRoutes(): Router {
  const router = Router();

  router.get('/metrics', async (req: Request, res: Response) => {
    try {
      const hostId = req.query.hostId as string;
      if (!hostId) return res.status(400).json({ error: 'hostId required' });

      const response = await AnalyticsServiceAdapter.getDashboardMetrics(hostId);

      if (!response.success) {
        return res.status(500).json({ error: response.error_message || 'Failed to fetch dashboard metrics' });
      }

      const m = response.metrics;
      res.json({
        upcomingBookings: m.upcoming_bookings,
        totalRevenue: m.total_revenue,
        avgOccupancy: m.avg_occupancy,
        responseRate: m.response_rate,
        revenueData: (m.revenue_data || []).map((p: any) => ({
          month: p.label,
          revenue: p.value,
        })),
        occupancyData: (m.occupancy_data || []).map((p: any) => ({
          date: p.label,
          occupancy: p.value,
        })),
      });
    } catch (error: any) {
      console.error('Dashboard metrics error:', error);
      res.status(500).json({ error: error?.details || error?.message || 'Failed to fetch dashboard metrics' });
    }
  });

  router.get('/', (_req, res) => res.json({ message: 'Dashboard routes' }));

  return router;
}

export default createDashboardRoutes;
