.PHONY: help dev up down build build-frontend build-bff build-backend test test-crud test-bff logs migrate seed clean install start-frontend start-bff start-backend db-setup

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
	@echo "  make start-backend    - Start Go backend (port 8080)"
	@echo ""
	@echo "🧹 Maintenance:"
	@echo "  make clean            - Clean all build artifacts"
	@echo ""

# ============================================================================
# 🚀 QUICK START
# ============================================================================

dev: up db-setup seed install build start-frontend start-bff start-backend
	@echo "✅ All services started!"
	@echo "   Frontend:  http://localhost:3000"
	@echo "   BFF:       http://localhost:3001"
	@echo "   Backend:   http://localhost:8080"

install:
	@echo "📦 Installing dependencies..."
	cd frontend && npm install
	cd ../bff && npm install
	cd ../backend/booking-service && go mod download

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
	@echo "🚀 Starting Go backend (port 8080)..."
	cd backend/booking-service && ./booking-service &

# ============================================================================
# 🧹 MAINTENANCE
# ============================================================================

clean:
	@echo "🧹 Cleaning build artifacts..."
	cd frontend && rm -rf .next dist node_modules || true
	cd ../bff && rm -rf dist node_modules || true
	cd ../backend/booking-service && rm -f booking-service || true
	@echo "✅ Cleanup complete"
