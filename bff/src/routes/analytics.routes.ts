import { Router, Request, Response } from 'express';
import { AnalyticsServiceAdapter } from '../grpc/adapters';

export function createAnalyticsRoutes(): Router {
  const router = Router();

  // GET /api/analytics?hostId=X&timeRange=6m
  router.get('/', async (req: Request, res: Response) => {
    try {
      const hostId = req.query.hostId as string;
      const timeRange = (req.query.timeRange as string) || '6m';

      if (!hostId) return res.status(400).json({ error: 'hostId required' });

      const response = await AnalyticsServiceAdapter.getAnalytics(hostId, timeRange);

      if (!response.success) {
        return res.status(500).json({ error: response.error_message || 'Failed to fetch analytics' });
      }

      const d = response.data;
      const statusColors: Record<string, string> = {
        completed: 'var(--analytics-completed)',
        confirmed: 'var(--analytics-confirmed)',
        pending:   'var(--analytics-pending)',
        cancelled: 'var(--analytics-cancelled)',
      };

      const totalAllStatuses = (d?.booking_status_data || []).reduce((s: number, r: any) => s + r.count, 0);

      res.json({
        revenueData: (d?.revenue_data || []).map((p: any) => ({
          month: p.label,
          revenue: p.value,
          bookings: parseInt(p.date || '0', 10) || 0,
        })),
        bookingStatusData: (d?.booking_status_data || []).map((r: any) => ({
          name: r.status.charAt(0).toUpperCase() + r.status.slice(1),
          value: totalAllStatuses > 0 ? Math.round((r.count / totalAllStatuses) * 100) : 0,
          color: statusColors[r.status] ?? '#888',
        })),
        topServices: (d?.top_services || []).map((s: any) => ({
          id: s.service_id,
          name: s.service_name,
          bookings: s.bookings,
          revenue: s.revenue,
        })),
        topCustomers: (d?.top_customers || []).map((c: any) => ({
          id: c.customer_email,
          name: c.customer_name,
          bookings: c.total_bookings,
          totalSpent: c.total_spent,
        })),
        metrics: {
          totalRevenue: d?.metrics?.total_revenue ?? 'R0.00',
          totalBookings: d?.metrics?.total_bookings ?? 0,
          activeCustomers: d?.metrics?.active_customers ?? 0,
          avgRating: d?.metrics?.avg_rating ?? 0,
        },
      });
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  return router;
}

export default createAnalyticsRoutes;
