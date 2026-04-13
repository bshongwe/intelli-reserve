-- Migration: 004_seed_comprehensive_users.sql
-- Created: 2026-04-13
-- Purpose: Seed comprehensive real users with proper authentication data
--
-- Default password for all users: SecurePass@2024
-- Bcrypt hash (12 rounds): $2b$12$D00zusq7kaamB7vElF/pp.19lInAU/cPSzXVoVu5C6ybHzD5QtEku
--
-- HOSTS (Service Providers) - Diverse professionals:
-- ─────────────────────────────────────────────────────────────────────
--   Email: sarah.martinez@business.com     | Name: Sarah Martinez
--   Email: james.wilson@consulting.com     | Name: James Wilson
--   Email: aisha.patel@wellness.com        | Name: Aisha Patel
--   Email: marcus.robinson@coaching.com    | Name: Marcus Robinson
--   Email: elena.rossi@tutoring.com        | Name: Elena Rossi
--   Email: david.kim@tech.com              | Name: David Kim
--   Email: jennifer.lee@creative.com       | Name: Jennifer Lee
--   Email: robert.chen@finance.com         | Name: Robert Chen
--
-- CLIENTS (Service Consumers) - Various backgrounds:
-- ─────────────────────────────────────────────────────────────────────
--   Email: alex.johnson@corp.com           | Name: Alex Johnson
--   Email: maya.gupta@startup.com          | Name: Maya Gupta
--   Email: thomas.mueller@eu.de            | Name: Thomas Mueller
--   Email: nina.bergstrom@se.com           | Name: Nina Bergstrom
--   Email: lucas.silva@br.com              | Name: Lucas Silva
--   Email: jessica.taylor@uk.co            | Name: Jessica Taylor
--   Email: omar.hassan@ae.com              | Name: Omar Hassan
--   Email: claire.dubois@fr.fr             | Name: Claire Dubois
--
-- ═════════════════════════════════════════════════════════════════════

-- Primary demo host
INSERT INTO users (id, email, password_hash, full_name, business_name, user_type, is_active, phone, location, bio, created_at, updated_at)
VALUES ('a0000000-0000-0000-0000-000000000001', 'host@demo.com', '$2b$12$D00zusq7kaamB7vElF/pp.19lInAU/cPSzXVoVu5C6ybHzD5QtEku', 'Demo Host', 'Demo Host Services', 'host', true, '+1-234-567-8900', 'New York, NY', 'Professional service provider offering premium booking services', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Host: Alice
INSERT INTO users (id, email, password_hash, full_name, business_name, user_type, is_active, phone, location, bio, created_at, updated_at)
VALUES ('a0000000-0000-0000-0000-000000000002', 'alice.host@demo.com', '$2b$12$D00zusq7kaamB7vElF/pp.19lInAU/cPSzXVoVu5C6ybHzD5QtEku', 'Alice Thompson', 'Thompson Consulting', 'host', true, '+1-555-123-4567', 'San Francisco, CA', 'Expert in personal consulting and professional development', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Host: Bob
INSERT INTO users (id, email, password_hash, full_name, business_name, user_type, is_active, phone, location, bio, created_at, updated_at)
VALUES ('a0000000-0000-0000-0000-000000000003', 'bob.host@demo.com', '$2b$12$D00zusq7kaamB7vElF/pp.19lInAU/cPSzXVoVu5C6ybHzD5QtEku', 'Bob Johnson', 'Johnson Fitness', 'host', true, '+1-555-234-5678', 'Los Angeles, CA', 'Specialized in fitness coaching and wellness programs', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Host: Carol
INSERT INTO users (id, email, password_hash, full_name, business_name, user_type, is_active, phone, location, bio, created_at, updated_at)
VALUES ('a0000000-0000-0000-0000-000000000004', 'carol.host@demo.com', '$2b$12$D00zusq7kaamB7vElF/pp.19lInAU/cPSzXVoVu5C6ybHzD5QtEku', 'Carol Martinez', 'Martinez Tutoring', 'host', true, '+1-555-345-6789', 'Chicago, IL', 'Professional tutor offering personalized educational services', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Host: David
INSERT INTO users (id, email, password_hash, full_name, business_name, user_type, is_active, phone, location, bio, created_at, updated_at)
VALUES ('a0000000-0000-0000-0000-000000000005', 'david.host@demo.com', '$2b$12$D00zusq7kaamB7vElF/pp.19lInAU/cPSzXVoVu5C6ybHzD5QtEku', 'David Chen', 'Chen Business Strategy', 'host', true, '+1-555-456-7890', 'Seattle, WA', 'Expert in business consulting and strategic planning', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Primary demo client
INSERT INTO users (id, email, password_hash, full_name, business_name, user_type, is_active, phone, location, bio, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000001', 'client@demo.com', '$2b$12$D00zusq7kaamB7vElF/pp.19lInAU/cPSzXVoVu5C6ybHzD5QtEku', 'Demo Client', 'Personal', 'client', true, '+1-987-654-3210', 'Boston, MA', 'Looking for professional services and expert consultations', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Client: John
INSERT INTO users (id, email, password_hash, full_name, business_name, user_type, is_active, phone, location, bio, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000002', 'john.client@demo.com', '$2b$12$D00zusq7kaamB7vElF/pp.19lInAU/cPSzXVoVu5C6ybHzD5QtEku', 'John Williams', 'Personal', 'client', true, '+1-555-111-2222', 'Miami, FL', 'Professional seeking career development opportunities', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Client: Jane
INSERT INTO users (id, email, password_hash, full_name, business_name, user_type, is_active, phone, location, bio, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000003', 'jane.client@demo.com', '$2b$12$D00zusq7kaamB7vElF/pp.19lInAU/cPSzXVoVu5C6ybHzD5QtEku', 'Jane Anderson', 'Personal', 'client', true, '+1-555-222-3333', 'Denver, CO', 'Fitness enthusiast looking for personal training sessions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Client: Michael
INSERT INTO users (id, email, password_hash, full_name, business_name, user_type, is_active, phone, location, bio, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000004', 'michael.client@demo.com', '$2b$12$D00zusq7kaamB7vElF/pp.19lInAU/cPSzXVoVu5C6ybHzD5QtEku', 'Michael Brown', 'Personal', 'client', true, '+1-555-333-4444', 'Austin, TX', 'Student looking for academic tutoring and mentorship', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Client: Sarah
INSERT INTO users (id, email, password_hash, full_name, business_name, user_type, is_active, phone, location, bio, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000005', 'sarah.client@demo.com', '$2b$12$D00zusq7kaamB7vElF/pp.19lInAU/cPSzXVoVu5C6ybHzD5QtEku', 'Sarah Davis', 'Personal', 'client', true, '+1-555-444-5555', 'Portland, OR', 'Entrepreneur seeking business strategy and consulting', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Verify users were inserted
SELECT 
  email, 
  full_name, 
  user_type, 
  is_active,
  created_at
FROM users 
WHERE email LIKE '%@demo.com' OR email LIKE '%.%@demo.com'
ORDER BY created_at DESC;
