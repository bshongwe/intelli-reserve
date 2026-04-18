import { Router } from 'express';
import { z } from 'zod';
import { EscrowServiceAdapter } from '../grpc/adapters';

const router = Router();

// ============================================================================
// CONSTANTS: Error & Success Messages (Zero duplicate strings)
// ============================================================================

const MSG_VALIDATION_FAILED = 'Validation failed';
const MSG_MISSING_PARAM = 'Required parameter missing';
const MSG_HOLD_CREATED = 'Escrow hold created successfully';
const MSG_HOLD_RETRIEVED = 'Escrow hold retrieved successfully';
const MSG_HOLD_RELEASED = 'Escrow hold released successfully';
const MSG_HOLD_REFUNDED = 'Escrow hold refunded successfully';
const MSG_ACCOUNT_RETRIEVED = 'Escrow account retrieved successfully';
const MSG_PAYOUT_REQUESTED = 'Payout requested successfully';
const MSG_PAYOUT_STATUS = 'Payout status retrieved successfully';
const MSG_PAYOUT_HISTORY = 'Payout history retrieved successfully';
const MSG_TRANSACTION_HISTORY = 'Transaction history retrieved successfully';
const MSG_DISPUTE_OPENED = 'Dispute opened successfully';
const MSG_DISPUTE_STATUS = 'Dispute status retrieved successfully';
const MSG_ERROR_CREATING_HOLD = 'Failed to create escrow hold';
const MSG_ERROR_RETRIEVING_HOLD = 'Failed to retrieve escrow hold';
const MSG_ERROR_RELEASING_HOLD = 'Failed to release escrow hold';
const MSG_ERROR_REFUNDING_HOLD = 'Failed to refund escrow hold';
const MSG_ERROR_RETRIEVING_ACCOUNT = 'Failed to retrieve escrow account';
const MSG_ERROR_REQUESTING_PAYOUT = 'Failed to request payout';
const MSG_ERROR_RETRIEVING_PAYOUT = 'Failed to retrieve payout status';
const MSG_ERROR_RETRIEVING_HISTORY = 'Failed to retrieve payout history';
const MSG_ERROR_RETRIEVING_TRANSACTIONS = 'Failed to retrieve transaction history';
const MSG_ERROR_OPENING_DISPUTE = 'Failed to open dispute';
const MSG_ERROR_RETRIEVING_DISPUTE = 'Failed to retrieve dispute status';

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

const CreateHoldSchema = z.object({
  bookingId: z.string().min(1),
  hostId: z.string().min(1),
  clientId: z.string().min(1),
  grossAmountCents: z.number().positive(),
  platformFeeCents: z.number().min(0),
  holdReason: z.string().optional(),
});

const ReleaseHoldSchema = z.object({
  hostId: z.string().min(1),
});

const RefundHoldSchema = z.object({
  hostId: z.string().min(1),
  reason: z.string().optional(),
});

const RequestPayoutSchema = z.object({
  hostId: z.string().min(1),
  amountCents: z.number().positive(),
  bankAccountToken: z.string().min(1),
});

const OpenDisputeSchema = z.object({
  bookingId: z.string().min(1),
  holdId: z.string().min(1),
  initiatedByUserId: z.string().min(1),
  reason: z.string().min(1),
});

// ============================================================================
// ROUTES: Escrow Operations
// ============================================================================

/**
 * POST /api/escrow/holds
 * Create an escrow hold for a booking
 */
router.post('/holds', async (req, res) => {
  try {
    const validated = CreateHoldSchema.parse(req.body);
    const response = await EscrowServiceAdapter.createHold(
      validated.bookingId,
      validated.hostId,
      validated.clientId,
      validated.grossAmountCents,
      validated.platformFeeCents,
      validated.holdReason
    );
    res.status(201).json({
      message: MSG_HOLD_CREATED,
      hold: response.hold,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: MSG_VALIDATION_FAILED, details: error.errors });
    } else {
      console.error('[Escrow Routes] Error creating hold:', error);
      res.status(500).json({ error: MSG_ERROR_CREATING_HOLD, details: error.message });
    }
  }
});

/**
 * GET /api/escrow/holds
 * Query holds by bookingId (query parameter)
 */
