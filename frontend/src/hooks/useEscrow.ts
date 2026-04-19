/**
 * Escrow Service React Hooks
 * Custom hooks for fetching escrow data with React Query
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as escrowApi from '@/lib/escrow-api';

// ============================================================================
// CONSTANTS: Query Keys
// ============================================================================

const QUERY_KEY_ACCOUNT = 'escrowAccount';
const QUERY_KEY_BALANCE = 'escrowBalance';
const QUERY_KEY_HOLD = 'escrowHold';
const QUERY_KEY_PAYOUTS = 'escrowPayouts';
const QUERY_KEY_TRANSACTIONS = 'escrowTransactions';
const QUERY_KEY_DISPUTES = 'escrowDisputes';

const STALE_TIME_ACCOUNT = 5 * 60 * 1000; // 5 minutes
const STALE_TIME_BALANCE = 2 * 60 * 1000; // 2 minutes
const STALE_TIME_TRANSACTIONS = 10 * 60 * 1000; // 10 minutes

// ============================================================================
// ACCOUNT HOOKS
// ============================================================================

/**
 * Fetch escrow account details
 */
export function useEscrowAccount(hostId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: [QUERY_KEY_ACCOUNT, hostId],
    queryFn: () => escrowApi.getEscrowAccount(hostId),
    enabled,
    staleTime: STALE_TIME_ACCOUNT,
    retry: 2,
  });
}

/**
 * Fetch available balance only
 */
export function useEscrowBalance(hostId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: [QUERY_KEY_BALANCE, hostId],
    queryFn: () => escrowApi.getAvailableBalance(hostId),
    enabled,
    staleTime: STALE_TIME_BALANCE,
    retry: 2,
  });
}

// ============================================================================
// HOLD HOOKS
// ============================================================================

/**
 * Fetch single hold details
 */
export function useHold(holdId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: [QUERY_KEY_HOLD, holdId],
    queryFn: () => escrowApi.getHold(holdId),
    enabled,
    retry: 2,
  });
}

/**
 * Fetch all holds for a client
 */
export function useClientHolds(clientId: string, enabled: boolean = true, limit: number = 100, offset: number = 0) {
  return useQuery({
    queryKey: [QUERY_KEY_HOLD, 'client', clientId, limit, offset],
    queryFn: () => escrowApi.getClientHolds(clientId, limit, offset),
    enabled,
    staleTime: STALE_TIME_BALANCE,
    retry: 2,
  });
}

/**
 * Fetch all holds across the system
 */
export function useAllHolds(enabled: boolean = true, limit: number = 100, offset: number = 0, statusFilter: string = '') {
  return useQuery({
    queryKey: [QUERY_KEY_HOLD, 'all', limit, offset, statusFilter],
    queryFn: () => escrowApi.getAllHolds(limit, offset, statusFilter),
    enabled,
    staleTime: STALE_TIME_BALANCE,
    retry: 2,
  });
}

/**
 * Release a hold
 */
export function useReleaseHold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ holdId, hostId }: { holdId: string; hostId: string }) =>
      escrowApi.releaseHold(holdId, hostId),
    onSuccess: (_, variables) => {
      // Invalidate account queries
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY_ACCOUNT, variables.hostId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY_BALANCE, variables.hostId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY_TRANSACTIONS, variables.hostId],
      });
    },
  });
}

/**
 * Refund a hold
 */
export function useRefundHold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      holdId,
      hostId,
      reason,
    }: {
      holdId: string;
      hostId: string;
      reason?: string;
    }) => escrowApi.refundHold(holdId, hostId, reason),
    onSuccess: (_, variables) => {
      // Invalidate account queries
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY_ACCOUNT, variables.hostId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY_BALANCE, variables.hostId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY_TRANSACTIONS, variables.hostId],
      });
    },
  });
}

// ============================================================================
// PAYOUT HOOKS
// ============================================================================

/**
 * Request a payout
 */
export function useRequestPayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      hostId,
      amountCents,
      bankAccountToken,
    }: {
      hostId: string;
      amountCents: number;
      bankAccountToken: string;
    }) => escrowApi.requestPayout(hostId, amountCents, bankAccountToken),
    onSuccess: (_, variables) => {
      // Invalidate account and payout queries
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY_ACCOUNT, variables.hostId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY_BALANCE, variables.hostId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY_PAYOUTS, variables.hostId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY_TRANSACTIONS, variables.hostId],
      });
    },
  });
}

/**
 * Fetch payout status
 */
export function usePayoutStatus(payoutId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: [`${QUERY_KEY_PAYOUTS}-status`, payoutId],
    queryFn: () => escrowApi.getPayoutStatus(payoutId),
    enabled,
    retry: 2,
  });
}

/**
 * Fetch payout history
 */
export function usePayoutHistory(
  hostId: string,
  limit: number = 50,
  offset: number = 0,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [QUERY_KEY_PAYOUTS, hostId, limit, offset],
    queryFn: () => escrowApi.getPayoutHistory(hostId, limit, offset),
    enabled,
    staleTime: STALE_TIME_TRANSACTIONS,
    retry: 2,
  });
}

// ============================================================================
// TRANSACTION HOOKS
// ============================================================================

/**
 * Fetch transaction history (immutable audit log)
 */
export function useTransactionHistory(
  hostId: string,
  limit: number = 50,
  offset: number = 0,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [QUERY_KEY_TRANSACTIONS, hostId, limit, offset],
    queryFn: () => escrowApi.getTransactionHistory(hostId, limit, offset),
    enabled,
    staleTime: STALE_TIME_TRANSACTIONS,
    retry: 2,
  });
}

// ============================================================================
// DISPUTE HOOKS
// ============================================================================

/**
 * Open a dispute
 */
export function useOpenDispute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      holdId,
      initiatedByUserId,
      reason,
    }: {
      bookingId: string;
      holdId: string;
      initiatedByUserId: string;
      reason: string;
    }) => escrowApi.openDispute(bookingId, holdId, initiatedByUserId, reason),
    onSuccess: () => {
      // Invalidate dispute queries
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY_DISPUTES],
      });
    },
  });
}

/**
 * Fetch dispute status
 */
export function useDisputeStatus(disputeId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: [QUERY_KEY_DISPUTES, disputeId],
    queryFn: () => escrowApi.getDisputeStatus(disputeId),
    enabled,
    retry: 2,
  });
}
