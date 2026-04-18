/**
 * Hook to check payment status of a booking
 * Determines if a booking needs payment or if payment is already made
 * by checking if an escrow hold exists for the booking
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PaymentStatus {
  isPaid: boolean;
  holdId?: string;
  holdStatus?: 'pending' | 'released' | 'refunded';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getPaymentButtonLabel(isPaid: boolean): string {
  return isPaid ? '✅ Payment Complete' : '💳 Pay Now';
}

export function shouldShowPaymentButton(bookingStatus: string, isPaid?: boolean): boolean {
  if (bookingStatus !== 'confirmed') return false;
  return !isPaid;
}
