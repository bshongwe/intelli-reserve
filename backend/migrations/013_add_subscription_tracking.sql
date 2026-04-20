-- Migration: 013_add_subscription_tracking.sql
-- Created: 2026-04-19
-- Purpose: Add subscription and trial period tracking to support trial-to-paid conversion flow

-- ============================================================================
-- CREATE SUBSCRIPTION PLANS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  monthly_price_cents INTEGER NOT NULL DEFAULT 0,
  max_bookings_per_month INTEGER,
  has_advanced_analytics BOOLEAN DEFAULT false,
  has_dynamic_pricing BOOLEAN DEFAULT false,
  has_priority_support BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ADD SUBSCRIPTION COLUMNS TO USERS TABLE
-- ============================================================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES subscription_plans(id),
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'starter' CHECK (subscription_status IN ('starter', 'professional', 'enterprise', 'trial_expired')),
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_trial_used BOOLEAN DEFAULT false;

-- ============================================================================
-- CREATE SUBSCRIPTION TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('trial_started', 'trial_expired', 'subscription_activated', 'subscription_renewed', 'subscription_cancelled', 'downgrade')),
  amount_cents INTEGER DEFAULT 0,
  payment_reference VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_subscription_plan ON users(subscription_plan_id);
CREATE INDEX IF NOT EXISTS idx_users_trial_expires ON users(trial_expires_at) WHERE trial_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_user ON subscription_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_type ON subscription_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_created ON subscription_transactions(created_at);

-- ============================================================================
-- SEED SUBSCRIPTION PLANS
-- ============================================================================
INSERT INTO subscription_plans (name, display_name, description, monthly_price_cents, max_bookings_per_month, has_advanced_analytics, has_dynamic_pricing, has_priority_support)
VALUES 
  ('starter', 'Starter', 'Perfect for getting started', 0, 10, false, false, false),
  ('professional', 'Professional', 'For growing businesses', 29900, NULL, true, true, true),
  ('enterprise', 'Enterprise', 'For large organizations', 0, NULL, true, true, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- DATA MIGRATION: Assign Starter Plan to All Existing Users
-- ============================================================================
-- This ensures all existing users are on the Starter plan by default
UPDATE users
SET 
  subscription_plan_id = (SELECT id FROM subscription_plans WHERE name = 'starter' LIMIT 1),
  subscription_status = 'starter',
  is_trial_used = false,
  subscription_started_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP
WHERE subscription_plan_id IS NULL;

-- Log initial subscription assignment for audit trail
INSERT INTO subscription_transactions (user_id, subscription_plan_id, transaction_type, status, notes)
SELECT 
  u.id,
  (SELECT id FROM subscription_plans WHERE name = 'starter' LIMIT 1),
  'subscription_activated',
  'completed',
  'Initial Starter plan assigned during migration'
FROM users u
WHERE u.subscription_status = 'starter' 
  AND u.is_trial_used = false
  AND u.subscription_started_at >= CURRENT_TIMESTAMP - INTERVAL '1 minute'
  AND NOT EXISTS (
    SELECT 1 FROM subscription_transactions st
    WHERE st.user_id = u.id 
      AND st.transaction_type = 'subscription_activated'
  );

-- ============================================================================
-- CREATE FUNCTION: Check Trial Expiration Status
-- ============================================================================
CREATE OR REPLACE FUNCTION check_trial_expiration()
RETURNS TABLE(user_id UUID, should_expire BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    (u.trial_expires_at < CURRENT_TIMESTAMP AND u.subscription_status = 'professional')::boolean
  FROM users u
  WHERE u.is_trial_used = true 
    AND u.trial_expires_at IS NOT NULL
    AND u.subscription_status IN ('professional', 'trial_expired');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE FUNCTION: Auto-downgrade Expired Trials
-- ============================================================================
CREATE OR REPLACE FUNCTION auto_downgrade_expired_trials()
RETURNS void AS $$
BEGIN
  UPDATE users
  SET 
    subscription_status = 'trial_expired',
    subscription_plan_id = (SELECT id FROM subscription_plans WHERE name = 'starter'),
    updated_at = CURRENT_TIMESTAMP
  WHERE 
    is_trial_used = true
    AND trial_expires_at < CURRENT_TIMESTAMP
    AND subscription_status = 'professional'
    AND last_payment_date IS NULL;

  -- Log the downgrade transactions
  INSERT INTO subscription_transactions (user_id, subscription_plan_id, transaction_type, status)
  SELECT 
    u.id,
    (SELECT id FROM subscription_plans WHERE name = 'starter'),
    'downgrade',
    'completed'
  FROM users u
  WHERE 
    is_trial_used = true
    AND trial_expires_at < CURRENT_TIMESTAMP
    AND subscription_status = 'trial_expired'
    AND last_payment_date IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM subscription_transactions st
      WHERE st.user_id = u.id 
        AND st.transaction_type = 'downgrade'
        AND st.created_at > CURRENT_TIMESTAMP - INTERVAL '1 day'
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENT: Usage Instructions
-- ============================================================================
-- 
-- TRIAL FLOW:
-- 1. User clicks "Start Free Trial" button
-- 2. System creates entry with:
--    - subscription_status = 'professional'
--    - is_trial_used = true
--    - trial_started_at = NOW()
--    - trial_expires_at = NOW() + 14 days
--
-- 2. Call auto_downgrade_expired_trials() daily (via cron/scheduler)
--    - If trial_expires_at < NOW() and no payment made:
--      - Set subscription_status = 'trial_expired'
--      - Downgrade to 'starter' plan
--      - Log transaction
--
-- PAID FLOW:
-- 1. User clicks "Get Started" or makes payment during trial
-- 2. System creates entry with:
--    - subscription_plan_id = professional_id
--    - subscription_status = 'professional'
--    - is_trial_used = false (for "Get Started") or true (for trial → paid)
--    - last_payment_date = NOW()
--    - next_billing_date = NOW() + 30 days
--
