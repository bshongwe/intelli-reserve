/**
 * Escrow Service API Client
 * Type-safe HTTP client for communicating with BFF escrow endpoints
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface EscrowAccount {
  id: string;
  hostId: string;
  heldBalanceCents: number;
  availableBalanceCents: number;
  totalReceivedCents: number;
  totalPaidOutCents: number;
  accountStatus: 'active' | 'suspended' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface Hold {
  id: string;
  bookingId: string;
  hostId: string;
  clientId: string;
  status: 'pending' | 'released' | 'refunded';
  grossAmountCents: number;
  platformFeeCents: number;
  hostAmountCents: number;
  holdReason: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  hostId: string;
  transactionType: string;
  amountCents: number;
  reason: string;
  relatedHoldId?: string;
  relatedPayoutId?: string;
  createdAt: string;
}

export interface Payout {
  id: string;
  hostId: string;
  amountCents: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  bankAccountToken: string;
  createdAt: string;
  updatedAt: string;
}

export interface Dispute {
  id: string;
  bookingId: string;
  holdId: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  initiatedByUserId: string;
  reason: string;
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  message: string;
  data?: T;
  error?: string;
  details?: string;
  [key: string]: any; // Allow dynamic properties from API
}

// ============================================================================
// CONSTANTS: API URLs & Messages
// ============================================================================

const API_BASE = process.env.REACT_APP_BFF_URL || 'http://localhost:3001';
const ESCROW_API_BASE = `${API_BASE}/api/escrow`;

const ENDPOINT_HOLDS = '/holds';
const ENDPOINT_ACCOUNT = '/account';
const ENDPOINT_BALANCE = '/balance';
const ENDPOINT_PAYOUTS = '/payouts';
const ENDPOINT_TRANSACTIONS = '/transactions';
const ENDPOINT_DISPUTES = '/disputes';

const ERROR_NETWORK = 'Network error - please check your connection';
const ERROR_SERVER = 'Server error - please try again later';
const ERROR_UNAUTHORIZED = 'Unauthorized - please log in';
const ERROR_INVALID_RESPONSE = 'Invalid response from server';
const ERROR_FETCH_ACCOUNT = 'Failed to fetch account';
const ERROR_FETCH_BALANCE = 'Failed to fetch balance';
const ERROR_FETCH_HOLD = 'Failed to fetch hold';
const ERROR_REQUEST_PAYOUT = 'Failed to request payout';
const ERROR_FETCH_PAYOUT = 'Failed to fetch payout';
const ERROR_FETCH_PAYOUTS = 'Failed to fetch payout history';
const ERROR_FETCH_TRANSACTIONS = 'Failed to fetch transactions';
const ERROR_OPEN_DISPUTE = 'Failed to open dispute';
const ERROR_FETCH_DISPUTE = 'Failed to fetch dispute';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Fetch with error handling
 */
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 401) {
      throw new Error(ERROR_UNAUTHORIZED);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || ERROR_SERVER);
    }

    return response;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(ERROR_NETWORK);
    }
    throw error;
  }
}

/**
 * Parse JSON response safely
 */
async function parseResponse<T>(response: Response): Promise<T> {
  try {
    return await response.json();
  } catch {
    throw new Error(ERROR_INVALID_RESPONSE);
  }
}

// ============================================================================
// API FUNCTIONS: Account Operations
// ============================================================================

export async function getEscrowAccount(hostId: string): Promise<EscrowAccount> {
  try {
    const url = `${ESCROW_API_BASE}${ENDPOINT_ACCOUNT}/${hostId}`;
    const response = await fetchWithAuth(url);
    const data = await parseResponse<ApiResponse<{ account: EscrowAccount }>>(response);
    
    if (!data.account) {
      throw new Error(ERROR_INVALID_RESPONSE);
    }
    
    return data.account;
  } catch (error) {
    console.error('[Escrow API] Error fetching account:', error);
    throw new Error(error instanceof Error ? error.message : ERROR_FETCH_ACCOUNT);
  }
}

export async function getAvailableBalance(hostId: string): Promise<number> {
  try {
    const url = `${ESCROW_API_BASE}${ENDPOINT_BALANCE}/${hostId}`;
    const response = await fetchWithAuth(url);
    const data = await parseResponse<{ availableBalanceCents: number }>(response);
    
    return data.availableBalanceCents || 0;
  } catch (error) {
    console.error('[Escrow API] Error fetching balance:', error);
    throw new Error(error instanceof Error ? error.message : ERROR_FETCH_BALANCE);
  }
}

