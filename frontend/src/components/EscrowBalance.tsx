'use client';

import { useEscrowAccount } from '@/hooks/useEscrow';
import { formatCentsToUSD, getAccountStatusLabel } from '@/lib/escrow-api';
import { AlertCircle } from 'lucide-react';

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
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span>{ERROR_REQUIRED_HOST_ID}</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`skeleton-${i}`} className="rounded-lg border border-gray-200 p-6">
            <div className="mb-2 h-4 w-24 rounded bg-gray-200 animate-pulse" />
            <div className="h-8 w-32 rounded bg-gray-200 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-2 text-amber-700">
          <AlertCircle className="h-5 w-5" />
          <span>{ERROR_FAILED_LOAD}</span>
        </div>
      </div>
    );
  }

  // Determine color based on balances
  const heldColor = account.heldBalanceCents > 0 ? 'text-yellow-600' : 'text-gray-600';
  const availableColor =
    account.availableBalanceCents > 0 ? 'text-green-600' : 'text-gray-600';
  
  const getStatusColor = (): string => {
    if (account.accountStatus === 'active') {
      return 'bg-green-100 text-green-800';
    }
    if (account.accountStatus === 'suspended') {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-red-100 text-red-800';
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
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-600">{LABEL_HELD_BALANCE}</p>
          <p className={`mt-2 text-2xl font-bold ${heldColor}`}>
            {formatCentsToUSD(account.heldBalanceCents)}
          </p>
          <p className="mt-1 text-xs text-gray-500">Locked in bookings</p>
        </div>

        {/* Available Balance */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-600">{LABEL_AVAILABLE_BALANCE}</p>
          <p className={`mt-2 text-2xl font-bold ${availableColor}`}>
            {formatCentsToUSD(account.availableBalanceCents)}
          </p>
          <p className="mt-1 text-xs text-gray-500">Ready for payout</p>
        </div>

        {/* Total Received */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-600">{LABEL_TOTAL_RECEIVED}</p>
          <p className="mt-2 text-2xl font-bold text-blue-600">
            {formatCentsToUSD(account.totalReceivedCents)}
          </p>
          <p className="mt-1 text-xs text-gray-500">Lifetime</p>
        </div>

        {/* Total Paid Out */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-600">{LABEL_TOTAL_PAID_OUT}</p>
          <p className="mt-2 text-2xl font-bold text-indigo-600">
            {formatCentsToUSD(account.totalPaidOutCents)}
          </p>
          <p className="mt-1 text-xs text-gray-500">Lifetime</p>
        </div>
      </div>
    </div>
  );
}
