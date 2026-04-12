#!/bin/bash

# BFF & Backend Readiness Test Suite
# This script tests all required endpoints for the mock data cleanup integration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BFF_URL="${BFF_URL:-http://localhost:3001}"
TEST_HOST_ID="host-001"
TEST_SERVICE_ID=""
TEST_SLOT_ID=""
TEST_DATE=$(date +%Y-%m-%d)

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     INTELLI RESERVE - BFF & BACKEND READINESS TEST SUITE      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function for testing endpoints
test_endpoint() {
  local test_name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local expected_status=$5

  echo -e "${YELLOW}Testing: ${test_name}${NC}"
  echo -e "  Method: ${method} ${endpoint}"

  if [ -z "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X "$method" "${BFF_URL}${endpoint}")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" "${BFF_URL}${endpoint}" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi

  http_code=$(echo "$response" | tail -n 1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" -eq "$expected_status" ]; then
    echo -e "  ${GREEN}✓ PASS${NC} (HTTP $http_code)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo "$body" | jq . 2>/dev/null || echo "$body"
    echo ""
    echo "$body"
  else
    echo -e "  ${RED}✗ FAIL${NC} (Expected $expected_status, got $http_code)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo "$body"
    echo ""
  fi
}

# ============================================================================
# 1. HEALTH CHECK
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}1. HEALTH CHECK${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_endpoint "BFF Health Check" "GET" "/health" "" 200

# ============================================================================
# 2. SERVICES API
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}2. SERVICES API${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Get existing services
test_endpoint "Get Services for Host" "GET" "/api/services/services?hostId=${TEST_HOST_ID}" "" 200

# Create a new service
SERVICE_DATA='{
  "name": "Test Photography Session",
  "description": "A professional test photography session to verify API integration",
  "category": "Photography",
  "durationMinutes": 90,
  "basePrice": 2500,
  "maxParticipants": 5,
  "isActive": true
}'

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BFF_URL}/api/services/services?hostId=${TEST_HOST_ID}" \
  -H "Content-Type: application/json" \
  -d "$SERVICE_DATA")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 201 ]; then
  echo -e "${YELLOW}Testing: Create Service${NC}"
  echo -e "  ${GREEN}✓ PASS${NC} (HTTP $HTTP_CODE)"
  TESTS_PASSED=$((TESTS_PASSED + 1))
  TEST_SERVICE_ID=$(echo "$BODY" | jq -r '.id')
  echo "  Service ID: $TEST_SERVICE_ID"
  echo ""
else
  echo -e "${YELLOW}Testing: Create Service${NC}"
  echo -e "  ${RED}✗ FAIL${NC} (Expected 201, got $HTTP_CODE)"
  TESTS_FAILED=$((TESTS_FAILED + 1))
  echo "$BODY"
  echo ""
fi

# ============================================================================
# 3. TIME SLOTS API
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}3. TIME SLOTS API${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -n "$TEST_SERVICE_ID" ]; then
  # Get time slots for a date
  test_endpoint "Get Time Slots" "GET" "/api/services/time-slots?serviceId=${TEST_SERVICE_ID}&date=${TEST_DATE}" "" 200

  # Create a time slot
  SLOT_DATA="{
    \"serviceId\": \"${TEST_SERVICE_ID}\",
    \"slotDate\": \"${TEST_DATE}\",
    \"startTime\": \"09:00\",
    \"endTime\": \"10:30\"
  }"

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BFF_URL}/api/services/time-slots" \
    -H "Content-Type: application/json" \
    -d "$SLOT_DATA")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" -eq 201 ]; then
    echo -e "${YELLOW}Testing: Create Time Slot${NC}"
    echo -e "  ${GREEN}✓ PASS${NC} (HTTP $HTTP_CODE)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    TEST_SLOT_ID=$(echo "$BODY" | jq -r '.id')
    echo "  Slot ID: $TEST_SLOT_ID"
    echo ""
  else
    echo -e "${YELLOW}Testing: Create Time Slot${NC}"
    echo -e "  ${RED}✗ FAIL${NC} (Expected 201, got $HTTP_CODE)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo "$BODY"
    echo ""
  fi

  # Toggle availability
  if [ -n "$TEST_SLOT_ID" ]; then
    AVAILABILITY_DATA='{"isAvailable": false}'
    test_endpoint "Toggle Slot Availability" "PATCH" "/api/services/time-slots/${TEST_SLOT_ID}/availability" "$AVAILABILITY_DATA" 200
  fi

  # Create recurring slots
  RECURRING_DATA="{
    \"serviceId\": \"${TEST_SERVICE_ID}\",
    \"startTime\": \"14:00\",
    \"endTime\": \"15:00\",
    \"daysOfWeek\": [1, 3, 5],
    \"startDate\": \"${TEST_DATE}\"
  }"

  test_endpoint "Create Recurring Slots" "POST" "/api/services/recurring-slots" "$RECURRING_DATA" 201
else
  echo -e "${RED}Skipping time slot tests - no service created${NC}"
  echo ""
fi

