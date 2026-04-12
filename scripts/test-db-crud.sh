#!/bin/bash

# Database CRUD Test Script - Comprehensive Tests for All Tables
# Tests Create, Read, Update, Delete operations

DB_NAME="intelli_reserve"
DB_USER="postgres"
DB_HOST="localhost"

echo "🧪 Starting Database CRUD Tests..."
echo "===================================="

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to run SQL with error checking
run_sql() {
  local sql="$1"
  local output
  
  # Use printf to handle multi-line SQL properly, capture only the result rows
  output=$(printf "%s" "$sql" | psql -U $DB_USER -h $DB_HOST $DB_NAME -v ON_ERROR_STOP=1 -t -A 2>&1)
  local exit_code=$?
  
  if [ $exit_code -ne 0 ]; then
    echo "$output" >&2
    return $exit_code
  fi
  
  # Return only non-empty lines (filters out psql feedback)
  echo "$output" | grep -v '^INSERT\|^UPDATE\|^DELETE\|^SELECT' | grep -v '^$'
}

# Test result formatter
test_case() {
  echo -e "${BLUE}► $1${NC}"
}

pass() {
  echo -e "${GREEN}✓ PASS${NC}: $1"
  ((TESTS_PASSED++))
}

fail() {
  echo -e "${RED}✗ FAIL${NC}: $1"
  ((TESTS_FAILED++))
}

# ============================================================================
# TEST 1: CREATE - Insert a new service
# ============================================================================
test_case "Test 1: CREATE - Insert a new service"

