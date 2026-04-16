-- Migration: 010_identity_service_schema.sql
-- Purpose: Add missing columns for identity service + create user_sessions table

-- Add missing columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- Backfill profile_image_url from existing avatar_url
UPDATE users SET profile_image_url = avatar_url WHERE avatar_url IS NOT NULL AND profile_image_url IS NULL;

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  session_id    VARCHAR(36) PRIMARY KEY,
  user_id       VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address    VARCHAR(45),
  user_agent    TEXT,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at    TIMESTAMP NOT NULL,
  last_activity_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
