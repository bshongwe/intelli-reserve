'use client';

import { useState } from 'react';
import { useRequestPayout } from '@/hooks/useEscrow';
import { RequestPayoutSchema, getFieldErrors } from '@/schemas/escrow.schemas';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// ============================================================================
// CONSTANTS: UI Labels & Messages
// ============================================================================

const LABEL_AMOUNT = 'Payout Amount (USD)';
const LABEL_BANK_ACCOUNT = 'Bank Account';
const LABEL_REQUEST_PAYOUT = 'Request Payout';
const MSG_REQUESTING = 'Requesting Payout...';
const MSG_ERROR_DEFAULT = 'Failed to request payout';
const MSG_VALIDATION_ERROR = 'Please fix the errors below';
const MSG_MINIMUM_BALANCE = 'You need at least R16.26 to request a payout';
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
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">{LABEL_REQUEST_PAYOUT}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Available Balance: R${(availableBalanceCents / 100).toFixed(2)}
            </p>
          </div>

      {/* Validation Error Alert */}
      {validationError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive mt-0.5" />
            <div>
              <p className="font-medium text-destructive">{MSG_VALIDATION_ERROR}</p>
              <p className="mt-1 text-sm text-destructive/80">{validationError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Server Error Alert */}
      {isError && error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive mt-0.5" />
            <div>
              <p className="font-medium text-destructive">{MSG_ERROR_DEFAULT}</p>
              <p className="mt-1 text-sm text-destructive/80">
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
            <label htmlFor="amount" className="block text-sm font-medium">
              {LABEL_AMOUNT}
            </label>
            <div className="mt-1 relative">
              <span className="absolute left-3 top-3 text-muted-foreground">R$</span>
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
                className={`w-full rounded-lg border pl-7 pr-4 py-2 text-sm focus:outline-none focus:ring-2 disabled:bg-muted disabled:text-muted-foreground ${
                  fieldErrors.amountCents
                    ? 'border-destructive focus:ring-destructive'
                    : 'border-input focus:ring-primary'
                }`}
              />
            </div>
            {fieldErrors.amountCents && (
              <p className="mt-1 text-sm text-destructive">{fieldErrors.amountCents}</p>
            )}
          </div>

          {/* Bank Account Input */}
          <div>
            <label htmlFor="bank-account" className="block text-sm font-medium">
              {LABEL_BANK_ACCOUNT}
            </label>
            <select
              id="bank-account"
              value={bankAccountToken}
              onChange={(e) => setBankAccountToken(e.target.value)}
              disabled={isPending}
              className={`w-full rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 disabled:bg-muted disabled:text-muted-foreground ${
                fieldErrors.bankAccountToken
                  ? 'border-destructive focus:ring-destructive'
                  : 'border-input focus:ring-primary'
              }`}
            >
              <option value="">{PLACEHOLDER_BANK}</option>
              <option value="token-1">Chase Account ••••4242</option>
              <option value="token-2">Bank of America ••••8765</option>
            </select>
            {fieldErrors.bankAccountToken && (
              <p className="mt-1 text-sm text-destructive">{fieldErrors.bankAccountToken}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending || !amountUSD || !bankAccountToken}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
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
        <div className="rounded-lg border border-amber-200/50 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/20 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-700 dark:text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-300">Insufficient Balance</p>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">{MSG_MINIMUM_BALANCE}</p>
            </div>
          </div>
        </div>
      )}
        </form>
      </CardContent>
    </Card>
  );
}