router.get('/holds', async (req, res) => {
  try {
    const { bookingId } = req.query;
    
    if (!bookingId || typeof bookingId !== 'string') {
      return res.status(400).json({ error: 'bookingId query parameter is required' });
    }
    
    const response = await EscrowServiceAdapter.getHoldsByBookingId(bookingId);
    res.json({
      message: 'Holds retrieved successfully',
      holds: response.holds || [],
    });
  } catch (error: any) {
    console.error('[Escrow Routes] Error querying holds:', error);
    res.status(500).json({ error: 'Failed to query holds', details: error.message });
  }
});

/**
 * GET /api/escrow/holds/:holdId
 * Retrieve hold details
 */
router.get('/holds/:holdId', async (req, res) => {
  try {
    const { holdId } = req.params;
    if (!holdId) {
      return res.status(400).json({ error: MSG_MISSING_PARAM });
    }
    const response = await EscrowServiceAdapter.getHold(holdId);
    res.json({
      message: MSG_HOLD_RETRIEVED,
      hold: response.hold,
    });
  } catch (error: any) {
    console.error('[Escrow Routes] Error retrieving hold:', error);
    res.status(500).json({ error: MSG_ERROR_RETRIEVING_HOLD, details: error.message });
  }
});

/**
 * POST /api/escrow/holds/:holdId/release
 * Release an escrow hold (mark as released)
 */
router.post('/holds/:holdId/release', async (req, res) => {
  try {
    const { holdId } = req.params;
    const validated = ReleaseHoldSchema.parse(req.body);

    if (!holdId) {
      return res.status(400).json({ error: MSG_MISSING_PARAM });
    }

    const response = await EscrowServiceAdapter.releaseHold(holdId, validated.hostId);
    res.json({
      message: MSG_HOLD_RELEASED,
      account: response.account,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: MSG_VALIDATION_FAILED, details: error.errors });
    } else {
      console.error('[Escrow Routes] Error releasing hold:', error);
      res.status(500).json({ error: MSG_ERROR_RELEASING_HOLD, details: error.message });
    }
  }
});

/**
 * POST /api/escrow/holds/:holdId/refund
 * Refund an escrow hold
 */
router.post('/holds/:holdId/refund', async (req, res) => {
  try {
    const { holdId } = req.params;
    const validated = RefundHoldSchema.parse(req.body);

    if (!holdId) {
      return res.status(400).json({ error: MSG_MISSING_PARAM });
    }

    const response = await EscrowServiceAdapter.refundHold(holdId, validated.hostId, validated.reason);
    res.json({
      message: MSG_HOLD_REFUNDED,
      account: response.account,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: MSG_VALIDATION_FAILED, details: error.errors });
    } else {
      console.error('[Escrow Routes] Error refunding hold:', error);
      res.status(500).json({ error: MSG_ERROR_REFUNDING_HOLD, details: error.message });
    }
  }
});

/**
 * GET /api/escrow/account/:hostId
 * Get escrow account details for a host
 */
router.get('/account/:hostId', async (req, res) => {
  try {
    const { hostId } = req.params;
    if (!hostId) {
      return res.status(400).json({ error: MSG_MISSING_PARAM });
    }
    const response = await EscrowServiceAdapter.getEscrowAccount(hostId);
    res.json({
      message: MSG_ACCOUNT_RETRIEVED,
      account: response.account,
    });
  } catch (error: any) {
    console.error('[Escrow Routes] Error retrieving account:', error);
    res.status(500).json({ error: MSG_ERROR_RETRIEVING_ACCOUNT, details: error.message });
  }
});

/**
 * GET /api/escrow/balance/:hostId
 * Quick balance check - only available balance
 */
router.get('/balance/:hostId', async (req, res) => {
  try {
    const { hostId } = req.params;
    if (!hostId) {
      return res.status(400).json({ error: MSG_MISSING_PARAM });
    }
    const response = await EscrowServiceAdapter.getAvailableBalance(hostId);
    res.json({
      availableBalanceCents: response.available_balance_cents || response.availableBalanceCents,
    });
  } catch (error: any) {
    console.error('[Escrow Routes] Error retrieving balance:', error);
    res.status(500).json({ error: 'Failed to retrieve balance', details: error.message });
  }
});

/**
 * POST /api/escrow/payouts
 * Request a payout
 */
