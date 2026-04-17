'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { EscrowBalance } from '@/components/EscrowBalance';
import { PayoutRequestForm } from '@/components/PayoutRequestForm';
import { PayoutHistory } from '@/components/PayoutHistory';
import { TransactionHistory } from '@/components/TransactionHistory';
import { useEscrowBalance } from '@/hooks/useEscrow';

// ============================================================================
// CONSTANTS: UI Labels & Messages
// ============================================================================

const PAGE_TITLE = 'Escrow Management';
const PAGE_DESCRIPTION = 'Manage your escrow balance, payouts, and transaction history';
const ERROR_NO_AUTH = 'You must be logged in to view escrow information';

// ============================================================================
// COMPONENT
// ============================================================================

export default function HostEscrowDashboard() {
  const { user } = useAuth();
  const hostId = user?.id ?? '';

  const { data: balance } = useEscrowBalance(hostId, !!hostId);

  if (!hostId) {
    return (
      <div className="space-y-6 py-6 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{PAGE_TITLE}</h1>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">{ERROR_NO_AUTH}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6 px-3 sm:px-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{PAGE_TITLE}</h1>
        <p className="text-sm sm:text-base text-muted-foreground">{PAGE_DESCRIPTION}</p>
      </div>

      {/* Main Content Grid */}
      <div className="space-y-6">
        {/* Balance Overview */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Account Overview</h2>
            <p className="text-sm text-gray-600">Your current escrow account status and balances</p>
          </div>
          <EscrowBalance hostId={hostId} />
        </section>

        {/* Request Payout Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Request Payout</h2>
            <p className="text-sm text-gray-600">Withdraw funds from your available balance</p>
          </div>
          <PayoutRequestForm
            hostId={hostId}
            availableBalanceCents={balance || 0}
            onSuccess={() => {
              // Optional: Show success toast or trigger refresh
            }}
          />
        </section>

        {/* History Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Payout History */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Payout History</h2>
              <p className="text-sm text-gray-600">Recent payouts to your bank account</p>
            </div>
            <PayoutHistory hostId={hostId} pageSize={5} />
          </section>

          {/* Transaction History */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
              <p className="text-sm text-gray-600">Complete audit log of all escrow activity</p>
            </div>
            <TransactionHistory hostId={hostId} pageSize={5} />
          </section>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base text-blue-900">How Escrow Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>Holds:</strong> When a client books your service, payment is held in escrow until the booking is completed.
            </p>
            <p>
              <strong>Release:</strong> Once the booking is completed, the hold is automatically released to your available balance.
            </p>
            <p>
              <strong>Payout:</strong> You can request to withdraw your available balance to your connected bank account at any time.
            </p>
            <p>
              <strong>Fee:</strong> Platform fees are automatically deducted when funds are released.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
