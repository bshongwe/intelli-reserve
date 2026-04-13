# IntelliReserve – Real-Time Booking Engine + Escrow Intelligence Suite

A fintech-grade booking platform with dynamic pricing, escrow payments, and analytics.

## ✨ Features

### Core Booking System
- **Real-Time Availability** – Dynamic time slot management with instant availability updates
- **Instant Booking Confirmation** – Host can confirm or reject pending bookings in real-time
- **Booking Status Tracking** – Pending → Confirmed → Completed workflow
- **Multi-Service Support** – Manage multiple services with different pricing and availability

### Host Dashboard
- **Pending Bookings Panel** – View and confirm/reject pending bookings with one click
- **Live Metrics** – Total bookings, released revenue, occupancy rates, response rates
- **Revenue Analytics** – Track monthly revenue trends with detailed charts
- **Occupancy Visualization** – Weekly booking utilization by day

### Analytics & Reporting
- **Real-Time Dashboard** – Live metrics from actual booking data (not mocked)
- **Revenue Tracking** – Track released funds from completed bookings
- **Booking Analytics** – Understand booking patterns and peak times
- **Response Rate Metrics** – Monitor host confirmation speed and reliability

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15.2 + React 18 + TypeScript + shadcn/ui + TanStack Query
- **BFF Layer**: Express.js + TypeScript with gRPC client adapters
- **Backend Services**: Go + gRPC + PostgreSQL with pgx driver
- **Database**: PostgreSQL with optimized queries for real-time data
- **Message Queue**: Ready for event-driven architecture (Kafka/RabbitMQ)

### Service Topology
```
Frontend (Next.js, port 3000)
    ↓
BFF (Express, port 3001)
    ↓
gRPC Services (port 8090)
    ├── Booking Service (Go)
    ├── Analytics Service
    ├── Inventory Service
    └── Other Services
    ↓
PostgreSQL (port 5432)
```

## Quick Start

### Prerequisites
- Go 1.21+
- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose (optional)

### Development Setup

**1. Start Database**
```bash
docker-compose up postgres
```

**2. Start Backend Services**
```bash
# Terminal 1: Booking Service (gRPC)
cd backend/booking-service
go build -o booking-service .
./booking-service

# Terminal 2: BFF Layer
cd bff
npm install
npm run dev
```

**3. Start Frontend**
```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:3000/dashboard/host to access the host dashboard.

## 📚 Documentation

For detailed information about the system, please refer to:

### **[📖 Documentation Index](./docs/INDEX.md)** ← START HERE
Comprehensive guide to all documentation with quick reference guides and FAQ

### [Architecture Documentation](./docs/ARCHITECTURE.md)
Complete system architecture including:
- Three-tier architecture diagram
- Technology stack details
- Service topology and responsibilities
- Communication patterns (sync/async)
- Timestamp handling across layers
- Booking confirmation flow
- Caching strategy
- Error handling
- Security considerations
- Performance benchmarks

### [Data Flow Documentation](./docs/DATA_FLOW.md)
Detailed data flow for each major operation:
- **Booking Creation Flow** – From user input through database storage
- **Booking Confirmation Flow** – Real-time confirmation/rejection workflow
- **Dashboard Metrics Flow** – KPI calculation and display
- **Data Type Conversions** – Critical timestamp handling details
- **Error Flow** – Error propagation through layers
- **State Management** – React Query dependency graph
- **Concurrency Scenarios** – Race condition avoidance
- **Performance Optimizations** – Query optimization and caching
- **Data Integrity** – ACID compliance and state machines

### [Requirements](./docs/requirements.md)
System requirements and feature specifications

### [Architecture Decision Records](./docs/ADRs/)
Architectural decisions with rationale and implications

## Project Structure
- `frontend/` – Next.js UI with host/client dashboards
  - `/app/dashboard/host` – Host dashboard with pending bookings panel
  - `/app/dashboard/book` – Booking creation page for clients
  - `/app/dashboard/analytics` – Analytics dashboard
- `backend/` – Go microservices
  - `booking-service/` – Booking management (gRPC)
  - `analytics-service/` – Analytics & reporting
  - `inventory-service/` – Time slot management
  - `identity-service/` – User authentication
- `bff/` – Backend-for-Frontend Express API
  - `src/routes/` – REST endpoints (bookings, dashboard, analytics)
  - `src/grpc/` – gRPC client adapters and service communication
- `infra/` – Infrastructure
  - `docker/` – Docker configurations
  - `terraform/` – IaC for cloud deployment
  - `kubernetes/` – K8s manifests

## API Endpoints

### Booking Management
- `POST /api/bookings` – Create new booking
- `GET /api/bookings/:id` – Get booking details
- `GET /api/bookings?hostId=X&status=Y` – List host bookings (with optional status filter)
- `PUT /api/bookings/:id/status` – Confirm/complete booking
- `POST /api/bookings/:id/cancel` – Cancel/reject booking

### Dashboard
- `GET /api/dashboard/metrics?hostId=X` – Get dashboard KPIs and charts
- `GET /api/analytics/revenue?hostId=X` – Revenue trends
- `GET /api/analytics/occupancy?hostId=X` – Occupancy data

### Services & Time Slots
- `GET /api/services` – List all services
- `GET /api/time-slots?serviceId=X&date=Y` – Get available time slots

## Database Schema

### Key Tables
- `bookings` – Booking records with status tracking (pending, confirmed, completed, cancelled)
- `services` – Service offerings by hosts
- `time_slots` – Available booking slots with occupancy tracking
- `users` – Host and client profiles
- `escrow_accounts` – Payment escrow tracking


## Development Commands

```bash
# Frontend
cd frontend
npm install
npm run dev          # Start dev server
npm run build        # Production build
npm test            # Run tests

# BFF
cd bff
npm install
npm run dev          # Start with auto-reload
npm run build        # Production build

# Backend Booking Service
cd backend/booking-service
go build -o booking-service .
./booking-service
```

## Testing the Booking Flow

1. **Create a booking** (via frontend or API):
   ```bash
   POST /api/bookings
   {
     "serviceId": "<ID>",
     "timeSlotId": "<ID2>>",
     "hostId": "<ID3>>",
     "clientName": "John Doe",
     "clientEmail": "john@example.com",
     "numberOfParticipants": num
   }
   ```

2. **View pending bookings** on host dashboard:
   - Navigate to http://localhost:3000/dashboard/host
   - See "Pending Confirmation" card with list of bookings

3. **Confirm or reject** using the dashboard buttons


## Performance Optimizations

- Query caching with TanStack Query (30s for pending bookings, 5m for metrics)
- Real-time refetch on window focus
- Optimized database queries with proper indexing
- gRPC for low-latency backend communication
- React Query for smart client-side state management

## License

Proprietary - IntelliReserve 2026