// ============================================================================
// API FUNCTIONS: Hold Operations
// ============================================================================

export async function createHold(
  bookingId: string,
  hostId: string,
  clientId: string,
  grossAmountCents: number,
  platformFeeCents: number,
  holdReason: string = 'booking_payment'
): Promise<Hold> {
  try {
    const url = `${ESCROW_API_BASE}${ENDPOINT_HOLDS}`;
    const response = await fetchWithAuth(url, {
      method: 'POST',
      body: JSON.stringify({
        bookingId,
        hostId,
        clientId,
        grossAmountCents,
        platformFeeCents,
        holdReason,
      }),
    });
    const data = await parseResponse<ApiResponse<{ hold: Hold }>>(response);
    
    if (!data.hold) {
      throw new Error(ERROR_INVALID_RESPONSE);
    }
    
    return data.hold;
  } catch (error) {
    console.error('[Escrow API] Error creating hold:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create escrow hold');
  }
}

export async function getHold(holdId: string): Promise<Hold> {
  try {
    const url = `${ESCROW_API_BASE}${ENDPOINT_HOLDS}/${holdId}`;
    const response = await fetchWithAuth(url);
    const data = await parseResponse<ApiResponse<{ hold: Hold }>>(response);
    
    if (!data.hold) {
      throw new Error(ERROR_INVALID_RESPONSE);
    }
    
    return data.hold;
  } catch (error) {
    console.error('[Escrow API] Error fetching hold:', error);
    throw new Error(error instanceof Error ? error.message : ERROR_FETCH_HOLD);
  }
}

export async function releaseHold(holdId: string, hostId: string): Promise<EscrowAccount> {
  try {
    const url = `${ESCROW_API_BASE}${ENDPOINT_HOLDS}/${holdId}/release`;
    const response = await fetchWithAuth(url, {
      method: 'POST',
      body: JSON.stringify({ hostId }),
    });
    const data = await parseResponse<ApiResponse<{ account: EscrowAccount }>>(response);
    
    if (!data.account) {
      throw new Error(ERROR_INVALID_RESPONSE);
    }
    
    return data.account;
  } catch (error) {
    console.error('[Escrow API] Error releasing hold:', error);
    throw error;
  }
}

export async function refundHold(holdId: string, hostId: string, reason?: string): Promise<EscrowAccount> {
  try {
    const url = `${ESCROW_API_BASE}${ENDPOINT_HOLDS}/${holdId}/refund`;
    const response = await fetchWithAuth(url, {
      method: 'POST',
      body: JSON.stringify({ hostId, reason }),
    });
    const data = await parseResponse<ApiResponse<{ account: EscrowAccount }>>(response);
    
    if (!data.account) {
      throw new Error(ERROR_INVALID_RESPONSE);
    }
    
    return data.account;
  } catch (error) {
    console.error('[Escrow API] Error refunding hold:', error);
    throw error;
  }
}

// ============================================================================
// API FUNCTIONS: Payout Operations
// ============================================================================

export async function requestPayout(
  hostId: string,
  amountCents: number,
  bankAccountToken: string
): Promise<Payout> {
  try {
    const url = `${ESCROW_API_BASE}${ENDPOINT_PAYOUTS}`;
    const response = await fetchWithAuth(url, {
      method: 'POST',
      body: JSON.stringify({ hostId, amountCents, bankAccountToken }),
    });
    const data = await parseResponse<ApiResponse<{ payout: Payout }>>(response);
    
    if (!data.payout) {
      throw new Error(ERROR_INVALID_RESPONSE);
    }
    
    return data.payout;
  } catch (error) {
    console.error('[Escrow API] Error requesting payout:', error);
    throw new Error(error instanceof Error ? error.message : ERROR_REQUEST_PAYOUT);
  }
}

export async function getPayoutStatus(payoutId: string): Promise<Payout> {
  try {
    const url = `${ESCROW_API_BASE}${ENDPOINT_PAYOUTS}/${payoutId}`;
    const response = await fetchWithAuth(url);
    const data = await parseResponse<ApiResponse<{ payout: Payout }>>(response);
    
    if (!data.payout) {
      throw new Error(ERROR_INVALID_RESPONSE);
    }
    
    return data.payout;
  } catch (error) {
    console.error('[Escrow API] Error fetching payout status:', error);
    throw new Error(error instanceof Error ? error.message : ERROR_FETCH_PAYOUT);
  }
}

