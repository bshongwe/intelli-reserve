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

-- HOST 1: Sarah Martinez - Business Consultant
INSERT INTO users (id, email, password_hash, full_name, business_name, user_type, is_active, phone, location, bio, created_at, updated_at)
VALUES ('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'sarah.martinez@business.com', '$2b$12$D00zusq7kaamB7vElF/pp.19lInAU/cPSzXVoVu5C6ybHzD5QtEku', 'Sarah Martinez', 'Martinez Business Consulting', 'host', true, '+1-555-0100', 'New York, NY', '15+ years in business consulting. Specializing in startup growth and scaling strategies.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- HOST 2: James Wilson - Executive Coach
INSERT INTO users (id, email, password_hash, full_name, business_name, user_type, is_active, phone, location, bio, created_at, updated_at)
VALUES ('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', 'james.wilson@consulting.com', '$2b$12$D00zusq7kaamB7vElF/pp.19lInAU/cPSzXVoVu5C6ybHzD5QtEku', 'James Wilson', 'Wilson Executive Coaching', 'host', true, '+1-555-0101', 'San Francisco, CA', 'Executive coach helping leaders achieve peak performance. MBA from Stanford.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- HOST 3: Aisha Patel - Wellness & Nutrition Coach
INSERT INTO users (id, email, password_hash, full_name, business_name, user_type, is_active, phone, location, bio, created_at, updated_at)
VALUES ('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8', 'aisha.patel@wellness.com', '$2b$12$D00zusq7kaamB7vElF/pp.19lInAU/cPSzXVoVu5C6ybHzD5QtEku', 'Aisha Patel', 'Patel Wellness & Nutrition', 'host', true, '+1-555-0102', 'Los Angeles, CA', 'Certified nutritionist and wellness coach. Helping clients achieve sustainable health goals.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- HOST 4: Marcus Robinson - Athletic Performance Coach
INSERT INTO users (id, email, password_hash, full_name, business_name, user_type, is_active, phone, location, bio, created_at, updated_at)
VALUES ('d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9', 'marcus.robinson@coaching.com', '$2b$12$D00zusq7kaamB7vElF/pp.19lInAU/cPSzXVoVu5C6ybHzD5QtEku', 'Marcus Robinson', 'Robinson Athletic Performance', 'host', true, '+1-555-0103', 'Miami, FL', 'Former athlete now coaching youth sports teams. Specializing in strength and conditioning.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- HOST 5: Elena Rossi - Language & Academic Tutor
INSERT INTO users (id, email, password_hash, full_name, business_name, user_type, is_active, phone, location, bio, created_at, updated_at)
VALUES ('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f9a0', 'elena.rossi@tutoring.com', '$2b$12$D00zusq7kaamB7vElF/pp.19lInAU/cPSzXVoVu5C6ybHzD5QtEku', 'Elena Rossi', 'Rossi Languages & Academics', 'host', true, '+1-555-0104', 'Boston, MA', 'Fluent in 5 languages. Specialized academic tutor for college prep and language learning.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- HOST 6: David Kim - Tech & Web Development
INSERT INTO users (id, email, password_hash, full_name, business_name, user_type, is_active, phone, location, bio, created_at, updated_at)
VALUES ('f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a0b1', 'david.kim@tech.com', '$2b$12$D00zusq7kaamB7vElF/pp.19lInAU/cPSzXVoVu5C6ybHzD5QtEku', 'David Kim', 'Kim Tech Solutions', 'host', true, '+1-555-0105', 'Seattle, WA', 'Full-stack developer offering web development and coding bootcamp training. 10 years experience.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- HOST 7: Jennifer Lee - Creative & Design Services
INSERT INTO users (id, email, password_hash, full_name, business_name, user_type, is_active, phone, location, bio, created_at, updated_at)
VALUES ('a7b8c9d0-e1f2-43a4-b5c6-d7e8f9a0b1c2', 'jennifer.lee@creative.com', '$2b$12$D00zusq7kaamB7vElF/pp.19lInAU/cPSzXVoVu5C6ybHzD5QtEku', 'Jennifer Lee', 'Lee Creative Studio', 'host', true, '+1-555-0106', 'Chicago, IL', 'Graphic designer and creative director. Helping brands tell their stories visually.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- HOST 8: Robert Chen - Financial Planning & Investment
INSERT INTO users (id, email, password_hash, full_name, business_name, user_type, is_active, phone, location, bio, created_at, updated_at)
VALUES ('b8c9d0e1-f2a3-44b5-c6d7-e8f9a0b1c2d3', 'robert.chen@finance.com', '$2b$12$D00zusq7kaamB7vElF/pp.19lInAU/cPSzXVoVu5C6ybHzD5QtEku', 'Robert Chen', 'Chen Financial Partners', 'host', true, '+1-555-0107', 'Denver, CO', 'CFA charterholder offering financial planning, investment strategy, and wealth management consulting.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- CLIENT 1: Alex Johnson - Corporate Professional
INSERT INTO users (id, email, password_hash, full_name, business_name, user_type, is_active, phone, location, bio, created_at, updated_at)
VALUES ('c9d0e1f2-a3b4-45c6-d7e8-f9a0b1c2d3e4', 'alex.johnson@corp.com', '$2b$12$D00zusq7kaamB7vElF/pp.19lInAU/cPSzXVoVu5C6ybHzD5QtEku', 'Alex Johnson', 'Personal', 'client', true, '+1-555-0201', 'Austin, TX', 'VP of Marketing at Fortune 500 company. Looking for executive coaching to advance career.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- CLIENT 2: Maya Gupta - Startup Founder
INSERT INTO users (id, email, password_hash, full_name, business_name, user_type, is_active, phone, location, bio, created_at, updated_at)
VALUES ('d0e1f2a3-b4c5-46d7-e8f9-a0b1c2d3e4f5', 'maya.gupta@startup.com', '$2b$12$D00zusq7kaamB7vElF/pp.19lInAU/cPSzXVoVu5C6ybHzD5QtEku', 'Maya Gupta', 'Personal', 'client', true, '+1-555-0202', 'Palo Alto, CA', 'Building a health-tech startup. Seeking mentorship and business consulting from experienced entrepreneurs.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- CLIENT 3: Thomas Mueller - European Executive
INSERT INTO users (id, email, password_hash, full_name, business_name, user_type, is_active, phone, location, bio, created_at, updated_at)
VALUES ('e1f2a3b4-c5d6-47e8-f9a0-b1c2d3e4f5a6', 'thomas.mueller@eu.de', '$2b$12$D00zusq7kaamB7vElF/pp.19lInAU/cPSzXVoVu5C6ybHzD5QtEku', 'Thomas Mueller', 'Personal', 'client', true, '+49-30-5555-0203', 'Berlin, Germany', 'Senior Manager at international tech firm. Interested in professional development and language coaching.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- CLIENT 4: Nina Bergstrom - Fitness Enthusiast
INSERT INTO users (id, email, password_hash, full_name, business_name, user_type, is_active, phone, location, bio, created_at, updated_at)
VALUES ('f2a3b4c5-d6e7-48f9-a0b1-c2d3e4f5a6b7', 'nina.bergstrom@se.com', '$2b$12$D00zusq7kaamB7vElF/pp.19lInAU/cPSzXVoVu5C6ybHzD5QtEku', 'Nina Bergstrom', 'Personal', 'client', true, '+46-8-5555-0204', 'Stockholm, Sweden', 'Marathon runner preparing for ultra-marathon. Seeking specialized athletic coaching and nutrition guidance.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- CLIENT 5: Lucas Silva - Recent Graduate
INSERT INTO users (id, email, password_hash, full_name, business_name, user_type, is_active, phone, location, bio, created_at, updated_at)
VALUES ('a3b4c5d6-e7f8-49a0-b1c2-d3e4f5a6b7c8', 'lucas.silva@br.com', '$2b$12$D00zusq7kaamB7vElF/pp.19lInAU/cPSzXVoVu5C6ybHzD5QtEku', 'Lucas Silva', 'Personal', 'client', true, '+55-11-5555-0205', 'São Paulo, Brazil', 'Recent college graduate seeking career guidance and professional development coaching.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- CLIENT 6: Jessica Taylor - Parent & Professional
INSERT INTO users (id, email, password_hash, full_name, business_name, user_type, is_active, phone, location, bio, created_at, updated_at)
VALUES ('b4c5d6e7-f8a9-50b1-c2d3-e4f5a6b7c8d9', 'jessica.taylor@uk.co', '$2b$12$D00zusq7kaamB7vElF/pp.19lInAU/cPSzXVoVu5C6ybHzD5QtEku', 'Jessica Taylor', 'Personal', 'client', true, '+44-20-5555-0206', 'London, UK', 'Working parent seeking tutoring services for teenage children and personal executive coaching.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- CLIENT 7: Omar Hassan - Business Owner
INSERT INTO users (id, email, password_hash, full_name, business_name, user_type, is_active, phone, location, bio, created_at, updated_at)
VALUES ('c5d6e7f8-a9b0-51c2-d3e4-f5a6b7c8d9ea', 'omar.hassan@ae.com', '$2b$12$D00zusq7kaamB7vElF/pp.19lInAU/cPSzXVoVu5C6ybHzD5QtEku', 'Omar Hassan', 'Personal', 'client', true, '+971-4-5555-0207', 'Dubai, UAE', 'Owner of commercial real estate firm. Looking for financial strategy and business development consulting.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- CLIENT 8: Claire Dubois - Student & Athlete
INSERT INTO users (id, email, password_hash, full_name, business_name, user_type, is_active, phone, location, bio, created_at, updated_at)
VALUES ('d6e7f8a9-b0c1-52d3-e4f5-a6b7c8d9eafb', 'claire.dubois@fr.fr', '$2b$12$D00zusq7kaamB7vElF/pp.19lInAU/cPSzXVoVu5C6ybHzD5QtEku', 'Claire Dubois', 'Personal', 'client', true, '+33-1-5555-0208', 'Paris, France', 'University student and competitive tennis player. Seeking academic tutoring and sports coaching.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- ═════════════════════════════════════════════════════════════════════
-- VERIFICATION & SUMMARY
-- ═════════════════════════════════════════════════════════════════════

-- Display summary statistics
SELECT 
  COUNT(*) as total_users,
  SUM(CASE WHEN user_type = 'host' THEN 1 ELSE 0 END) as hosts,
  SUM(CASE WHEN user_type = 'client' THEN 1 ELSE 0 END) as clients,
  SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_users
FROM users;

-- Display all seeded users with details
SELECT 
  email, 
  full_name, 
  user_type, 
  location,
  is_active,
  created_at
FROM users 
WHERE email LIKE '%@%.com' OR email LIKE '%@%.de' OR email LIKE '%@%.se' OR email LIKE '%@%.br' OR email LIKE '%@%.co' OR email LIKE '%@%.ae' OR email LIKE '%@%.fr'
ORDER BY user_type DESC, created_at DESC;
