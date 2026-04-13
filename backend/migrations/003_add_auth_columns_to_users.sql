-- Migration: 003_add_auth_columns_to_users.sql
-- Created: 2026-04-12
-- Purpose: Add authentication fields to users table

-- Add authentication columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash VARCHAR NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS user_type VARCHAR DEFAULT 'host' CHECK (user_type IN ('host', 'client')),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index on email for faster authentication lookups
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, is_active);