export async function getPayoutHistory(
  hostId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Payout[]> {
  try {
    const url = `${ESCROW_API_BASE}${ENDPOINT_PAYOUTS}/host/${hostId}?limit=${limit}&offset=${offset}`;
    const response = await fetchWithAuth(url);
    const data = await parseResponse<ApiResponse<{ payouts: Payout[] }>>(response);
    
    return data.payouts || [];
  } catch (error) {
    console.error('[Escrow API] Error fetching payout history:', error);
    throw new Error(error instanceof Error ? error.message : ERROR_FETCH_PAYOUTS);
  }
}

// ============================================================================
// API FUNCTIONS: Transaction Operations (Audit Log)
// ============================================================================

export async function getTransactionHistory(
  hostId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Transaction[]> {
  try {
    const url = `${ESCROW_API_BASE}${ENDPOINT_TRANSACTIONS}/${hostId}?limit=${limit}&offset=${offset}`;
    const response = await fetchWithAuth(url);
    const data = await parseResponse<ApiResponse<{ transactions: Transaction[] }>>(response);
    
    return data.transactions || [];
  } catch (error) {
    console.error('[Escrow API] Error fetching transaction history:', error);
    throw new Error(error instanceof Error ? error.message : ERROR_FETCH_TRANSACTIONS);
  }
}

// ============================================================================
// API FUNCTIONS: Dispute Operations
// ============================================================================

export async function openDispute(
  bookingId: string,
  holdId: string,
  initiatedByUserId: string,
  reason: string
): Promise<Dispute> {
  try {
    const url = `${ESCROW_API_BASE}${ENDPOINT_DISPUTES}`;
    const response = await fetchWithAuth(url, {
      method: 'POST',
      body: JSON.stringify({
        bookingId,
        holdId,
        initiatedByUserId,
        reason,
      }),
    });
    const data = await parseResponse<ApiResponse<{ dispute: Dispute }>>(response);
    
    if (!data.dispute) {
      throw new Error(ERROR_INVALID_RESPONSE);
    }
    
    return data.dispute;
  } catch (error) {
    console.error('[Escrow API] Error opening dispute:', error);
    throw new Error(error instanceof Error ? error.message : ERROR_OPEN_DISPUTE);
  }
}

export async function getDisputeStatus(disputeId: string): Promise<Dispute> {
  try {
    const url = `${ESCROW_API_BASE}${ENDPOINT_DISPUTES}/${disputeId}`;
    const response = await fetchWithAuth(url);
    const data = await parseResponse<ApiResponse<{ dispute: Dispute }>>(response);
    
    if (!data.dispute) {
      throw new Error(ERROR_INVALID_RESPONSE);
    }
    
    return data.dispute;
  } catch (error) {
    console.error('[Escrow API] Error fetching dispute:', error);
    throw new Error(error instanceof Error ? error.message : ERROR_FETCH_DISPUTE);
  }
}

// ============================================================================
// UTILITY FUNCTIONS: Formatting
// ============================================================================

/**
 * Format cents to ZAR (South African Rand) currency string
 */
export function formatCentsToZAR(cents: number | undefined | null): string {
  if (cents === null || cents === undefined || Number.isNaN(cents)) {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(0);
  }
  const rands = cents / 100;
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(rands);
}

/**
 * Format ISO timestamp to readable date
 */
export function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoString));
}

/**
 * Get transaction type label
 */
export function getTransactionTypeLabel(type: string): string {
  const typeLabels: Record<string, string> = {
    hold: 'Hold Created',
    release: 'Hold Released',
    refund: 'Hold Refunded',
    payout: 'Payout',
    dispute: 'Dispute',
  };
  
  return typeLabels[type] || type;
}

/**
 * Get hold status label
 */
export function getHoldStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    released: 'Released',
    refunded: 'Refunded',
  };
  
  return statusLabels[status] || status;
}

/**
 * Get dispute status label
 */
export function getDisputeStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
  };
  
  return statusLabels[status] || status;
}

/**
 * Get payout status label
 */
export function getPayoutStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
  };
  
  return statusLabels[status] || status;
}

/**
 * Get account status label
 */
export function getAccountStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    active: 'Active',
    suspended: 'Suspended',
    closed: 'Closed',
  };
  
  return statusLabels[status] || status;
}
