.PHONY: help dev up down build build-frontend build-bff build-backend test test-crud test-bff logs migrate seed clean install start-frontend start-bff start-backend start-booking start-analytics start-inventory start-services start-notification start-identity start-escrow db-setup

# Default target
help:
	@echo "🏗️  Intelli-Reserve Development Commands"
	@echo "========================================"
	@echo ""
	@echo "🚀 Quick Start:"
	@echo "  make dev              - Start all services (docker-compose + npm/go)"
	@echo "  make install          - Install all dependencies"
	@echo ""
	@echo "🐳 Docker & Infrastructure:"
	@echo "  make up               - Start docker-compose infrastructure"
	@echo "  make down             - Stop docker-compose infrastructure"
	@echo "  make logs             - View docker-compose logs"
	@echo ""
	@echo "🏗️  Building:"
	@echo "  make build            - Build all services"
	@echo "  make build-frontend   - Build Next.js frontend"
	@echo "  make build-bff        - Build Express.js BFF"
	@echo "  make build-backend    - Build Go backend services"
	@echo ""
	@echo "🧪 Testing:"
	@echo "  make test             - Run all tests"
	@echo "  make test-crud        - Run database CRUD tests"
	@echo "  make test-bff         - Run BFF & backend integration tests"
	@echo ""
	@echo "💾 Database:"
	@echo "  make db-setup         - Initialize database schema"
	@echo "  make migrate          - Run database migrations"
	@echo "  make seed             - Seed sample data"
	@echo ""
	@echo "🎯 Services:"
	@echo "  make start-frontend   - Start Next.js frontend (port 3000)"
	@echo "  make start-bff        - Start Express BFF (port 3001)"
	@echo "  make start-booking    - Start Booking Service (port 8090)"
	@echo "  make start-analytics  - Start Analytics Service (port 8091)"
	@echo "  make start-inventory  - Start Inventory Service (port 8092)"
	@echo "  make start-services   - Start Services Service (port 8093)"
	@echo "  make start-notification - Start Notification Service (port 8094)"
	@echo "  make start-identity   - Start Identity Service (port 8095)"
	@echo "  make start-escrow     - Start Escrow Service (port 8096)"
	@echo ""
	@echo "🧹 Maintenance:"
	@echo "  make clean            - Clean all build artifacts"
	@echo ""

# ============================================================================
# 🚀 QUICK START
# ============================================================================

dev: up db-setup seed install build start-frontend start-bff start-booking start-analytics start-inventory start-services start-notification start-identity start-escrow
	@echo "✅ All services started!"
	@echo "   Frontend:      http://localhost:3000"
	@echo "   BFF:           http://localhost:3001"
	@echo "   Booking Svc:   http://localhost:8090"
	@echo "   Analytics Svc: http://localhost:8091"
	@echo "   Inventory Svc: http://localhost:8092"
	@echo "   Services Svc:  http://localhost:8093"
	@echo "   Notification:  http://localhost:8094"
	@echo "   Identity:      http://localhost:8095"
	@echo "   Escrow Svc:    http://localhost:8096"

install:
	@echo "📦 Installing dependencies..."
	cd frontend && npm install
	cd ../bff && npm install
	cd ../backend/booking-service && go mod download
	cd ../backend/analytics-service && go mod download
	cd ../backend/inventory-service && go mod download
	cd ../backend/services-service && go mod download
	cd ../backend/notification-service && go mod download
	cd ../backend/identity-service && go mod download
	cd ../backend/escrow-service && go mod download

# ============================================================================
# 🐳 DOCKER & INFRASTRUCTURE
# ============================================================================

up:
	@echo "🐳 Starting docker-compose infrastructure..."
	docker-compose up -d
	@echo "✅ Docker services started (PostgreSQL, etc.)"

down:
	@echo "🛑 Stopping docker-compose infrastructure..."
	docker-compose down -v
	@echo "✅ Docker services stopped"

logs:
	docker-compose logs -f

# ============================================================================
# 🏗️  BUILDING
# ============================================================================

build: build-frontend build-bff build-backend
	@echo "✅ All services built successfully!"

