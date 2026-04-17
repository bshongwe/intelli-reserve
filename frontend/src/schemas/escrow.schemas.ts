/**
 * Escrow Service Validation Schemas
 * Zod schemas for client-side form validation
 */

import { z } from 'zod';

// ============================================================================
// CONSTANTS: Error Messages
// ============================================================================

const MSG_REQUIRED = 'This field is required';
const MSG_MIN_LENGTH = 'Must be at least';
const MSG_REASON_REQUIRED = 'Please provide a reason';

// ============================================================================
// PAYOUT SCHEMAS
// ============================================================================

export const RequestPayoutSchema = z.object({
  amountCents: z
    .number()
    .int('Amount must be a whole number')
    .positive('Amount must be greater than 0')
    .refine(
      (val) => val <= 999999999,
      'Amount is too large'
    ),
  bankAccountToken: z
    .string()
    .min(1, MSG_REQUIRED),
});

export type RequestPayoutInput = z.infer<typeof RequestPayoutSchema>;

// ============================================================================
// DISPUTE SCHEMAS
// ============================================================================

export const OpenDisputeSchema = z.object({
  holdId: z
    .string()
    .min(1, MSG_REQUIRED),
  reason: z
    .string()
    .min(10, `${MSG_REASON_REQUIRED} (${MSG_MIN_LENGTH} 10 characters)`)
    .max(500, 'Reason must be less than 500 characters'),
});

export type OpenDisputeInput = z.infer<typeof OpenDisputeSchema>;

// ============================================================================
// HOLD SCHEMAS
// ============================================================================

export const ReleaseHoldSchema = z.object({
  holdId: z
    .string()
    .min(1, MSG_REQUIRED),
});

export type ReleaseHoldInput = z.infer<typeof ReleaseHoldSchema>;

export const RefundHoldSchema = z.object({
  holdId: z
    .string()
    .min(1, MSG_REQUIRED),
  reason: z
    .string()
    .optional(),
});

export type RefundHoldInput = z.infer<typeof RefundHoldSchema>;

// ============================================================================
// UTILITY: Zod Error Extraction
// ============================================================================

/**
 * Extract first error message from Zod validation error
 */
export function getFirstError(error: z.ZodError): string {
  const issue = error.issues[0];
  if (issue) {
    return `${issue.path.join('.')}: ${issue.message}`;
  }
  return 'Validation failed';
}

/**
 * Extract all field errors from Zod validation error
 */
export function getFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  
  error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    if (!fieldErrors[path]) {
      fieldErrors[path] = issue.message;
    }
  });
  
  return fieldErrors;
}
