# IntelliReserve – Real-Time Booking Engine + Escrow Intelligence Suite

A fintech-grade booking platform with dynamic pricing, escrow payments, and analytics.

## ✨ Features

### Core Booking System
- **Real-Time Availability** – Dynamic time slot management with instant availability updates
- **Instant Booking Confirmation** – Host can confirm or reject pending bookings in real-time
- **Booking Status Tracking** – Pending → Confirmed → Completed workflow
- **Multi-Service Support** – Manage multiple services with different pricing and availability
- **Client Booking List** – View and manage all bookings with status tracking

### Payment & Escrow System
- **PayFast Integration** – Secure payment processing via PayFast (South Africa's leading payment gateway)
- **Escrow Holds** – Automatic hold creation when booking is confirmed
- **Payment Page** – Dedicated secure payment interface with amount breakdown
- **Multiple Payment Entry Points** – Access payment from booking confirmation or bookings list
- **Platform Fee Tracking** – Automatic 10% platform fee calculation and display
- **Payment Hold Management** – Create, release, and refund payment holds

### Host Dashboard
- **Pending Bookings Panel** – View and confirm/reject pending bookings with one click
- **Live Metrics** – Total bookings, released revenue, occupancy rates, response rates
- **Revenue Analytics** – Track monthly revenue trends with detailed charts
- **Occupancy Visualization** – Weekly booking utilization by day
- **Host Settings** – Manage profile and account preferences
- **Payout Management** – Request and track payout status (escrow service ready)

### Client Dashboard
- **Active Bookings** – View confirmed and pending bookings
- **Payment Management** – Access payment interface for confirmed bookings
- **Booking History** – Track past and current bookings
- **Profile & Settings** – Manage account information and subscription

### Analytics & Reporting
- **Real-Time Dashboard** – Live metrics from actual booking data (not mocked)
- **Revenue Tracking** – Track released funds from completed bookings
- **Booking Analytics** – Understand booking patterns and peak times
- **Response Rate Metrics** – Monitor host confirmation speed and reliability

### Additional Features
- **Offline Support** – Offline indicator, queue sync, background syncing
- **Subscription Management** – User subscription tracking and display
- **Mobile Responsive UI** – Full mobile optimization with responsive design
- **AI Assistant** – Built-in help system with FAQs and support

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15.2 + React 18 + TypeScript + shadcn/ui + TanStack Query
- **BFF Layer**: Express.js + TypeScript with gRPC client adapters
- **Backend Services**: Go + gRPC + PostgreSQL with pgx driver
- **Database**: PostgreSQL with optimized queries for real-time data
- **Message Queue**: Ready for event-driven architecture (Kafka/RabbitMQ)
- **Payment Gateway**: PayFast (South Africa)

### Service Topology
```
Frontend (Next.js, port 3000)
    ↓
BFF Layer (Express, port 3001)
    ↓
gRPC Services (multiple ports: 8090-8096)
    ├── Booking Service (Go, :8090)
    ├── Analytics Service (Go, :8091)
    ├── Inventory Service (Go, :8092)
    ├── Services Management (Go, :8093)
    ├── Notification Service (Go, :8094)
    ├── Identity Service (Go, :8095)
    ├── Escrow Service (Go, :8096)
    ├── Subscription Service (Go)
    ├── Pricing Service (Go)
    └── Payout Service (Go)
    ↓
PostgreSQL (port 5432)
    ↓
External: PayFast Payment Gateway
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
- `frontend/` – Next.js UI with host/client dashboards (responsive, mobile-optimized)
  - `/app/dashboard/host` – Host dashboard with pending bookings panel
  - `/app/dashboard/client` – Client dashboard with bookings and settings
  - `/app/dashboard/book` – Booking creation page for clients
  - `/app/dashboard/profile` – User profile with subscription info
  - `/app/dashboard/analytics` – Analytics dashboard (host revenue tracking)
  - `/components/PaymentForm.tsx` – PayFast payment integration
  - `/components/OfflineIndicator.tsx` – Offline support component
  
- `backend/` – Go microservices (gRPC-based architecture)
  - `booking-service/` – Booking management
  - `analytics-service/` – Analytics & reporting
  - `inventory-service/` – Time slot management
  - `identity-service/` – User authentication
  - `escrow-service/` – Payment holds & escrow management
    - `payment_gateway.go` – PayFast integration
    - `grpc_handlers.go` – gRPC service handlers
  - `subscription-service/` – Subscription management
  - `payout-service/` – Host payout processing
  - `pricing-service/` – Dynamic pricing engine
  - `services-service/` – Service catalog management
  - `notification-service/` – Email/SMS notifications
  - `notification-worker/` – Async notification processing
  
- `bff/` – Backend-for-Frontend Express API
  - `src/routes/` – REST endpoints
    - `bookings.routes.ts` – Booking endpoints
    - `escrow.routes.ts` – Payment/escrow endpoints
    - `payments.routes.ts` – PayFast integration endpoints
    - `dashboard.routes.ts` – Dashboard metrics
    - `subscriptions.routes.ts` – Subscription management
  - `src/grpc/` – gRPC client adapters and service communication
    - `adapters.ts` – Service adapters (EscrowServiceAdapter, etc.)
    - `client.ts` – gRPC client initialization
    
- `infra/` – Infrastructure
  - `docker/` – Docker configurations
  - `terraform/` – IaC for cloud deployment
  - `kubernetes/` – K8s manifests
  
- `backend/migrations/` – Database schema migrations
  - `011_create_escrow_schema.sql` – Escrow tables
  - `012_add_payment_reference_to_escrow_holds.sql` – Payment reference tracking
  - `013_add_subscription_tracking.sql` – Subscription schema

## API Endpoints

### Booking Management
- `POST /api/bookings` – Create new booking
- `GET /api/bookings/:id` – Get booking details
- `GET /api/bookings?hostId=X&status=Y` – List host bookings (with optional status filter)
- `PUT /api/bookings/:id/status` – Confirm/complete booking
- `POST /api/bookings/:id/cancel` – Cancel/reject booking

### Payment & Escrow
- `POST /api/escrow/holds` – Create payment hold for booking
- `GET /api/escrow/holds/:holdId` – Retrieve hold details
- `POST /api/escrow/holds/:holdId/release` – Release hold (settle payment to host)
- `POST /api/escrow/holds/:holdId/refund` – Refund hold (return to client)
- `GET /api/payments/payfast?holdId=X&amount=Y` – Initiate PayFast payment
- `GET /api/payments/payfast/return` – PayFast return callback
- `POST /api/payments/payfast/notify` – PayFast IPN webhook

### Escrow Account & Payouts
- `GET /api/escrow/accounts/:hostId` – Get escrow account balance
- `POST /api/escrow/payouts` – Request payout from available balance
- `GET /api/escrow/payouts/:hostId` – Get payout history

### Dashboard
- `GET /api/dashboard/metrics?hostId=X` – Get dashboard KPIs and charts
- `GET /api/analytics/revenue?hostId=X` – Revenue trends
- `GET /api/analytics/occupancy?hostId=X` – Occupancy data

### Services & Time Slots
- `GET /api/services` – List all services
- `GET /api/time-slots?serviceId=X&date=Y` – Get available time slots

### Subscriptions
- `GET /api/subscription/user/:userId` – Get user subscription details
- `GET /api/subscription/plans` – List available subscription plans
- `POST /api/subscription/subscribe` – Subscribe to a plan

### Identity & Users
- `POST /api/auth/register` – User registration
- `POST /api/auth/login` – User login
- `GET /api/profile` – Get current user profile
- `PUT /api/profile` – Update user profile

## Database Schema

### Key Tables
- `bookings` – Booking records with status tracking (pending, confirmed, completed, cancelled)
- `services` – Service offerings by hosts
- `time_slots` – Available booking slots with occupancy tracking
- `users` – Host and client profiles
- `escrow_accounts` – Payment escrow tracking with held/available balances
- `escrow_holds` – Payment holds for individual bookings with PayFast reference
- `payouts` – Host payout requests and history
- `subscriptions` – User subscription plans and status
- `transactions` – Transaction history for auditing

## Development Commands

```bash
# Frontend
cd frontend
npm install
npm run dev          # Start dev server on :3000
npm run build        # Production build
npm test            # Run tests

# BFF (Backend-for-Frontend)
cd bff
npm install
npm run dev          # Start with auto-reload on :3001
npm run build        # Production build

# Backend Services (each in separate terminal)
cd backend/booking-service && go build -o booking-service . && ./booking-service
cd backend/analytics-service && go build -o analytics-service . && ./analytics-service
cd backend/escrow-service && go build -o escrow-service . && ./escrow-service       # ✨ NEW
cd backend/subscription-service && go build -o subscription-service . && ./subscription-service  # ✨ NEW
cd backend/payout-service && go build -o payout-service . && ./payout-service       # ✨ NEW
cd backend/inventory-service && go build -o inventory-service . && ./inventory-service
cd backend/services-service && go build -o services-service . && ./services-service
cd backend/identity-service && go build -o identity-service . && ./identity-service
cd backend/notification-service && go build -o notification-service . && ./notification-service

# Or use Docker Compose
docker-compose up  # Starts all services
```

## Testing the Booking & Payment Flow

1. **Create a booking** (via frontend or API):
   ```bash
   POST /api/bookings
   {
     "serviceId": "<ID>",
     "timeSlotId": "<ID2>",
     "hostId": "<ID3>",
     "clientName": "John Doe",
     "clientEmail": "john@example.com",
     "numberOfParticipants": 1
   }
   ```

2. **View pending bookings** on host dashboard:
   - Navigate to http://localhost:3000/dashboard/host
   - See "Pending Confirmation" card with list of bookings

3. **Confirm booking** using the dashboard:
   - Click "Confirm" button on pending booking
   - Booking status changes to "confirmed"
   - Escrow hold is automatically created

4. **Complete payment** (NEW):
   - Client can now access payment from:
     - **Option A**: Booking confirmation page → "Proceed to Payment" button
     - **Option B**: Bookings list → "Pay Now" button (for confirmed bookings)
   - PayFast popup opens with secure payment form
   - On success, popup closes and funds are held in escrow

5. **Track escrow status**:
   - Backend escrow service manages the held funds
   - Host can request payout from available balance after service completion

## Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=intelli_reserve

# Payment Gateway (PayFast)
PAYFAST_MERCHANT_ID=your_merchant_id
PAYFAST_MERCHANT_KEY=your_merchant_key
PAYFAST_ENV=sandbox  # or 'production'

# BFF
BFF_BASE_URL=http://localhost:3001

# Backend gRPC Services
BACKEND_GRPC_URL=localhost:8090
ANALYTICS_GRPC_URL=localhost:8091
INVENTORY_GRPC_URL=localhost:8092
SERVICES_GRPC_URL=localhost:8093
NOTIFICATION_GRPC_URL=localhost:8094
IDENTITY_GRPC_URL=localhost:8095
ESCROW_GRPC_URL=localhost:8096
```

## Performance Optimizations

- Query caching with TanStack Query (30s for pending bookings, 5m for metrics)
- Real-time refetch on window focus
- Optimized database queries with proper indexing
- gRPC for low-latency backend communication
- React Query for smart client-side state management
- PayFast payment processing with 3-attempt retry logic
- Offline queue syncing for uninterrupted experience

## What's New in This Release ✨

### Payment System (v2.0)
- Full PayFast payment gateway integration
- Escrow hold creation and management
- Multiple payment entry points (confirmation screen & bookings list)
- Secure popup-based payment flow with auto-close
- Payment reference tracking in database

### Offline Support (v2.0)
- Offline indicator showing sync status
- Automatic queue-based retry for failed requests
- Background sync when connection restored
- User-friendly offline notifications

### Subscription Management (v2.0)
- User subscription tracking
- Profile page showing active subscription
- Subscription plan management endpoints

### Mobile-First Design (v2.0)
- Fully responsive UI for all screen sizes
- Mobile-optimized dashboards and payment flow
- Touch-friendly interface elements

## License

Proprietary - IntelliReserve 2026
