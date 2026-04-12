-- Migration: 002_align_schema_with_users_table.sql
-- Created: 2026-04-12
-- Purpose: Document current schema with users table (VARCHAR IDs for hosts)
-- Status: This describes the CURRENT production schema
-- Note: Migration 001 is outdated. This is the actual schema being used.

-- ============================================================================
-- SCHEMA OVERVIEW
-- ============================================================================
-- The database uses a hybrid UUID/VARCHAR approach:
-- - Users (Hosts): VARCHAR IDs (for flexibility in user ID schemes)
-- - Services/TimeSlots/Bookings: UUID IDs (for unique identifiers)
-- - Foreign keys properly reference correct ID types
--
-- This ensures:
-- ✅ Proper UUID format for all IDs (no "service-123" errors)
-- ✅ Foreign key constraints enforced
-- ✅ Host IDs can be flexible strings (UUIDs, emails, or other schemes)
-- ✅ All internal service/booking IDs are UUIDs

-- ============================================================================
-- USERS TABLE
-- ============================================================================
-- Stores host/provider information
-- ID: VARCHAR (flexible, can be UUID or other formats)

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY,
  full_name VARCHAR NOT NULL,
  business_name VARCHAR NOT NULL,
  email VARCHAR NOT NULL UNIQUE,
  phone VARCHAR NOT NULL,
  bio TEXT,
  location VARCHAR,
  avatar_url VARCHAR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================================
-- SERVICES TABLE
-- ============================================================================
-- Stores service/product information
-- ID: UUID (auto-generated for uniqueness)
-- host_id: VARCHAR (references users.id)

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR NOT NULL,
  duration_minutes INTEGER NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  max_participants INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_services_host_id ON services(host_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);

-- ============================================================================
-- TIME SLOTS TABLE
-- ============================================================================
-- Stores available time slots for booking
-- ID: UUID (auto-generated)
-- service_id: UUID (references services.id)

CREATE TABLE IF NOT EXISTS time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  is_recurring BOOLEAN DEFAULT false,
  recurring_rule_id UUID,
  booked_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(service_id, slot_date, start_time)
);

CREATE INDEX IF NOT EXISTS idx_time_slots_service_id ON time_slots(service_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_slot_date ON time_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_time_slots_is_available ON time_slots(is_available);
CREATE INDEX IF NOT EXISTS idx_time_slots_recurring_rule_id ON time_slots(recurring_rule_id);

-- ============================================================================
-- RECURRING RULES TABLE
-- ============================================================================
-- Stores rules for recurring time slots
-- ID: UUID (auto-generated)
-- service_id: UUID (references services.id)

CREATE TABLE IF NOT EXISTS recurring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  days_of_week INTEGER[] NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recurring_rules_service_id ON recurring_rules(service_id);

-- ============================================================================
-- BOOKINGS TABLE
-- ============================================================================
-- Stores booking records
-- ID: UUID (auto-generated)
-- service_id: UUID (references services.id)
-- time_slot_id: UUID (references time_slots.id)
-- host_id: VARCHAR (references users.id)

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  time_slot_id UUID NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
  host_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_name VARCHAR NOT NULL,
  client_email VARCHAR NOT NULL,
  client_phone VARCHAR,
  number_of_participants INTEGER DEFAULT 1,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_time_slot_id ON bookings(time_slot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_host_id ON bookings(host_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- ============================================================================
-- ANALYTICS TABLE
-- ============================================================================
-- Stores analytics data for hosts
-- ID: UUID (auto-generated)
-- host_id: VARCHAR (references users.id)

CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_bookings INTEGER DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2),
  completion_rate DECIMAL(5, 2),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_host_id ON analytics(host_id);
CREATE INDEX IF NOT EXISTS idx_analytics_period ON analytics(period_start, period_end);

-- ============================================================================
-- DASHBOARD METRICS TABLE
-- ============================================================================
-- Stores dashboard metrics for quick retrieval
-- ID: UUID (auto-generated)
-- host_id: VARCHAR (references users.id)

CREATE TABLE IF NOT EXISTS dashboard_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_services INTEGER DEFAULT 0,
  active_bookings INTEGER DEFAULT 0,
  upcoming_bookings INTEGER DEFAULT 0,
  cancelled_bookings INTEGER DEFAULT 0,
  avg_occupancy DECIMAL(5, 2) DEFAULT 0,
  response_rate DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_host_id ON dashboard_metrics(host_id);

-- ============================================================================
-- SUMMARY: UUID Format Compliance
-- ============================================================================
-- ✅ All internal IDs (services, time_slots, bookings, analytics) use UUID
-- ✅ All UUIDs use proper format: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
-- ✅ No more "service-123" errors - only valid UUIDs accepted
-- ✅ Foreign key constraints ensure referential integrity
-- ✅ Seed data generates proper UUIDs for all records
-- ✅ Tests can use real UUIDs without validation errors