# ============================================================================
# 4. ANALYTICS API
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}4. ANALYTICS API${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_endpoint "Get Analytics (6 months)" "GET" "/api/analytics/analytics?hostId=${TEST_HOST_ID}&timeRange=6m" "" 200
test_endpoint "Get Analytics (1 year)" "GET" "/api/analytics/analytics?hostId=${TEST_HOST_ID}&timeRange=1y" "" 200
test_endpoint "Get Dashboard Metrics" "GET" "/api/analytics/dashboard/metrics?hostId=${TEST_HOST_ID}" "" 200

# ============================================================================
# 5. USER PROFILE API (MISSING - NEEDS IMPLEMENTATION)
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}5. USER PROFILE API (CRITICAL - NEEDS IMPLEMENTATION)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

USER_PROFILE_DATA="{
  \"fullName\": \"Test User\",
  \"businessName\": \"Test Business\",
  \"email\": \"test@example.com\",
  \"phone\": \"+1 (555) 123-4567\",
  \"bio\": \"Test bio\",
  \"location\": \"Test City\"
}"

# Try to get user profile
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${BFF_URL}/api/users/profile?hostId=${TEST_HOST_ID}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${YELLOW}Testing: Get User Profile${NC}"
  echo -e "  ${GREEN}✓ PASS${NC} (HTTP $HTTP_CODE)"
  TESTS_PASSED=$((TESTS_PASSED + 1))
  echo ""
elif [ "$HTTP_CODE" -eq 404 ]; then
  echo -e "${YELLOW}Testing: Get User Profile${NC}"
  echo -e "  ${RED}✗ FAIL${NC} (Endpoint not implemented - HTTP 404)"
  TESTS_FAILED=$((TESTS_FAILED + 1))
  echo "  ${RED}ACTION REQUIRED: Implement GET /api/users/profile endpoint${NC}"
  echo ""
else
  echo -e "${YELLOW}Testing: Get User Profile${NC}"
  echo -e "  ${RED}✗ FAIL${NC} (HTTP $HTTP_CODE)"
  TESTS_FAILED=$((TESTS_FAILED + 1))
  echo ""
fi

# Try to update user profile
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "${BFF_URL}/api/users/profile?hostId=${TEST_HOST_ID}" \
  -H "Content-Type: application/json" \
  -d "$USER_PROFILE_DATA")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
  echo -e "${YELLOW}Testing: Update User Profile${NC}"
  echo -e "  ${GREEN}✓ PASS${NC} (HTTP $HTTP_CODE)"
  TESTS_PASSED=$((TESTS_PASSED + 1))
  echo ""
elif [ "$HTTP_CODE" -eq 404 ]; then
  echo -e "${YELLOW}Testing: Update User Profile${NC}"
  echo -e "  ${RED}✗ FAIL${NC} (Endpoint not implemented - HTTP 404)"
  TESTS_FAILED=$((TESTS_FAILED + 1))
  echo "  ${RED}ACTION REQUIRED: Implement PUT /api/users/profile endpoint${NC}"
  echo ""
else
  echo -e "${YELLOW}Testing: Update User Profile${NC}"
  echo -e "  ${RED}✗ FAIL${NC} (HTTP $HTTP_CODE)"
  TESTS_FAILED=$((TESTS_FAILED + 1))
  echo ""
fi

# ============================================================================
# CLEANUP (Delete test data)
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}6. CLEANUP${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -n "$TEST_SLOT_ID" ]; then
  test_endpoint "Delete Test Slot" "DELETE" "/api/services/time-slots/${TEST_SLOT_ID}" "" 200
fi

if [ -n "$TEST_SERVICE_ID" ]; then
  test_endpoint "Delete Test Service" "DELETE" "/api/services/services/${TEST_SERVICE_ID}" "" 200
fi

# ============================================================================
# RESULTS SUMMARY
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}TEST RESULTS SUMMARY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  echo ""
  echo "  Tests Passed: ${GREEN}${TESTS_PASSED}${NC}"
  echo "  Tests Failed: ${GREEN}0${NC}"
  echo "  Total Tests:  $TOTAL_TESTS"
  echo ""
  echo -e "${GREEN}Status: READY FOR DEPLOYMENT${NC}"
else
  echo -e "${RED}✗ Some tests failed!${NC}"
  echo ""
  echo "  Tests Passed: ${GREEN}${TESTS_PASSED}${NC}"
  echo "  Tests Failed: ${RED}${TESTS_FAILED}${NC}"
  echo "  Total Tests:  $TOTAL_TESTS"
  echo ""
  
  if grep -q "Endpoint not implemented" <<< "$BODY"; then
    echo -e "${RED}CRITICAL: User Profile API endpoints not implemented${NC}"
    echo ""
    echo -e "${YELLOW}ACTION ITEMS:${NC}"
    echo "  1. Implement GET /api/users/profile?hostId={hostId}"
    echo "  2. Implement PUT /api/users/profile?hostId={hostId}"
    echo "  3. Create users table in database if not exists"
    echo "  4. Create user routes file in BFF"
    echo ""
  fi
  
  echo -e "${YELLOW}Status: NEEDS FIXES BEFORE DEPLOYMENT${NC}"
fi

echo ""
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