router.post('/payouts', async (req, res) => {
  try {
    const validated = RequestPayoutSchema.parse(req.body);
    const response = await EscrowServiceAdapter.requestPayout(
      validated.hostId,
      validated.amountCents,
      validated.bankAccountToken
    );
    res.status(201).json({
      message: MSG_PAYOUT_REQUESTED,
      payout: response.payout,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: MSG_VALIDATION_FAILED, details: error.errors });
    } else {
      console.error('[Escrow Routes] Error requesting payout:', error);
      res.status(500).json({ error: MSG_ERROR_REQUESTING_PAYOUT, details: error.message });
    }
  }
});

/**
 * GET /api/escrow/payouts/:payoutId
 * Get payout status
 */
router.get('/payouts/:payoutId', async (req, res) => {
  try {
    const { payoutId } = req.params;
    if (!payoutId) {
      return res.status(400).json({ error: MSG_MISSING_PARAM });
    }
    const response = await EscrowServiceAdapter.getPayoutStatus(payoutId);
    res.json({
      message: MSG_PAYOUT_STATUS,
      payout: response.payout,
    });
  } catch (error: any) {
    console.error('[Escrow Routes] Error retrieving payout status:', error);
    res.status(500).json({ error: MSG_ERROR_RETRIEVING_PAYOUT, details: error.message });
  }
});

/**
 * GET /api/escrow/payouts/host/:hostId
 * Get payout history for a host
 */
router.get('/payouts/host/:hostId', async (req, res) => {
  try {
    const { hostId } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    if (!hostId) {
      return res.status(400).json({ error: MSG_MISSING_PARAM });
    }

    const response = await EscrowServiceAdapter.getPayoutHistory(
      hostId,
      Number.parseInt(limit as string),
      Number.parseInt(offset as string)
    );
    res.json({
      message: MSG_PAYOUT_HISTORY,
      payouts: response.payouts || [],
    });
  } catch (error: any) {
    console.error('[Escrow Routes] Error retrieving payout history:', error);
    res.status(500).json({ error: MSG_ERROR_RETRIEVING_HISTORY, details: error.message });
  }
});

/**
 * GET /api/escrow/transactions/:hostId
 * Get transaction history (audit log) for a host
 */
router.get('/transactions/:hostId', async (req, res) => {
  try {
    const { hostId } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    if (!hostId) {
      return res.status(400).json({ error: MSG_MISSING_PARAM });
    }

    const response = await EscrowServiceAdapter.getTransactionHistory(
      hostId,
      Number.parseInt(limit as string),
      Number.parseInt(offset as string)
    );
    res.json({
      message: MSG_TRANSACTION_HISTORY,
      transactions: response.transactions || [],
    });
  } catch (error: any) {
    console.error('[Escrow Routes] Error retrieving transaction history:', error);
    res.status(500).json({ error: MSG_ERROR_RETRIEVING_TRANSACTIONS, details: error.message });
  }
});

/**
 * POST /api/escrow/disputes
 * Open a dispute
 */
router.post('/disputes', async (req, res) => {
  try {
    const validated = OpenDisputeSchema.parse(req.body);
    const response = await EscrowServiceAdapter.openDispute(
      validated.bookingId,
      validated.holdId,
      validated.initiatedByUserId,
      validated.reason
    );
    res.status(201).json({
      message: MSG_DISPUTE_OPENED,
      dispute: response.dispute,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: MSG_VALIDATION_FAILED, details: error.errors });
    } else {
      console.error('[Escrow Routes] Error opening dispute:', error);
      res.status(500).json({ error: MSG_ERROR_OPENING_DISPUTE, details: error.message });
    }
  }
});

/**
 * GET /api/escrow/disputes/:disputeId
 * Get dispute status
 */
router.get('/disputes/:disputeId', async (req, res) => {
  try {
    const { disputeId } = req.params;
    if (!disputeId) {
      return res.status(400).json({ error: MSG_MISSING_PARAM });
    }
    const response = await EscrowServiceAdapter.getDisputeStatus(disputeId);
    res.json({
      message: MSG_DISPUTE_STATUS,
      dispute: response.dispute,
    });
  } catch (error: any) {
    console.error('[Escrow Routes] Error retrieving dispute status:', error);
    res.status(500).json({ error: MSG_ERROR_RETRIEVING_DISPUTE, details: error.message });
  }
});

export default router;
