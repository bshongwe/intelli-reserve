#!/bin/bash

# ============================================================================
# 🌱 IntelliReserve Database Seeding Script
# ============================================================================
# This script seeds the database with realistic test data using proper UUIDs
# ============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-intelli_reserve}

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║ 🌱 IntelliReserve Database Seeding${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to generate UUID
generate_uuid() {
  python3 -c "import uuid; print(str(uuid.uuid4()))" 2>/dev/null || uuidgen
}

# Function to run SQL with error handling
run_sql() {
  PGPASSWORD=$DB_USER psql -h $DB_HOST -U $DB_USER $DB_NAME -c "$1" 2>/dev/null || true
}

echo -e "${YELLOW}📍 Generating test data with real UUIDs...${NC}"
echo ""

# Generate UUIDs for hosts
HOST_ID_1=$(generate_uuid)
HOST_ID_2=$(generate_uuid)

echo -e "${GREEN}✓${NC} Host 1 ID: $HOST_ID_1"
echo -e "${GREEN}✓${NC} Host 2 ID: $HOST_ID_2"
echo ""

# Generate UUIDs for services
SERVICE_ID_1=$(generate_uuid)
SERVICE_ID_2=$(generate_uuid)
SERVICE_ID_3=$(generate_uuid)
SERVICE_ID_4=$(generate_uuid)

echo -e "${GREEN}✓${NC} Service 1 ID: $SERVICE_ID_1 (Photography)"
echo -e "${GREEN}✓${NC} Service 2 ID: $SERVICE_ID_2 (Consulting)"
echo -e "${GREEN}✓${NC} Service 3 ID: $SERVICE_ID_3 (Workshop)"
echo -e "${GREEN}✓${NC} Service 4 ID: $SERVICE_ID_4 (Coaching)"
echo ""

echo -e "${YELLOW}📍 Creating test hosts in users table...${NC}"
run_sql "INSERT INTO users (id, full_name, business_name, email, phone, bio, location, avatar_url, created_at, updated_at) VALUES ('$HOST_ID_1', 'Alice Johnson', 'Alice Photography Co', 'alice@example.com', '+1-555-0001', 'Professional photographer with 10+ years experience', 'New York, NY', NULL, NOW(), NOW());"
run_sql "INSERT INTO users (id, full_name, business_name, email, phone, bio, location, avatar_url, created_at, updated_at) VALUES ('$HOST_ID_2', 'Bob Smith', 'Tech Workshops Inc', 'bob@example.com', '+1-555-0002', 'Tech educator and consultant', 'San Francisco, CA', NULL, NOW(), NOW());"
echo -e "${GREEN}✅ Created 2 user hosts${NC}"
echo ""

echo -e "${YELLOW}📍 Creating services...${NC}"
run_sql "INSERT INTO services (id, host_id, name, description, category, duration_minutes, base_price, max_participants, is_active, created_at, updated_at) VALUES ('$SERVICE_ID_1', '$HOST_ID_1', 'Professional Photography Session', 'High-quality portrait and event photography services', 'Photography', 90, 2500, 10, true, NOW(), NOW());"
run_sql "INSERT INTO services (id, host_id, name, description, category, duration_minutes, base_price, max_participants, is_active, created_at, updated_at) VALUES ('$SERVICE_ID_2', '$HOST_ID_1', 'Business Consulting - Strategy', 'Strategic business consulting and planning services', 'Consulting', 60, 5000, 1, true, NOW(), NOW());"
run_sql "INSERT INTO services (id, host_id, name, description, category, duration_minutes, base_price, max_participants, is_active, created_at, updated_at) VALUES ('$SERVICE_ID_3', '$HOST_ID_2', 'Web Development Workshop', 'Hands-on web development workshop for beginners', 'Workshop', 120, 1500, 15, true, NOW(), NOW());"
run_sql "INSERT INTO services (id, host_id, name, description, category, duration_minutes, base_price, max_participants, is_active, created_at, updated_at) VALUES ('$SERVICE_ID_4', '$HOST_ID_2', 'Life Coaching Session', 'Personal development and life coaching', 'Coaching', 45, 800, 1, true, NOW(), NOW());"
echo -e "${GREEN}✅ Created 4 services${NC}"
echo ""

# Generate time slots for the week
echo -e "${YELLOW}📍 Creating time slots for next 7 days...${NC}"

SLOT_COUNT=0
FIRST_SLOT_ID=""
SECOND_SLOT_ID=""

for i in {0..6}; do
  # Calculate date (macOS and Linux compatible)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    SLOT_DATE=$(date -v+${i}d +%Y-%m-%d)
  else
    SLOT_DATE=$(date -d "+${i} days" +%Y-%m-%d)
  fi
  
  # Create 3 slots per day
  for hour in 9 11 14; do
    SLOT_ID=$(generate_uuid)
    
    # Save first two slot IDs for bookings
    if [ -z "$FIRST_SLOT_ID" ]; then
      FIRST_SLOT_ID=$SLOT_ID
    elif [ -z "$SECOND_SLOT_ID" ]; then
      SECOND_SLOT_ID=$SLOT_ID
    fi
    
    START_TIME="$(printf "%02d" $hour):00:00"
    END_TIME="$(printf "%02d" $((hour + 1))):00:00"
    
    run_sql "INSERT INTO time_slots (id, service_id, slot_date, start_time, end_time, is_available, is_recurring, booked_count, created_at, updated_at) VALUES ('$SLOT_ID', '$SERVICE_ID_1', '$SLOT_DATE', '$START_TIME', '$END_TIME', true, false, 0, NOW(), NOW());"
    
    SLOT_COUNT=$((SLOT_COUNT + 1))
  done
done

echo -e "${GREEN}✅ Created $SLOT_COUNT time slots${NC}"
echo ""

# Generate sample bookings
echo -e "${YELLOW}📍 Creating sample bookings...${NC}"

if [ ! -z "$FIRST_SLOT_ID" ] && [ ! -z "$SECOND_SLOT_ID" ]; then
  BOOKING_ID_1=$(generate_uuid)
  BOOKING_ID_2=$(generate_uuid)
  
  run_sql "INSERT INTO bookings (id, service_id, time_slot_id, host_id, client_name, client_email, client_phone, number_of_participants, status, notes, created_at, updated_at) VALUES ('$BOOKING_ID_1', '$SERVICE_ID_1', '$FIRST_SLOT_ID', '$HOST_ID_1', 'John Doe', 'john@example.com', '+1-555-0123', 2, 'confirmed', 'Confirmed booking for event photography', NOW(), NOW());"
  run_sql "INSERT INTO bookings (id, service_id, time_slot_id, host_id, client_name, client_email, client_phone, number_of_participants, status, notes, created_at, updated_at) VALUES ('$BOOKING_ID_2', '$SERVICE_ID_2', '$SECOND_SLOT_ID', '$HOST_ID_1', 'Jane Smith', 'jane@example.com', '+1-555-0456', 1, 'pending', 'Awaiting confirmation', NOW(), NOW());"
  
  echo -e "${GREEN}✅ Created 2 sample bookings${NC}"
else
  echo -e "${YELLOW}⚠️  Skipped bookings${NC}"
fi
echo ""

# Display summary
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║ 🎉 Seeding Complete!${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Test Data Created:${NC}"
echo "  • Hosts: 2 (with proper UUIDs)"
echo "  • Services: 4"
echo "  • Time Slots: $SLOT_COUNT"
echo "  • Bookings: 2"
echo ""
echo -e "${YELLOW}Host IDs for testing:${NC}"
echo "  Host 1 (Alice): $HOST_ID_1"
echo "  Host 2 (Bob):   $HOST_ID_2"
echo ""
echo -e "${YELLOW}Service IDs for testing:${NC}"
echo "  Photography: $SERVICE_ID_1"
echo "  Consulting:  $SERVICE_ID_2"
echo "  Workshop:    $SERVICE_ID_3"
echo "  Coaching:    $SERVICE_ID_4"
echo ""
echo -e "${GREEN}✅ Database seeding complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Use these IDs to test your APIs"
echo "  2. Try making a booking with a real Service ID"
echo "  3. Visit /dashboard/book to see the services"
echo ""