SERVICE_ID=$(run_sql "
  INSERT INTO services (host_id, name, description, category, duration_minutes, base_price, max_participants, is_active)
  VALUES ('host-001', 'Test Photography', 'Test session', 'Photography', 60, 150.00, 10, true)
  RETURNING id;
")

# Verify the insert actually worked
SERVICE_EXISTS=$(run_sql "SELECT COUNT(*) FROM services WHERE id = '$SERVICE_ID';")

if [ ! -z "$SERVICE_ID" ] && [ ${#SERVICE_ID} -gt 30 ] && [ "$SERVICE_EXISTS" = "1" ]; then
  pass "Service created: $SERVICE_ID"
else
  fail "Service creation failed (ID: $SERVICE_ID, Exists: $SERVICE_EXISTS)"
  exit 1
fi

# ============================================================================
# TEST 2: READ - Retrieve the created service
# ============================================================================
test_case "Test 2: READ - Retrieve the created service"

SERVICE_DATA=$(run_sql "SELECT name, category, base_price FROM services WHERE id = '$SERVICE_ID';")

if echo "$SERVICE_DATA" | grep -q "Test Photography"; then
  pass "Service retrieved: $SERVICE_DATA"
else
  fail "Failed to retrieve service"
fi

# ============================================================================
# TEST 3: UPDATE - Modify the service
# ============================================================================
test_case "Test 3: UPDATE - Modify the service"

run_sql "
  UPDATE services 
  SET name = 'Premium Photography', base_price = 250.00, updated_at = CURRENT_TIMESTAMP
  WHERE id = '$SERVICE_ID';
" > /dev/null

UPDATED_PRICE=$(run_sql "SELECT base_price FROM services WHERE id = '$SERVICE_ID';")

if [ "$UPDATED_PRICE" = "250.00" ]; then
  pass "Service updated successfully (price: $UPDATED_PRICE)"
else
  fail "Service update failed (price: $UPDATED_PRICE)"
fi

# ============================================================================
# TEST 4: CREATE - Add time slot
# ============================================================================
test_case "Test 4: CREATE - Add time slot for service"

SLOT_ID=$(run_sql "
  INSERT INTO time_slots (service_id, slot_date, start_time, end_time, is_available, booked_count)
  VALUES ('$SERVICE_ID', '2026-04-15', '09:00:00', '10:00:00', true, 0)
  RETURNING id;
")

if [ ! -z "$SLOT_ID" ] && [ ${#SLOT_ID} -gt 30 ]; then
  pass "Time slot created: $SLOT_ID"
else
  fail "Time slot creation failed"
fi

# ============================================================================
# TEST 5: READ - Retrieve time slots
# ============================================================================
test_case "Test 5: READ - Retrieve time slots"

SLOT_DATA=$(run_sql "SELECT service_id, slot_date, start_time FROM time_slots WHERE id = '$SLOT_ID';")

if echo "$SLOT_DATA" | grep -q "2026-04-15"; then
  pass "Time slot retrieved: $SLOT_DATA"
else
  fail "Failed to retrieve time slot"
fi

# ============================================================================
# TEST 6: UPDATE - Change slot availability
# ============================================================================
test_case "Test 6: UPDATE - Change slot availability"

run_sql "
  UPDATE time_slots 
  SET is_available = false, booked_count = 1, updated_at = CURRENT_TIMESTAMP
  WHERE id = '$SLOT_ID';
" > /dev/null

SLOT_AVAILABLE=$(run_sql "SELECT is_available FROM time_slots WHERE id = '$SLOT_ID';")

if [ "$SLOT_AVAILABLE" = "f" ]; then
  pass "Time slot availability updated (is_available: $SLOT_AVAILABLE)"
else
  fail "Time slot update failed"
fi

# ============================================================================
# TEST 7: CREATE - Add booking
# ============================================================================
test_case "Test 7: CREATE - Add booking"

BOOKING_ID=$(run_sql "
  INSERT INTO bookings (service_id, time_slot_id, host_id, client_name, client_email, client_phone, number_of_participants, status)
  VALUES ('$SERVICE_ID', '$SLOT_ID', 'host-001', 'John Doe', 'john@example.com', '+1-555-1234', 1, 'confirmed')
  RETURNING id;
")

if [ ! -z "$BOOKING_ID" ] && [ ${#BOOKING_ID} -gt 30 ]; then
  pass "Booking created: $BOOKING_ID"
else
  fail "Booking creation failed"
fi

# ============================================================================
# TEST 8: READ - Retrieve bookings
# ============================================================================
test_case "Test 8: READ - Retrieve bookings"

BOOKING_DATA=$(run_sql "SELECT service_id, client_name, status FROM bookings WHERE id = '$BOOKING_ID';")

if echo "$BOOKING_DATA" | grep -q "John Doe"; then
  pass "Booking retrieved: $BOOKING_DATA"
else
  fail "Failed to retrieve booking"
fi

# ============================================================================
# TEST 9: UPDATE - Change booking status
# ============================================================================
test_case "Test 9: UPDATE - Change booking status"

run_sql "
  UPDATE bookings 
  SET status = 'completed', updated_at = CURRENT_TIMESTAMP
  WHERE id = '$BOOKING_ID';
" > /dev/null

BOOKING_STATUS=$(run_sql "SELECT status FROM bookings WHERE id = '$BOOKING_ID';")

if [ "$BOOKING_STATUS" = "completed" ]; then
  pass "Booking status updated: $BOOKING_STATUS"
else
  fail "Booking update failed (status: $BOOKING_STATUS)"
fi

# ============================================================================
# TEST 10: DELETE - Remove booking
# ============================================================================
test_case "Test 10: DELETE - Remove booking"

run_sql "DELETE FROM bookings WHERE id = '$BOOKING_ID';" > /dev/null

BOOKING_COUNT=$(run_sql "SELECT COUNT(*) FROM bookings WHERE id = '$BOOKING_ID';")

if [ "$BOOKING_COUNT" = "0" ]; then
  pass "Booking deleted successfully"
else
  fail "Booking deletion failed"
fi

# ============================================================================
# TEST 11: DELETE - Remove time slot
# ============================================================================
test_case "Test 11: DELETE - Remove time slot"

run_sql "DELETE FROM time_slots WHERE id = '$SLOT_ID';" > /dev/null

SLOT_COUNT=$(run_sql "SELECT COUNT(*) FROM time_slots WHERE id = '$SLOT_ID';")

if [ "$SLOT_COUNT" = "0" ]; then
  pass "Time slot deleted successfully"
else
  fail "Time slot deletion failed"
fi

# ============================================================================
# TEST 12: DELETE - Remove service
# ============================================================================
test_case "Test 12: DELETE - Remove service"

run_sql "DELETE FROM services WHERE id = '$SERVICE_ID';" > /dev/null

SERVICE_COUNT=$(run_sql "SELECT COUNT(*) FROM services WHERE id = '$SERVICE_ID';")

if [ "$SERVICE_COUNT" = "0" ]; then
  pass "Service deleted successfully"
else
  fail "Service deletion failed"
fi

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo "===================================="
echo "📊 Test Summary"
echo "===================================="
echo -e "${GREEN}✓ Passed: $TESTS_PASSED${NC}"
echo -e "${RED}✗ Failed: $TESTS_FAILED${NC}"
echo "===================================="

# Final database state check
echo ""
echo "📋 Final Database State:"
echo "===================================="
TOTAL_SERVICES=$(run_sql "SELECT COUNT(*) FROM services;")
TOTAL_SLOTS=$(run_sql "SELECT COUNT(*) FROM time_slots;")
TOTAL_BOOKINGS=$(run_sql "SELECT COUNT(*) FROM bookings;")

echo "Total Services: $TOTAL_SERVICES"
echo "Total Time Slots: $TOTAL_SLOTS"
echo "Total Bookings: $TOTAL_BOOKINGS"
echo "===================================="

if [ $TESTS_FAILED -eq 0 ]; then
  echo ""
  echo -e "${GREEN}🎉 All tests passed!${NC}"
  exit 0
else
  echo ""
  echo -e "${RED}❌ Some tests failed${NC}"
  exit 1
fi
