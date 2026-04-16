-- Migration 011: Create Escrow Service Schema
-- Dependencies: Requires 010_identity_service_schema.sql to complete
-- Rollback: DROP SCHEMA IF EXISTS escrow CASCADE;

BEGIN;

-- Create escrow schema to isolate escrow-specific tables
CREATE SCHEMA IF NOT EXISTS escrow;

-- NOTE: Table creation order matters due to foreign key constraints
-- 1. escrow_accounts (referenced by holds, payouts, transactions)
-- 2. escrow_holds (referenced by disputes, transactions)
-- 3. payouts (referenced by transactions)
-- 4. escrow_transactions
-- 5. disputes (references holds)

-- ============================================================================
-- ESCROW_ACCOUNTS: Virtual wallets for hosts
-- ============================================================================
-- Purpose: Track held and available funds for each host
-- Constraints: Balances cannot go negative
-- ============================================================================

CREATE TABLE escrow.escrow_accounts (
  id VARCHAR(36) PRIMARY KEY,
  host_id VARCHAR(36) NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Account balances (in cents, never use floats for money)
  held_balance INT NOT NULL DEFAULT 0 CHECK (held_balance >= 0),
  available_balance INT NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  total_received INT NOT NULL DEFAULT 0,
  total_paid_out INT NOT NULL DEFAULT 0,
  
  -- Account metadata
  account_status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'suspended', 'closed')),
  
  -- Reconciliation
  last_reconciled_at TIMESTAMP,
  reconciliation_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (reconciliation_status IN ('pending', 'reconciled', 'disputed')),
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_escrow_accounts_host_id ON escrow.escrow_accounts(host_id);
CREATE INDEX idx_escrow_accounts_status ON escrow.escrow_accounts(account_status);

-- ============================================================================
-- ESCROW_HOLDS: Per-booking payment holds
-- ============================================================================
-- Purpose: Track individual payment holds for each booking
-- Lifecycle: created → held → released/refunded
-- ============================================================================

CREATE TABLE escrow.escrow_holds (
  id VARCHAR(36) PRIMARY KEY,
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  host_id VARCHAR(36) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_id VARCHAR(36) REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Payment details (in cents)
  gross_amount INT NOT NULL CHECK (gross_amount > 0),
  platform_fee INT NOT NULL DEFAULT 0 CHECK (platform_fee >= 0),
  host_amount INT NOT NULL CHECK (host_amount > 0),
  
  -- Hold status
  hold_status VARCHAR(20) NOT NULL DEFAULT 'held'
    CHECK (hold_status IN ('held', 'released', 'refunded', 'disputed')),
  
  -- Context
  hold_reason VARCHAR(255),
  
  -- Release/Refund tracking
  released_at TIMESTAMP,
  refunded_at TIMESTAMP,
  refund_reason VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_escrow_holds_booking_id ON escrow.escrow_holds(booking_id);
CREATE INDEX idx_escrow_holds_host_id ON escrow.escrow_holds(host_id);
CREATE INDEX idx_escrow_holds_client_id ON escrow.escrow_holds(client_id);
CREATE INDEX idx_escrow_holds_status ON escrow.escrow_holds(hold_status);
CREATE INDEX idx_escrow_holds_created_at ON escrow.escrow_holds(created_at);

-- ============================================================================
-- PAYOUTS: Payout transactions to host bank accounts
-- ============================================================================
-- Purpose: Track payout requests and their status
-- Lifecycle: pending → processing → completed/failed
-- ============================================================================

CREATE TABLE escrow.payouts (
  id VARCHAR(36) PRIMARY KEY,
  host_id VARCHAR(36) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  escrow_account_id VARCHAR(36) NOT NULL REFERENCES escrow.escrow_accounts(id) ON DELETE CASCADE,
  
  -- Payout details
  amount INT NOT NULL CHECK (amount > 0),
  payout_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (payout_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Payment processor reference
  bank_account_token VARCHAR(255),
  external_transaction_id VARCHAR(255),
  failure_reason VARCHAR(255),
  
  -- Dates
  requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processing_started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payouts_host_id ON escrow.payouts(host_id);
CREATE INDEX idx_payouts_status ON escrow.payouts(payout_status);
CREATE INDEX idx_payouts_created_at ON escrow.payouts(created_at);
CREATE INDEX idx_payouts_external_transaction_id ON escrow.payouts(external_transaction_id);

-- ============================================================================
-- ESCROW_TRANSACTIONS: Immutable audit log
-- ============================================================================
-- Purpose: Write-only append log for compliance and reconciliation
-- Note: Never update, only insert
-- ============================================================================

CREATE TABLE escrow.escrow_transactions (
  id VARCHAR(36) PRIMARY KEY,
  escrow_account_id VARCHAR(36) NOT NULL REFERENCES escrow.escrow_accounts(id) ON DELETE CASCADE,
  
  -- Transaction type and amount
  transaction_type VARCHAR(30) NOT NULL
    CHECK (transaction_type IN ('hold_placed', 'hold_released', 'hold_refunded', 'payout_initiated', 'payout_completed', 'fee_charged', 'adjustment')),
  
  amount INT NOT NULL CHECK (amount != 0),
  
  -- Context references
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  payout_id VARCHAR(36) REFERENCES escrow.payouts(id) ON DELETE SET NULL,
  hold_id VARCHAR(36) REFERENCES escrow.escrow_holds(id) ON DELETE SET NULL,
  
  -- Running balances
  balance_before INT NOT NULL,
  balance_after INT NOT NULL,
  
  -- Description
  description VARCHAR(255),
  
  -- Timestamp (immutable)
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_escrow_transactions_account_id ON escrow.escrow_transactions(escrow_account_id);
CREATE INDEX idx_escrow_transactions_type ON escrow.escrow_transactions(transaction_type);
CREATE INDEX idx_escrow_transactions_created_at ON escrow.escrow_transactions(created_at);

-- ============================================================================
-- DISPUTES: Disagreement resolution
-- ============================================================================
-- Purpose: Track disputes between hosts and clients
-- Lifecycle: open → under_review → resolved/escalated
-- ============================================================================

CREATE TABLE escrow.disputes (
  id VARCHAR(36) PRIMARY KEY,
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  host_id VARCHAR(36) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_id VARCHAR(36) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  hold_id VARCHAR(36) REFERENCES escrow.escrow_holds(id) ON DELETE SET NULL,
  
  -- Dispute details
  dispute_reason VARCHAR(100) NOT NULL
    CHECK (dispute_reason IN ('service_not_provided', 'service_quality_issue', 'unauthorized_charge', 'duplicate_charge', 'other')),
  dispute_description TEXT NOT NULL,
  
  -- Resolution
  dispute_status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (dispute_status IN ('open', 'under_review', 'awaiting_response', 'resolved', 'escalated')),
  
  resolution_notes TEXT,
  resolution_type VARCHAR(20)
    CHECK (resolution_type IN ('full_refund', 'partial_refund', 'no_refund') OR resolution_type IS NULL),
  
  -- Timeline
  opened_at TIMESTAMP NOT NULL DEFAULT NOW(),
  under_review_at TIMESTAMP,
  resolved_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_disputes_booking_id ON escrow.disputes(booking_id);
CREATE INDEX idx_disputes_host_id ON escrow.disputes(host_id);
CREATE INDEX idx_disputes_client_id ON escrow.disputes(client_id);
CREATE INDEX idx_disputes_status ON escrow.disputes(dispute_status);
CREATE INDEX idx_disputes_created_at ON escrow.disputes(created_at);

COMMIT;
