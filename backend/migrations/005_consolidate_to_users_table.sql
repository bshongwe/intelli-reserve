-- Consolidate host references from 'hosts' table to 'users' table
-- This fixes the dual-table architecture issue where services/bookings referenced an empty hosts table

-- Drop foreign key constraints that reference hosts.id
ALTER TABLE availability_blocks DROP CONSTRAINT IF EXISTS availability_blocks_host_id_fkey;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_host_id_fkey;
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_host_id_fkey;

-- Update column types to match users.id (VARCHAR)
ALTER TABLE availability_blocks ALTER COLUMN host_id TYPE character varying;
ALTER TABLE bookings ALTER COLUMN host_id TYPE character varying;
ALTER TABLE services ALTER COLUMN host_id TYPE character varying;

-- Add NOT NULL constraints
ALTER TABLE availability_blocks ALTER COLUMN host_id SET NOT NULL;
ALTER TABLE bookings ALTER COLUMN host_id SET NOT NULL;
ALTER TABLE services ALTER COLUMN host_id SET NOT NULL;

-- Recreate foreign key constraints pointing to users table
ALTER TABLE availability_blocks
ADD CONSTRAINT availability_blocks_host_id_fkey
FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE bookings
ADD CONSTRAINT bookings_host_id_fkey
FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE services
ADD CONSTRAINT services_host_id_fkey
FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE;

-- Drop the now-unused hosts table
DROP TABLE IF EXISTS hosts CASCADE;
