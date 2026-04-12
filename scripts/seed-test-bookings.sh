#!/bin/bash

# Seed test data with EXISTING service and host IDs
# This script creates bookings using real data that already exists in the database

set +e  # Don't exit on first error

echo "🌱 Seeding test bookings with EXISTING service and host IDs..."

DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-intelli_reserve}

export PGPASSWORD="$DB_PASSWORD"

# Use existing IDs from database
SERVICE_ID="550e8400-e29b-41d4-a716-446655440001"
TIME_SLOT_ID="620825a4-4db2-4c7c-a291-40351d593a65"
HOST_ID="host-001"

echo "Using existing database IDs:"
echo "  Service ID: $SERVICE_ID"
echo "  Time Slot ID: $TIME_SLOT_ID"
echo "  Host ID: $HOST_ID"
echo ""

# Generate UUIDs for bookings
BOOKING_ID_1=$(python3 -c "import uuid; print(str(uuid.uuid4()))")
BOOKING_ID_2=$(python3 -c "import uuid; print(str(uuid.uuid4()))")

echo "Generated booking UUIDs:"
echo "  Booking 1: $BOOKING_ID_1"
echo "  Booking 2: $BOOKING_ID_2"
echo ""

# Create bookings
psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" "$DB_NAME" << EOF

-- Clear previous test bookings (optional)
-- DELETE FROM bookings WHERE client_email IN ('alice@test.com', 'bob@test.com');

-- Insert test bookings
INSERT INTO bookings (
  id, 
  service_id, 
  time_slot_id, 
  host_id, 
  client_name, 
  client_email, 
  client_phone, 
  number_of_participants, 
  status, 
  notes, 
  created_at, 
  updated_at
) VALUES 
(
  '$BOOKING_ID_1',
  '$SERVICE_ID',
  '$TIME_SLOT_ID',
  '$HOST_ID',
  'Alice Johnson',
  'alice@test.com',
  '+1-555-0101',
  1,
  'pending',
  'Initial test booking',
  NOW(),
  NOW()
),
(
  '$BOOKING_ID_2',
  '$SERVICE_ID',
  '$TIME_SLOT_ID',
  '$HOST_ID',
  'Bob Smith',
  'bob@test.com',
  '+1-555-0102',
  2,
  'pending',
  'Second test booking',
  NOW(),
  NOW()
);

-- Verify bookings were created
SELECT '✅ Created test bookings:' as status;
SELECT id, client_name, client_email, status FROM bookings 
WHERE client_email IN ('alice@test.com', 'bob@test.com')
ORDER BY created_at DESC;

-- Show relationship
SELECT 'Booking details with references:' as info;
SELECT 
  b.id as booking_id,
  b.client_name,
  b.client_email,
  s.name as service_name,
  ts.slot_date,
  ts.start_time
FROM bookings b
JOIN services s ON b.service_id = s.id
JOIN time_slots ts ON b.time_slot_id = ts.id
WHERE b.client_email IN ('alice@test.com', 'bob@test.com')
LIMIT 5;

EOF

echo ""
echo "✅ Test bookings seeded successfully!"
echo ""
echo "📋 Summary:"
echo "   • Booking 1 ID: $BOOKING_ID_1"
echo "   • Booking 2 ID: $BOOKING_ID_2"
echo "   • Service: $SERVICE_ID"
echo "   • Time Slot: $TIME_SLOT_ID"
echo "   • Host: $HOST_ID"
echo ""
echo "🧪 Test the API with:"
echo ""
echo "curl -X POST 'http://localhost:3001/api/bookings' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"serviceId\": \"$SERVICE_ID\","
echo "    \"timeSlotId\": \"$TIME_SLOT_ID\","
echo "    \"hostId\": \"$HOST_ID\","
echo "    \"clientName\": \"Test User\","
echo "    \"clientEmail\": \"test@example.com\","
echo "    \"clientPhone\": \"+1-555-0100\","
echo "    \"numberOfParticipants\": 1,"
echo "    \"notes\": \"Test booking with valid IDs\""
echo "  }'"
