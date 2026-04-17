'use client';

import { useState } from 'react';
import { useRequestPayout } from '@/hooks/useEscrow';
import { RequestPayoutSchema, getFieldErrors } from '@/schemas/escrow.schemas';
import { AlertCircle, Loader2 } from 'lucide-react';

// ============================================================================
// CONSTANTS: UI Labels & Messages
// ============================================================================

const LABEL_AMOUNT = 'Payout Amount (USD)';
const LABEL_BANK_ACCOUNT = 'Bank Account';
const LABEL_REQUEST_PAYOUT = 'Request Payout';
const MSG_REQUESTING = 'Requesting Payout...';
const MSG_ERROR_DEFAULT = 'Failed to request payout';
const MSG_VALIDATION_ERROR = 'Please fix the errors below';
const MSG_MINIMUM_BALANCE = 'You need at least $1.00 to request a payout';
const PLACEHOLDER_AMOUNT = '0.00';
const PLACEHOLDER_BANK = 'Select your bank account';

// ============================================================================
// COMPONENT
// ============================================================================

interface PayoutRequestFormProps {
  readonly hostId: string;
  readonly availableBalanceCents: number;
  readonly onSuccess?: () => void;
}

export function PayoutRequestForm({
  hostId,
  availableBalanceCents,
  onSuccess,
}: Readonly<PayoutRequestFormProps>) {
  const [amountUSD, setAmountUSD] = useState('');
  const [bankAccountToken, setBankAccountToken] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  const { mutate: requestPayout, isPending, isError, error } = useRequestPayout();

  const minimumPayoutCents = 100; // $1.00 minimum
  const canPayout = availableBalanceCents >= minimumPayoutCents;

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});
    setValidationError(null);

    // Convert USD to cents
    const amountCents = Math.round(Number.parseFloat(amountUSD) * 100);

    // Validate
    try {
      RequestPayoutSchema.parse({
        amountCents,
        bankAccountToken,
      });
    } catch (error: any) {
      const errors = getFieldErrors(error);
      setFieldErrors(errors);
      setValidationError(MSG_VALIDATION_ERROR);
      return;
    }

    // Check against available balance
    if (amountCents > availableBalanceCents) {
      setValidationError(
        `Requested amount ($${(amountCents / 100).toFixed(2)}) exceeds available balance ($${(availableBalanceCents / 100).toFixed(2)})`
      );
      return;
    }

    // Submit
    requestPayout(
      {
        hostId,
        amountCents,
        bankAccountToken,
      },
      {
        onSuccess: () => {
          setAmountUSD('');
          setBankAccountToken('');
          onSuccess?.();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{LABEL_REQUEST_PAYOUT}</h3>
        <p className="mt-1 text-sm text-gray-600">
          Available Balance: ${(availableBalanceCents / 100).toFixed(2)}
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

      {/* Form Fields */}
      {canPayout ? (
        <div className="space-y-4">
          {/* Amount Input */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              {LABEL_AMOUNT}
            </label>
            <div className="mt-1 relative">
              <span className="absolute left-3 top-3 text-gray-600">$</span>
              <input
                type="number"
                id="amount"
                step="0.01"
                min="0.01"
                max={(availableBalanceCents / 100).toFixed(2)}
                placeholder={PLACEHOLDER_AMOUNT}
                value={amountUSD}
                onChange={(e) => setAmountUSD(e.target.value)}
                disabled={isPending}
                className={`w-full rounded-lg border pl-7 pr-4 py-2 text-sm focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-500 ${
                  fieldErrors.amountCents
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
            </div>
            {fieldErrors.amountCents && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.amountCents}</p>
            )}
          </div>

          {/* Bank Account Input */}
          <div>
            <label htmlFor="bank-account" className="block text-sm font-medium text-gray-700">
              {LABEL_BANK_ACCOUNT}
            </label>
            <select
              id="bank-account"
              value={bankAccountToken}
              onChange={(e) => setBankAccountToken(e.target.value)}
              disabled={isPending}
              className={`w-full rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-500 ${
                fieldErrors.bankAccountToken
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            >
              <option value="">{PLACEHOLDER_BANK}</option>
              <option value="token-1">Chase Account ••••4242</option>
              <option value="token-2">Bank of America ••••8765</option>
            </select>
            {fieldErrors.bankAccountToken && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.bankAccountToken}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending || !amountUSD || !bankAccountToken}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {MSG_REQUESTING}
              </>
            ) : (
              LABEL_REQUEST_PAYOUT
            )}
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Insufficient Balance</p>
              <p className="mt-1 text-sm text-amber-700">{MSG_MINIMUM_BALANCE}</p>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
