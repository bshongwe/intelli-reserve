'use client';

import { useState } from 'react';
import { usePayoutHistory } from '@/hooks/useEscrow';
import { formatCentsToZAR, formatDate, getPayoutStatusLabel } from '@/lib/escrow-api';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// ============================================================================
// CONSTANTS: UI Labels & Messages
// ============================================================================

const LABEL_TITLE = 'Payout History';
const MSG_LOADING = 'Loading payouts...';
const MSG_NO_PAYOUTS = 'No payouts found';
const MSG_ERROR = 'Failed to load payout history';
const MSG_PAGE_OF = 'Page {current} of {total}';
const MSG_REQUESTED = 'Requested';
const MSG_TO_ACCOUNT = 'to account';

// ============================================================================
// CONSTANTS: Colors for Payout Status
// ============================================================================

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  processing: 'bg-blue-50 text-blue-800 border-blue-200',
  completed: 'bg-green-50 text-green-800 border-green-200',
  failed: 'bg-red-50 text-red-800 border-red-200',
};

const STATUS_DOT: Record<string, string> = {
  pending: 'bg-yellow-500',
  processing: 'bg-blue-500 animate-pulse',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
};

// ============================================================================
// COMPONENT
// ============================================================================

interface PayoutHistoryProps {
  readonly hostId: string;
  readonly pageSize?: number;
}

export function PayoutHistory({
  hostId,
  pageSize = 10,
}: Readonly<PayoutHistoryProps>) {
  const [currentPage, setCurrentPage] = useState(1);

  const offset = (currentPage - 1) * pageSize;
  const { data: payouts, isLoading, error } = usePayoutHistory(
    hostId,
    pageSize,
    offset,
    !!hostId
  );

  const totalPages = payouts && payouts.length >= pageSize ? currentPage + 1 : currentPage;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
            <span className="text-sm text-muted-foreground">{MSG_LOADING}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive mt-0.5" />
            <div>
              <p className="font-medium text-destructive">{MSG_ERROR}</p>
              <p className="mt-1 text-sm text-destructive/80">
                {error instanceof Error ? error.message : MSG_ERROR}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!payouts || payouts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground">{MSG_NO_PAYOUTS}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{LABEL_TITLE}</h3>
      </div>

      {/* Payouts List */}
      <div className="space-y-3">
        {payouts.map((payout) => {
          const statusClass = STATUS_COLOR[payout.status] || STATUS_COLOR.pending;
          const dotColor = STATUS_DOT[payout.status] || STATUS_DOT.pending;

          return (
            <div
              key={payout.id}
              className={`rounded-lg border p-4 flex items-center justify-between gap-4 transition-colors hover:bg-gray-50 ${statusClass}`}
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${dotColor}`} />
                  <span className="text-sm font-semibold">
                    {MSG_REQUESTED} {formatDate(payout.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {MSG_TO_ACCOUNT} {payout.bankAccountToken}
                </p>
                <p className="text-xs text-muted-foreground">
                  Status: {getPayoutStatusLabel(payout.status)}
                </p>
              </div>

              <div className="text-right">
                <p className="font-semibold text-lg">
                  {formatCentsToZAR(payout.amountCents)}
                </p>
                <p className="text-xs text-muted-foreground">Payout ID: {payout.id.substring(0, 8)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 rounded px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <span className="text-xs text-muted-foreground">
            {MSG_PAGE_OF.replace('{current}', currentPage.toString()).replace(
              '{total}',
              totalPages.toString()
            )}
          </span>

          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={payouts.length < pageSize}
            className="flex items-center gap-1 rounded px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
      </CardContent>
    </Card>
  );
}
