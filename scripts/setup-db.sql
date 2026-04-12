-- Intelli Reserve Database Setup Script
-- This script creates all required tables for the BFF and backend

-- ============================================================================
-- USERS TABLE (Create first - no dependencies)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY, -- host_id format
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_time_slots_service_id ON time_slots(service_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_slot_date ON time_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_time_slots_is_available ON time_slots(is_available);
CREATE INDEX IF NOT EXISTS idx_time_slots_recurring_rule_id ON time_slots(recurring_rule_id);

-- ============================================================================
-- RECURRING RULES TABLE
-- ============================================================================
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
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  time_slot_id UUID NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
  host_id VARCHAR NOT NULL,
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
-- USERS TABLE (Create first - no dependencies)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY, -- host_id format
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
-- ANALYTICS TABLE
-- ============================================================================
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
CREATE TABLE IF NOT EXISTS dashboard_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_services INTEGER DEFAULT 0,
  active_bookings INTEGER DEFAULT 0,
  upcoming_bookings INTEGER DEFAULT 0,
  cancelled_bookings INTEGER DEFAULT 0,
  revenue_this_month DECIMAL(12, 2) DEFAULT 0,
  revenue_this_year DECIMAL(12, 2) DEFAULT 0,
  average_response_time_hours DECIMAL(8, 2),
  customer_satisfaction_score DECIMAL(3, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_host_id ON dashboard_metrics(host_id);

-- ============================================================================
-- INSERT TEST DATA
-- ============================================================================

-- Insert test user
INSERT INTO users (id, full_name, business_name, email, phone, bio, location)
VALUES (
  'host-001',
  'Demo Host',
  'Demo Services',
  'demo@example.com',
  '+1 (555) 123-4567',
  'Professional service provider',
  'San Francisco, CA'
)
ON CONFLICT (id) DO NOTHING;

-- Insert test service with proper UUID
INSERT INTO services (host_id, name, description, category, duration_minutes, base_price, max_participants, is_active)
VALUES (
  'host-001',
  'Test Service',
  'A test service for verification',
  'Photography',
  90,
  2500,
  5,
  true
)
ON CONFLICT (host_id, name) DO NOTHING;

-- Get the service ID and insert time slot
DO $$
DECLARE
  service_id UUID;
BEGIN
  SELECT id INTO service_id FROM services WHERE host_id = 'host-001' LIMIT 1;
  
  IF service_id IS NOT NULL THEN
    INSERT INTO time_slots (service_id, slot_date, start_time, end_time, is_available)
    VALUES (
      service_id,
      CURRENT_DATE,
      '09:00'::TIME,
      '10:30'::TIME,
      true
    ) ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insert test analytics
INSERT INTO analytics (host_id, total_bookings, total_revenue, average_rating, completion_rate, period_start, period_end)
VALUES (
  'host-001',
  0,
  0,
  5.0,
  100,
  CURRENT_DATE - INTERVAL '6 months',
  CURRENT_DATE
)
ON CONFLICT DO NOTHING;

-- Insert test dashboard metrics
INSERT INTO dashboard_metrics (host_id, total_services, active_bookings, upcoming_bookings, cancelled_bookings, revenue_this_month, revenue_this_year, average_response_time_hours, customer_satisfaction_score)
VALUES (
  'host-001',
  1,
  0,
  0,
  0,
  0,
  0,
  2.5,
  5.0
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFY TABLES CREATED
-- ============================================================================
\dt
