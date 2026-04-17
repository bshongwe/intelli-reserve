'use client';

import { useState } from 'react';
import { useHold, useReleaseHold, useRefundHold } from '@/hooks/useEscrow';
import { formatCentsToUSD, formatDate, getHoldStatusLabel } from '@/lib/escrow-api';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';

// ============================================================================
// CONSTANTS: UI Labels & Messages
// ============================================================================

const LABEL_TITLE = 'Hold Details';
const LABEL_BOOKING_ID = 'Booking ID';
const LABEL_STATUS = 'Status';
const LABEL_GROSS = 'Gross Amount';
const LABEL_PLATFORM_FEE = 'Platform Fee';
const LABEL_HOST_AMOUNT = 'Host Amount';
const LABEL_CREATED = 'Created';
const LABEL_RELEASE = 'Release Hold';
const LABEL_REFUND = 'Refund Hold';
const LABEL_REFUND_REASON = 'Reason for Refund (Optional)';
const MSG_LOADING = 'Loading hold details...';
const MSG_ERROR = 'Failed to load hold details';
const MSG_RELEASING = 'Releasing...';
const MSG_REFUNDING = 'Refunding...';
const MSG_SUCCESS_RELEASE = 'Hold released successfully';
const MSG_SUCCESS_REFUND = 'Hold refunded successfully';
const PLACEHOLDER_REFUND_REASON = 'Enter reason...';

// ============================================================================
// COMPONENT
// ============================================================================

interface HoldDetailsProps {
  readonly holdId: string;
  readonly hostId: string;
  readonly onActionSuccess?: () => void;
}

export function HoldDetails({
  holdId,
  hostId,
  onActionSuccess,
}: Readonly<HoldDetailsProps>) {
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: hold, isLoading, error } = useHold(holdId, !!holdId);
  const { mutate: releaseHold, isPending: isReleasing, isError: releaseError } = useReleaseHold();
  const { mutate: refundHold, isPending: isRefunding, isError: refundError } = useRefundHold();

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

  if (error || !hold) {
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

  const canRelease = hold.status === 'pending';
  const canRefund = hold.status === 'pending';

  const handleRelease = () => {
    releaseHold(
      { holdId, hostId },
      {
        onSuccess: () => {
          setSuccessMessage(MSG_SUCCESS_RELEASE);
          onActionSuccess?.();
          setTimeout(() => setSuccessMessage(null), 5000);
        },
      }
    );
  };

  const handleRefund = () => {
    refundHold(
      { holdId, hostId, reason: refundReason || undefined },
      {
        onSuccess: () => {
          setSuccessMessage(MSG_SUCCESS_REFUND);
          setShowRefundForm(false);
          setRefundReason('');
          onActionSuccess?.();
          setTimeout(() => setSuccessMessage(null), 5000);
        },
      }
    );
  };

  const getStatusColor = (): string => {
    if (hold.status === 'pending') {
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
    if (hold.status === 'released') {
      return 'bg-green-100 text-green-800 border-green-300';
    }
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  return (
    <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{LABEL_TITLE}</h3>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600 mt-0.5" />
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Hold Information */}
      <div className="space-y-3 border-b border-gray-200 pb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-600">{LABEL_BOOKING_ID}</p>
            <p className="font-mono text-sm font-semibold text-gray-900">{hold.bookingId}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">{LABEL_STATUS}</p>
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold border ${getStatusColor()}`}>
              {getHoldStatusLabel(hold.status)}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-600">{LABEL_CREATED}</p>
            <p className="text-sm text-gray-900">{formatDate(hold.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Hold ID</p>
            <p className="font-mono text-sm text-gray-600">{hold.id.substring(0, 12)}...</p>
          </div>
        </div>
      </div>

      {/* Amount Breakdown */}
      <div className="space-y-3 border-b border-gray-200 pb-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{LABEL_GROSS}</span>
            <span className="font-semibold text-gray-900">
              {formatCentsToUSD(hold.grossAmountCents)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{LABEL_PLATFORM_FEE}</span>
            <span className="font-semibold text-amber-600">
              -{formatCentsToUSD(hold.platformFeeCents)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 pt-2">
            <span className="text-sm font-medium text-gray-900">{LABEL_HOST_AMOUNT}</span>
            <span className="text-lg font-bold text-green-600">
              {formatCentsToUSD(hold.hostAmountCents)}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-600">{hold.holdReason}</p>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* Release Button */}
        {canRelease && (
          <button
            onClick={handleRelease}
            disabled={isReleasing || isRefunding}
            className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {isReleasing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {MSG_RELEASING}
              </>
            ) : (
              LABEL_RELEASE
            )}
          </button>
        )}

        {/* Refund Section */}
        {canRefund && (
          <>
            {showRefundForm ? (
              <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div>
                  <label htmlFor="reason" className="block text-xs font-medium text-gray-700">
                    {LABEL_REFUND_REASON}
                  </label>
                  <textarea
                    id="reason"
                    rows={3}
                    placeholder={PLACEHOLDER_REFUND_REASON}
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    disabled={isRefunding}
                    maxLength={200}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowRefundForm(false);
                      setRefundReason('');
                    }}
                    disabled={isRefunding}
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRefund}
                    disabled={isRefunding || isReleasing}
                    className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  >
                    {isRefunding ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {MSG_REFUNDING}
                      </>
                    ) : (
                      'Confirm Refund'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowRefundForm(true)}
                disabled={isReleasing || isRefunding}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {LABEL_REFUND}
              </button>
            )}
          </>
        )}

        {/* Error Alert */}
        {(releaseError || refundError) && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-xs text-red-700">Operation failed. Please try again.</p>
          </div>
        )}

        {/* Status Messages */}
        {hold.status === 'released' && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3">
            <p className="text-xs text-green-800">This hold has been released to your available balance.</p>
          </div>
        )}
        {hold.status === 'refunded' && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs text-blue-800">This hold has been refunded to the client.</p>
          </div>
        )}
      </div>
    </div>
  );
}
