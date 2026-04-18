-- Migration 012: Add Payment Reference to Escrow Holds
-- Purpose: Track PayFast payment reference IDs for holds
-- This enables linking escrow holds to actual payment processor transactions
-- Rollback: ALTER TABLE escrow.escrow_holds DROP COLUMN IF EXISTS payment_reference;

BEGIN;

-- Add payment_reference column to escrow_holds table
-- This stores the PayFast transaction reference ID for payment holds
ALTER TABLE escrow.escrow_holds
ADD COLUMN payment_reference VARCHAR(255);

-- Add index for lookups by payment reference
CREATE INDEX idx_escrow_holds_payment_reference ON escrow.escrow_holds(payment_reference);

-- Update metadata
COMMENT ON COLUMN escrow.escrow_holds.payment_reference IS 'PayFast payment reference ID for this hold (e.g., m123456789)';

COMMIT;