build-frontend:
	@echo "📦 Building Next.js frontend..."
	cd frontend && npm run build

build-bff:
	@echo "📦 Building Express BFF..."
	cd bff && npm run build

build-backend:
	@echo "📦 Building Go backend services..."
	cd backend/booking-service && go build -o booking-service .
	cd ../analytics-service && go build -o analytics-service .
	cd ../inventory-service && go build -o inventory-service .
	cd ../services-service && go build -o services-service .
	cd ../notification-service && go build -o notification-service .
	cd ../identity-service && go build -o identity-service .
	cd ../escrow-service && go build -o escrow-service .

# ============================================================================
# 🧪 TESTING
# ============================================================================

test: test-crud test-bff
	@echo "✅ All tests completed!"

test-crud:
	@echo "🧪 Running database CRUD tests..."
	bash scripts/test-db-crud.sh

test-bff:
	@echo "🧪 Running BFF & backend integration tests..."
	bash scripts/test-bff-backend.sh

# ============================================================================
# 💾 DATABASE
# ============================================================================

db-setup:
	@echo "💾 Setting up database schema..."
	psql -U postgres -h localhost -c "DROP DATABASE IF EXISTS intelli_reserve;" || true
	psql -U postgres -h localhost -c "CREATE DATABASE intelli_reserve;"
	psql -U postgres -h localhost intelli_reserve -f scripts/setup-db.sql
	@echo "✅ Database schema initialized"

migrate:
	@echo "🔄 Running database migrations..."
	@echo "   (Migrations will be added here)"

seed:
	@echo "🌱 Seeding sample data..."
	bash scripts/seed-data.sh
	@echo "✅ Sample data seeded"

# ============================================================================
# 🎯 START INDIVIDUAL SERVICES
# ============================================================================

start-frontend:
	@echo "🚀 Starting Next.js frontend (port 3000)..."
	cd frontend && npm run dev &

start-bff:
	@echo "🚀 Starting Express BFF (port 3001)..."
	cd bff && npm run dev &

start-backend:
	@echo "🚀 Starting Go backend services..."
	cd backend/booking-service && ./booking-service &
	cd ../analytics-service && ./analytics-service &
	cd ../inventory-service && ./inventory-service &
	cd ../services-service && ./services-service &
	cd ../notification-service && ./notification-service &
	cd ../identity-service && ./identity-service &
	cd ../escrow-service && ./escrow-service &

start-booking:
	@echo "🚀 Starting Booking Service (port 8090)..."
	cd backend/booking-service && ./booking-service &

start-analytics:
	@echo "🚀 Starting Analytics Service (port 8091)..."
	cd backend/analytics-service && ./analytics-service &

start-inventory:
	@echo "🚀 Starting Inventory Service (port 8092)..."
	cd backend/inventory-service && ./inventory-service &

start-services:
	@echo "🚀 Starting Services Service (port 8093)..."
	cd backend/services-service && ./services-service &

start-notification:
	@echo "🚀 Starting Notification Service (port 8094)..."
	cd backend/notification-service && ./notification-service &

start-identity:
	@echo "🚀 Starting Identity Service (port 8095)..."
	cd backend/identity-service && ./identity-service &

start-escrow:
	@echo "🚀 Starting Escrow Service (port 8096)..."
	cd backend/escrow-service && ./escrow-service &

# ============================================================================
# 🧹 MAINTENANCE
# ============================================================================

clean:
	@echo "🧹 Cleaning build artifacts..."
	cd frontend && rm -rf .next dist node_modules || true
	cd ../bff && rm -rf dist node_modules || true
	cd ../backend/booking-service && rm -f booking-service || true
	cd ../backend/analytics-service && rm -f analytics-service || true
	cd ../backend/inventory-service && rm -f inventory-service || true
	cd ../backend/services-service && rm -f services-service || true
	cd ../backend/notification-service && rm -f notification-service || true
	cd ../backend/identity-service && rm -f identity-service || true
	cd ../backend/escrow-service && rm -f escrow-service || true
	@echo "✅ Cleanup complete"
