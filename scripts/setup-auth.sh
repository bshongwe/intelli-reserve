#!/bin/bash

# Script to set up authentication in the IntelliReserve database
# Run this after Docker is running and the initial schema is applied

echo "🔧 Setting up authentication schema..."

# Check if database is running
if ! psql -U postgres -d intelli_reserve -c "SELECT 1" > /dev/null 2>&1; then
  echo "❌ Cannot connect to database. Make sure Docker is running and the database is initialized."
  echo "Start Docker with: docker-compose up -d"
  exit 1
fi

echo "✅ Database connected"

# Apply migration
psql -U postgres -d intelli_reserve << EOF

-- Add authentication columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash VARCHAR NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS user_type VARCHAR DEFAULT 'host' CHECK (user_type IN ('host', 'client')),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index on email for faster authentication lookups
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, is_active);

-- Insert demo users for testing (passwords hashed with bcrypt)
-- Password: Demo@123 -> $2b$12$...
INSERT INTO users (id, full_name, business_name, email, phone, password_hash, user_type, is_active)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'Demo Host', 'Demo Hosting', 'host@demo.com', '555-1234', '\$2b\$12\$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86xVXAaxe9G', 'host', true),
  ('b0000000-0000-0000-0000-000000000001', 'Demo Client', 'Demo Client', 'client@demo.com', '555-5678', '\$2b\$12\$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86xVXAaxe9G', 'client', true)
ON CONFLICT (email) DO NOTHING;

SELECT '✅ Authentication schema setup complete!' as result;

EOF

echo ""
echo "🎉 Authentication setup complete!"
echo ""
echo "Demo Credentials:"
echo "  Host:   host@demo.com / Demo@123"
echo "  Client: client@demo.com / Demo@123"
