'use client';

import { useClientHolds } from '@/hooks/useEscrow';
import { useAuth } from '@/lib/auth-context';
import { CreditCard } from 'lucide-react';

// ============================================================================
// COMPONENT: Replaces "Detailed escrow tracking coming soon" placeholder
// Shows actual escrow balance data in info box format
// Fetches all data but displays in compact single-box format
// ============================================================================

export function ClientEscrowBalance() {
  const { user } = useAuth();
  const clientId = user?.id;

  const { data: response, isLoading, error } = useClientHolds(clientId || '', !!clientId);

  // If still loading, show loading
  if (isLoading) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border">
        <CreditCard className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold">Escrow Balance</p>
          <p className="text-xs text-muted-foreground mt-0.5">Loading...</p>
        </div>
      </div>
    );
  }

  // If error, show error
  if (error) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border">
        <CreditCard className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold">Escrow Balance</p>
          <p className="text-xs text-muted-foreground mt-0.5">Error: {error.message}</p>
        </div>
      </div>
    );
  }

  // Calculate metrics from holds
  const holds = response?.holds || [];

  const inEscrowCents = holds
    .filter((hold) => hold.status === 'held')
    .reduce((sum, hold) => sum + (hold.grossAmountCents || 0), 0);

  const releasedCents = holds
    .filter((hold) => hold.status === 'released')
    .reduce((sum, hold) => sum + (hold.grossAmountCents || 0), 0);

  const activeCount = holds.filter((hold) => hold.status === 'held').length;
  const totalCents = inEscrowCents + releasedCents;

  // If no holds
  if (holds.length === 0) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border">
        <CreditCard className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold">Escrow Balance</p>
          <p className="text-xs text-muted-foreground mt-0.5">No active escrow holds.</p>
        </div>
      </div>
    );
  }

  // Display data
  let statusText = `R${(totalCents / 100).toFixed(2)} total`;
  if (inEscrowCents > 0) {
    statusText = `R${(inEscrowCents / 100).toFixed(2)} in escrow (${activeCount} active)`;
    if (releasedCents > 0) {
      statusText += ` • R${(releasedCents / 100).toFixed(2)} released`;
    }
  }

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border">
      <CreditCard className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-semibold">Escrow Balance</p>
        <p className="text-xs text-muted-foreground mt-0.5">{statusText}</p>
      </div>
    </div>
  );
}
