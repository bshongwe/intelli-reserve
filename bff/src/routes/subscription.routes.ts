import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { SubscriptionServiceAdapter } from '../grpc/adapters';

const ActivateTrialSchema = z.object({
  userId: z.string().min(1, 'User ID required'),
});

const ActivateSubscriptionSchema = z.object({
  userId: z.string().min(1, 'User ID required'),
  planName: z.string().min(1, 'Plan name required'),
  paymentReference: z.string().min(1, 'Payment reference required'),
});

export function createSubscriptionRoutes(): Router {
  const router = Router();

  // Middleware to verify JWT token
  const requireAuth = (req: Request, res: Response, next: Function) => {
    const token = req.cookies?.auth_token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as any;
      (req as any).userId = decoded.sub;
      (req as any).userEmail = decoded.email;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  /**
   * POST /api/subscription/trial/activate
   * Activates a 14-day free trial for the user
   */
  router.post('/trial/activate', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;

      const response = await SubscriptionServiceAdapter.activateTrial(userId);

      if (!response.success) {
        return res.status(400).json({ error: response.message || 'Failed to activate trial' });
      }

      res.json({
        success: true,
        message: response.message,
        trialEndsAt: response.trialEndsAt,
        planName: response.planName,
        daysRemaining: response.daysRemaining,
      });
    } catch (error) {
      console.error('Trial activation error:', error);
      res.status(500).json({ error: 'Failed to activate trial' });
    }
  });

  /**
   * POST /api/subscription/activate
   * Converts trial to paid or activates paid subscription directly
   */
  router.post('/activate', requireAuth, async (req: Request, res: Response) => {
    try {
      const { planName, paymentReference } = ActivateSubscriptionSchema.parse(req.body);
      const userId = (req as any).userId;

      const response = await SubscriptionServiceAdapter.activateSubscription({
        userId,
        planName,
        paymentReference,
      });

      if (!response.success) {
        return res.status(400).json({ error: response.message || 'Failed to activate subscription' });
      }

      res.json({
        success: true,
        message: response.message,
        planName: response.planName,
        nextBillingAt: response.nextBillingAt,
        amountCents: response.amountCents,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Subscription activation error:', error);
      res.status(500).json({ error: 'Failed to activate subscription' });
    }
  });

  /**
   * GET /api/subscription/user/:userId
   * Retrieve current subscription info for a user
   */
  router.get('/user/:userId', requireAuth, async (req: Request, res: Response) => {
    try {
      const { userId: paramUserId } = req.params;
      const authenticatedUserId = (req as any).userId;

      // Only allow users to view their own subscription, or admins
      if (paramUserId !== authenticatedUserId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const response = await SubscriptionServiceAdapter.getSubscription(paramUserId);

      if (!response) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      res.json(response);
    } catch (error) {
      console.error('Get subscription error:', error);
      res.status(500).json({ error: 'Failed to get subscription' });
    }
  });

  /**
   * GET /api/subscription/plans
   * Get all available subscription plans (public endpoint)
   */
  router.get('/plans', async (req: Request, res: Response) => {
    try {
      const response = await SubscriptionServiceAdapter.getSubscriptionPlans();

      if (!response || !response.plans) {
        return res.status(500).json({ error: 'Failed to fetch plans' });
      }

      res.json({
        plans: response.plans.map((plan: any) => ({
          id: plan.id,
          name: plan.name,
          displayName: plan.displayName,
          description: plan.description,
          monthlyPriceCents: plan.monthlyPriceCents,
          monthlyPriceRands: plan.monthlyPriceCents / 100,
          maxBookingsPerMonth: plan.maxBookingsPerMonth,
          hasDynamicPricing: plan.hasDynamicPricing,
          hasPrioritySupport: plan.hasPrioritySupport,
        })),
      });
    } catch (error) {
      console.error('Get subscription plans error:', error);
      res.status(500).json({ error: 'Failed to fetch subscription plans' });
    }
  });

  /**
   * POST /api/subscription/check-expiration (Admin only)
   * Run trial expiration check (should be called by scheduler)
   */
  router.post('/check-expiration', async (req: Request, res: Response) => {
    try {
      // In production, this should be protected by an internal service key
      // For now, only allow from localhost or specific IP
      const clientIp = req.ip || '';
      const allowedIps = ['127.0.0.1', 'localhost', '::1'];

      // Allow if request has valid scheduler key
      const schedulerKey = req.headers['x-scheduler-key'];
      const isValidScheduler = schedulerKey === process.env.SCHEDULER_KEY;

      if (!isValidScheduler && !allowedIps.includes(clientIp)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const response = await SubscriptionServiceAdapter.checkTrialExpiration();

      res.json({
        success: response.success,
        message: response.message,
        usersDowngraded: response.usersDowngraded,
        checkedAt: response.checkedAt,
      });
    } catch (error) {
      console.error('Trial expiration check error:', error);
      res.status(500).json({ error: 'Failed to check trial expiration' });
    }
  });

  /**
   * POST /api/subscription/sync (Admin only)
   * Synchronize all users to Starter plan (one-time data migration)
   */
  router.post('/sync', async (req: Request, res: Response) => {
    try {
      // Admin-only endpoint
      const clientIp = req.ip || '';
      const allowedIps = ['127.0.0.1', 'localhost', '::1'];

      const adminKey = req.headers['x-admin-key'];
      const isValidAdmin = adminKey === process.env.ADMIN_KEY;

      if (!isValidAdmin && !allowedIps.includes(clientIp)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const response = await SubscriptionServiceAdapter.syncUserSubscriptions();

      res.json({
        success: response.success,
        message: response.message,
        usersSynced: response.usersSynced,
        syncedAt: response.syncedAt,
      });
    } catch (error) {
      console.error('User sync error:', error);
      res.status(500).json({ error: 'Failed to sync user subscriptions' });
    }
  });

  /**
   * GET /api/subscription/verify-consistency (Admin only)
   * Verify subscription consistency across all users
   */
  router.get('/verify-consistency', async (req: Request, res: Response) => {
    try {
      // Admin-only endpoint
      const clientIp = req.ip || '';
      const allowedIps = ['127.0.0.1', 'localhost', '::1'];

      const adminKey = req.headers['x-admin-key'];
      const isValidAdmin = adminKey === process.env.ADMIN_KEY;

      if (!isValidAdmin && !allowedIps.includes(clientIp)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const response = await SubscriptionServiceAdapter.verifySubscriptionConsistency();

      res.json({
        isConsistent: response.isConsistent,
        usersWithoutSubscription: response.usersWithoutSubscription,
        usersWithInvalidStatus: response.usersWithInvalidStatus,
        usersWithOrphanedTrials: response.usersWithOrphanedTrials,
        message: response.message,
      });
    } catch (error) {
      console.error('Consistency verification error:', error);
      res.status(500).json({ error: 'Failed to verify consistency' });
    }
  });

  return router;
}
