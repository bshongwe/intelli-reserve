'use client';

import { useState } from 'react';
import { useTransactionHistory } from '@/hooks/useEscrow';
import { formatCentsToZAR, formatDate, getTransactionTypeLabel } from '@/lib/escrow-api';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

// ============================================================================
// CONSTANTS: UI Labels & Messages
// ============================================================================

const LABEL_TITLE = 'Transaction History';
const MSG_LOADING = 'Loading transactions...';
const MSG_NO_TRANSACTIONS = 'No transactions found';
const MSG_ERROR = 'Failed to load transaction history';
const MSG_PAGE_OF = 'Page {current} of {total}';

// ============================================================================
// CONSTANTS: Colors for Transaction Types
// ============================================================================

const TRANSACTION_COLOR: Record<string, string> = {
  hold: 'bg-yellow-50 text-yellow-800',
  release: 'bg-green-50 text-green-800',
  refund: 'bg-blue-50 text-blue-800',
  payout: 'bg-purple-50 text-purple-800',
  dispute: 'bg-red-50 text-red-800',
};

const TRANSACTION_BORDER: Record<string, string> = {
  hold: 'border-yellow-200',
  release: 'border-green-200',
  refund: 'border-blue-200',
  payout: 'border-purple-200',
  dispute: 'border-red-200',
};

// ============================================================================
// COMPONENT
// ============================================================================

interface TransactionHistoryProps {
  readonly hostId: string;
  readonly pageSize?: number;
}

export function TransactionHistory({
  hostId,
  pageSize = 10,
}: Readonly<TransactionHistoryProps>) {
  const [currentPage, setCurrentPage] = useState(1);

  const offset = (currentPage - 1) * pageSize;
  const { data: transactions, isLoading, error } = useTransactionHistory(
    hostId,
    pageSize,
    offset,
    !!hostId
  );

  const totalPages = transactions && transactions.length >= pageSize ? currentPage + 1 : currentPage;

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          <span className="text-sm text-gray-600">{MSG_LOADING}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">{MSG_ERROR}</p>
            <p className="mt-1 text-sm text-red-700">
              {error instanceof Error ? error.message : MSG_ERROR}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-gray-600">{MSG_NO_TRANSACTIONS}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{LABEL_TITLE}</h3>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {transactions.map((transaction) => {
          const typeColor = TRANSACTION_COLOR[transaction.transactionType] || 'bg-gray-50 text-gray-800';
          const typeBorder = TRANSACTION_BORDER[transaction.transactionType] || 'border-gray-200';
          const isPositive = transaction.amountCents > 0;
          const amountColor = isPositive ? 'text-green-600' : 'text-red-600';
          const amountPrefix = isPositive ? '+' : '';

          return (
            <div
              key={transaction.id}
              className={`rounded-lg border ${typeBorder} p-4 flex items-center justify-between gap-4 transition-colors hover:bg-gray-50`}
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${typeColor}`}>
                    {getTransactionTypeLabel(transaction.transactionType)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(transaction.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{transaction.reason}</p>
              </div>

              <div className="text-right">
                <p className={`font-semibold ${amountColor}`}>
                  {amountPrefix}
                  {formatCentsToZAR(Math.abs(transaction.amountCents))}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 rounded px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <span className="text-xs text-gray-600">
            {MSG_PAGE_OF.replace('{current}', currentPage.toString()).replace(
              '{total}',
              totalPages.toString()
            )}
          </span>

          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={transactions.length < pageSize}
            className="flex items-center gap-1 rounded px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
