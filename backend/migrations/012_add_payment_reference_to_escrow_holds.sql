-- Migration 012: Add payment_reference column to escrow_holds
-- Purpose: Track PayFast payment reference for each hold
-- Depends on: 011_create_escrow_schema.sql

BEGIN;

-- Add payment_reference column to escrow_holds table
ALTER TABLE escrow.escrow_holds
ADD COLUMN payment_reference VARCHAR(255);

-- Create index for payment reference lookups
CREATE INDEX idx_escrow_holds_payment_reference ON escrow.escrow_holds(payment_reference);

COMMIT;
