#!/bin/bash

# IntelliReserve Quick Startup Script
# This script starts all required services for development

set -e

echo "🚀 IntelliReserve Development Startup"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"

cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down services...${NC}"
  [ -n "$BFF_PID" ] && kill "$BFF_PID" 2>/dev/null
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null
}
trap cleanup SIGINT SIGTERM

echo -e "${BLUE}Step 1/3: Starting Database...${NC}"
cd "$PROJECT_ROOT"
if docker-compose ps | grep -q "intelli_reserve-db"; then
    echo -e "${GREEN}✓ Database already running${NC}"
else
    echo "Starting Docker containers..."
    docker-compose up -d
    echo "Waiting for database to be ready..."
    sleep 5
    echo -e "${GREEN}✓ Database started${NC}"
fi

echo ""
echo -e "${BLUE}Step 2/3: Starting BFF Backend...${NC}"
cd "$PROJECT_ROOT/bff"
if [ ! -d "node_modules" ]; then
    echo "Installing BFF dependencies..."
    npm install
fi

if [ ! -f ".env.local" ]; then
    echo "Creating BFF .env.local..."
    cat > .env.local << 'EOF'
PORT=3001
NODE_ENV=development
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=intelli_reserve
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRATION=3600
CORS_ORIGIN=http://localhost:3000
EOF
    echo -e "${GREEN}✓ BFF .env.local created${NC}"
fi

# Start BFF in background
echo "Starting BFF server..."
npm run dev &
BFF_PID=$!
echo -e "${GREEN}✓ BFF started (PID: $BFF_PID)${NC}"
sleep 2

echo ""
echo -e "${BLUE}Step 3/3: Starting Frontend...${NC}"
cd "$PROJECT_ROOT/frontend"
if [ ! -d "node_modules" ]; then
    echo "Installing Frontend dependencies..."
    npm install
fi

if [ ! -f ".env.local" ]; then
    echo "Creating Frontend .env.local..."
    cat > .env.local << 'EOF'
NEXT_PUBLIC_BFF_URL=http://localhost:3001
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
EOF
    echo -e "${GREEN}✓ Frontend .env.local created${NC}"
fi

# Start Frontend in background
echo "Starting Frontend server..."
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
sleep 3

echo ""
echo -e "${GREEN}===================================${NC}"
echo -e "${GREEN}✅ All services started successfully!${NC}"
echo -e "${GREEN}===================================${NC}"
echo ""
echo -e "${BLUE}Services running:${NC}"
echo -e "  📱 Frontend:  ${YELLOW}http://localhost:3000${NC}"
echo -e "  🔌 BFF API:   ${YELLOW}http://localhost:3001${NC}"
echo -e "  🗄️  Database:  ${YELLOW}localhost:5432${NC}"
echo ""
echo -e "${BLUE}Demo Credentials:${NC}"
echo -e "  Email:    ${YELLOW}host@demo.com${NC}"
echo -e "  Password: ${YELLOW}Demo@123${NC}"
echo ""
echo -e "${BLUE}Test URLs:${NC}"
echo -e "  Login:     ${YELLOW}http://localhost:3000/auth/login${NC}"
echo -e "  Signup:    ${YELLOW}http://localhost:3000/auth/signup${NC}"
echo -e "  Dashboard: ${YELLOW}http://localhost:3000/dashboard${NC}"
echo -e "  Health:    ${YELLOW}http://localhost:3001/health${NC}"
echo ""
echo -e "${YELLOW}Note: Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for background processes
wait
