'use client';

import { useEscrowAccount } from '@/hooks/useEscrow';
import { formatCentsToZAR, getAccountStatusLabel } from '@/lib/escrow-api';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// ============================================================================
// CONSTANTS: UI Labels & Messages
// ============================================================================

const LABEL_HELD_BALANCE = 'Held Balance';
const LABEL_AVAILABLE_BALANCE = 'Available Balance';
const LABEL_TOTAL_RECEIVED = 'Total Received';
const LABEL_TOTAL_PAID_OUT = 'Total Paid Out';
const ERROR_FAILED_LOAD = 'Failed to load escrow balance';
const ERROR_REQUIRED_HOST_ID = 'Host ID is required';

// ============================================================================
// COMPONENT
// ============================================================================

interface EscrowBalanceProps {
  readonly hostId: string;
}

export function EscrowBalance({ hostId }: Readonly<EscrowBalanceProps>) {
  const { data: account, isLoading, error } = useEscrowAccount(hostId, !!hostId);

  if (!hostId) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{ERROR_REQUIRED_HOST_ID}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {['held', 'available', 'received', 'paidout'].map((key) => (
          <Card key={key}>
            <CardContent className="pt-6">
              <div className="mb-2 h-4 w-24 rounded bg-muted animate-pulse" />
              <div className="h-8 w-32 rounded bg-muted animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !account) {
    return (
      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-600">
            <AlertCircle className="h-5 w-5" />
            <span>{ERROR_FAILED_LOAD}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determine color based on balances
  const heldColor = account.heldBalanceCents > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground';
  const availableColor =
    account.availableBalanceCents > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground';
  
  const getStatusColor = (): string => {
    if (account.accountStatus === 'active') {
      return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300';
    }
    if (account.accountStatus === 'suspended') {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300';
    }
    return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300';
  };

  return (
    <div className="space-y-4">
      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Account Balance</h2>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor()}`}>
          {getAccountStatusLabel(account.accountStatus)}
        </span>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Held Balance */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">{LABEL_HELD_BALANCE}</p>
            <p className={`mt-2 text-2xl font-bold ${heldColor}`}>
              {formatCentsToZAR(account.heldBalanceCents)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Locked in bookings</p>
          </CardContent>
        </Card>

        {/* Available Balance */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">{LABEL_AVAILABLE_BALANCE}</p>
            <p className={`mt-2 text-2xl font-bold ${availableColor}`}>
              {formatCentsToZAR(account.availableBalanceCents)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Ready for payout</p>
          </CardContent>
        </Card>

        {/* Total Received */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">{LABEL_TOTAL_RECEIVED}</p>
            <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCentsToZAR(account.totalReceivedCents)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Lifetime</p>
          </CardContent>
        </Card>

        {/* Total Paid Out */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">{LABEL_TOTAL_PAID_OUT}</p>
            <p className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {formatCentsToZAR(account.totalPaidOutCents)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Lifetime</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
