'use client';

import { useState } from 'react';
import { useOpenDispute } from '@/hooks/useEscrow';
import { OpenDisputeSchema, getFieldErrors } from '@/schemas/escrow.schemas';
import { AlertCircle, Loader2 } from 'lucide-react';

// ============================================================================
// CONSTANTS: UI Labels & Messages
// ============================================================================

const LABEL_REASON = 'Dispute Reason';
const LABEL_OPEN_DISPUTE = 'Open Dispute';
const MSG_OPENING = 'Opening Dispute...';
const MSG_ERROR_DEFAULT = 'Failed to open dispute';
const MSG_VALIDATION_ERROR = 'Please fix the errors below';
const PLACEHOLDER_REASON = 'Describe the issue...';
const HINT_MIN_LENGTH = 'Minimum 10 characters';
const HINT_MAX_LENGTH = 'Maximum 500 characters';

// ============================================================================
// COMPONENT
// ============================================================================

interface DisputeFormProps {
  readonly bookingId: string;
  readonly holdId: string;
  readonly userId: string;
  readonly onSuccess?: () => void;
}

export function DisputeForm({
  bookingId,
  holdId,
  userId,
  onSuccess,
}: Readonly<DisputeFormProps>) {
  const [reason, setReason] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  const { mutate: openDispute, isPending, isError, error } = useOpenDispute();

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});
    setValidationError(null);

    // Validate
    try {
      OpenDisputeSchema.parse({
        holdId,
        reason,
      });
    } catch (error: any) {
      const errors = getFieldErrors(error);
      setFieldErrors(errors);
      setValidationError(MSG_VALIDATION_ERROR);
      return;
    }

    // Submit
    openDispute(
      {
        bookingId,
        holdId,
        initiatedByUserId: userId,
        reason,
      },
      {
        onSuccess: () => {
          setReason('');
          onSuccess?.();
        },
      }
    );
  };

  const reasonLength = reason.length;
  const isValid = reasonLength >= 10 && reasonLength <= 500;
  const showHint = reasonLength > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{LABEL_OPEN_DISPUTE}</h3>
        <p className="mt-1 text-sm text-gray-600">
          Please provide details about the dispute for our resolution team.
        </p>
      </div>

      {/* Validation Error Alert */}
      {validationError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">{MSG_VALIDATION_ERROR}</p>
              <p className="mt-1 text-sm text-red-700">{validationError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Server Error Alert */}
      {isError && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">{MSG_ERROR_DEFAULT}</p>
              <p className="mt-1 text-sm text-red-700">
                {error instanceof Error ? error.message : MSG_ERROR_DEFAULT}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reason Textarea */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
            {LABEL_REASON}
          </label>
          {showHint && (
            <span className={`text-xs font-medium ${isValid ? 'text-green-600' : 'text-gray-500'}`}>
              {reasonLength}/500 {isValid ? '✓' : ''}
            </span>
          )}
        </div>
        <textarea
          id="reason"
          rows={5}
          placeholder={PLACEHOLDER_REASON}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={isPending}
          maxLength={500}
          className={`w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-500 resize-none ${
            fieldErrors.reason
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {fieldErrors.reason && (
          <p className="text-sm text-red-600">{fieldErrors.reason}</p>
        )}
        {!fieldErrors.reason && showHint && (
          <p className={`text-xs ${reasonLength < 10 ? 'text-amber-600' : 'text-gray-500'}`}>
            {reasonLength < 10
              ? `${HINT_MIN_LENGTH} (${10 - reasonLength} more)`
              : HINT_MAX_LENGTH}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending || !isValid}
        className="w-full rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {MSG_OPENING}
          </>
        ) : (
          LABEL_OPEN_DISPUTE
        )}
      </button>

      {/* Info Box */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">Note:</span> Our dispute resolution team will review your case and contact you within 24-48 hours.
        </p>
      </div>
    </form>
  );
}
