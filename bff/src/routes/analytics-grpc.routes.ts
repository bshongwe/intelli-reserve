/**
 * Analytics Routes - gRPC Enabled
 * Demonstrates the use of gRPC client adapters for efficient dashboard queries
 */

import { Router, Request, Response } from 'express';
import { AnalyticsServiceAdapter } from '../grpc/adapters';

const router = Router();

/**
 * GET /api/analytics/dashboard/:hostId
 * Get dashboard metrics using gRPC
 * This will be much faster than REST due to binary protocol and HTTP/2 multiplexing
 */
router.get('/dashboard/:hostId', async (req: Request, res: Response) => {
  try {
    const { hostId } = req.params;

    if (!hostId) {
      return res.status(400).json({ error: 'hostId is required' });
    }

    // Call gRPC service adapter
    const response = await AnalyticsServiceAdapter.getDashboardMetrics(hostId);

    if (!response.success) {
      return res.status(400).json({
        error: 'Failed to fetch dashboard metrics',
        message: response.error_message,
      });
    }

    return res.json({
      success: true,
      data: response.metrics,
      _meta: {
        protocol: 'gRPC',
        backend: 'localhost:8090',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error fetching dashboard metrics via gRPC:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      protocol: 'gRPC',
    });
  }
});

/**
 * GET /api/analytics/:hostId
 * Get detailed analytics using gRPC
 */
router.get('/:hostId', async (req: Request, res: Response) => {
  try {
    const { hostId } = req.params;
    const { timeRange = '6m' } = req.query;

    if (!hostId) {
      return res.status(400).json({ error: 'hostId is required' });
    }

    // Call gRPC service adapter
    const response = await AnalyticsServiceAdapter.getAnalytics(
      hostId,
      timeRange as string
    );

    if (!response.success) {
      return res.status(400).json({
        error: 'Failed to fetch analytics',
        message: response.error_message,
      });
    }

    return res.json({
      success: true,
      data: response.data,
      _meta: {
        protocol: 'gRPC',
        backend: 'localhost:8090',
        timeRange,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error fetching analytics via gRPC:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      protocol: 'gRPC',
    });
  }
});

/**
 * GET /api/analytics/revenue/:hostId
 * Get revenue report using gRPC
 */
router.get('/revenue/:hostId', async (req: Request, res: Response) => {
  try {
    const { hostId } = req.params;
    const { startDate, endDate } = req.query;

    if (!hostId) {
      return res.status(400).json({ error: 'hostId is required' });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate are required',
      });
    }

    // Call gRPC service adapter
    const response = await AnalyticsServiceAdapter.getRevenueReport(
      hostId,
      startDate as string,
      endDate as string
    );

    if (!response.success) {
      return res.status(400).json({
        error: 'Failed to fetch revenue report',
        message: response.error_message,
      });
    }

    return res.json({
      success: true,
      data: response.report,
      _meta: {
        protocol: 'gRPC',
        backend: 'localhost:8090',
        dateRange: { startDate, endDate },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error fetching revenue report via gRPC:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      protocol: 'gRPC',
    });
  }
});

/**
 * GET /api/analytics/statistics/:hostId
 * Get booking statistics using gRPC
 */
router.get('/statistics/:hostId', async (req: Request, res: Response) => {
  try {
    const { hostId } = req.params;
    const { timeRange = '6m' } = req.query;

    if (!hostId) {
      return res.status(400).json({ error: 'hostId is required' });
    }

    // Call gRPC service adapter
    const response = await AnalyticsServiceAdapter.getBookingStatistics(
      hostId,
      timeRange as string
    );

    if (!response.success) {
      return res.status(400).json({
        error: 'Failed to fetch booking statistics',
        message: response.error_message,
      });
    }

    return res.json({
      success: true,
      data: response.statistics,
      _meta: {
        protocol: 'gRPC',
        backend: 'localhost:8090',
        timeRange,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error fetching booking statistics via gRPC:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      protocol: 'gRPC',
    });
  }
});

export default router;
