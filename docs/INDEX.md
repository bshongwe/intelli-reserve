# Documentation Index

Comprehensive documentation for IntelliReserve – a production-ready booking platform with offline support, escrow payments, and real-time analytics.

## Documentation Overview

| Document | Purpose | Audience |
|----------|---------|----------|
| **[FEATURES.md](./FEATURES.md)** | What the system can do | Everyone (product, eng, design) |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | How the system is built | Engineers, architects |
| **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** | Technical deep-dives | Backend engineers |
| **[DATA_FLOW.md](./DATA_FLOW.md)** | Request/response flows | All engineers |
| **[requirements.md](./requirements.md)** | Feature specifications | Product, QA |
| **[ADRs/](./ADRs/)** | Design decisions | Architects, leads |

## Quick Navigation

### For Product Managers / Project Leads
1. **[FEATURES.md](./FEATURES.md)** – Complete feature inventory and roadmap
2. **[DATA_FLOW.md](./DATA_FLOW.md)** – See how booking and payment flows work
3. **[ARCHITECTURE.md](./ARCHITECTURE.md)** → Performance Benchmarks section

### For Engineers (Getting Started)
1. **[README.md](../README.md)** – Quick start and prerequisites
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** – System design and topology
3. **[DATA_FLOW.md](./DATA_FLOW.md)** – Understanding data movement
4. **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** – Specific feature implementations

### For Backend Engineers
1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** → Key Services Architecture section
2. **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** – Error handling, timestamps, queries
3. **[DATA_FLOW.md](./DATA_FLOW.md)** → gRPC communication patterns

### For Frontend Engineers
1. **[FEATURES.md](./FEATURES.md)** → Offline-First Architecture section
2. **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** → Offline Sync Deep-Dive
3. **[DATA_FLOW.md](./DATA_FLOW.md)** → State Management Flow section

### For DevOps / Infrastructure
1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** → Deployment Architecture section
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** → Service Port Registry
3. Check `infra/` directory for Terraform and Kubernetes manifests

## Documentation Structure

### FEATURES.md
Describes what the system can do, organized by capability area:
- Core booking system
- Host dashboard
- Client experience
- Analytics & reporting
- Payment processing
- Offline support
- Feature completeness matrix with roadmap

**Read this to**: Understand capabilities, plan features, communicate with stakeholders

### ARCHITECTURE.md
Describes the system design and technology choices:
- System overview with mermaid diagrams
- Three-tier architecture (Frontend → BFF → Services)
- Service topology and responsibilities
- Technology stack for each layer
- Communication patterns (sync/async)
- Performance benchmarks
- Deployment diagrams (development & production)

**Read this to**: Understand overall system design, make architectural decisions

### IMPLEMENTATION.md
Technical deep-dives into how key features work:
- Offline-first synchronization (queue, retry, sync)
- Payment status checking (gRPC method, backend, frontend)
- Error message constants (DRY principle)
- Timestamp handling across layers
- Database query optimization
- gRPC communication patterns
- Frontend state management
- Security implementations
- Known limitations & future work

**Read this to**: Implement features, debug complex issues, understand trade-offs

### DATA_FLOW.md
Step-by-step flows for all major operations:
- Booking creation workflow
- Booking confirmation workflow
- Dashboard metrics calculation
- Payment hold lifecycle
- Offline sync workflow
- Error handling flow
- State management with React Query
- Performance optimizations

**Read this to**: Understand request/response flows, debug data issues, trace requests

### requirements.md
Feature specifications and system requirements (currently empty - can be extended)

### ADRs/
Architecture Decision Records - why we made certain design choices

**Read this to**: Understand rationale behind architectural decisions

## Quick Reference

### Understanding the Booking Flow
1. Start with [ARCHITECTURE.md](./ARCHITECTURE.md) → **System Overview** section
2. Review the three-tier architecture diagram
3. Read [ARCHITECTURE.md](./ARCHITECTURE.md) → **Key Services Architecture** for Booking Service details
4. Deep dive with [DATA_FLOW.md](./DATA_FLOW.md) → **Booking Creation Flow** section

### Understanding Confirmation Features
1. Check [ARCHITECTURE.md](./ARCHITECTURE.md) → **Data Flow for Booking Confirmation**
2. Study [DATA_FLOW.md](./DATA_FLOW.md) → **Booking Confirmation Flow** for detailed steps
3. Review React Query caching strategy in [DATA_FLOW.md](./DATA_FLOW.md) → **State Management Flow**

### Understanding Dashboard Metrics
1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) → **Key Services Architecture** → Analytics Service
2. Review [DATA_FLOW.md](./DATA_FLOW.md) → **Dashboard Metrics Flow** for query details
3. Check performance optimizations in [DATA_FLOW.md](./DATA_FLOW.md) → **Performance Optimizations**

### Understanding the API
1. Check [../README.md](../README.md) → **API Endpoints** section
2. Reference [DATA_FLOW.md](./DATA_FLOW.md) → **Step-by-Step API Requests** within each flow
3. Review error handling in [DATA_FLOW.md](./DATA_FLOW.md) → **Error Flow**

### Understanding Database Schema
1. See [ARCHITECTURE.md](./ARCHITECTURE.md) → **Data Persistence Layer**
2. Check [../backend/migrations/](../backend/migrations/) for schema migrations
3. Review [DATA_FLOW.md](./DATA_FLOW.md) → **Database Storage** sections in flows

## Important Architectural Details

### Timestamp Handling (CRITICAL)
- **PostgreSQL**: `timestamp without time zone` (UTC)
- **Go Service**: Scanned into `time.Time`, converted to RFC3339
- **Proto**: Defined as `string` type
- **Frontend**: Received as ISO8601 string

See [ARCHITECTURE.md](./ARCHITECTURE.md) → **Timestamp Handling** and [DATA_FLOW.md](./DATA_FLOW.md) → **Data Type Conversions**

### State Management
- Frontend uses **React Query (TanStack Query)**
- Pending bookings: 60s stale time, 15s refetch interval
- Dashboard metrics: 5m stale time, 30s refetch interval
- Cache invalidation on mutations ensures data consistency

See [DATA_FLOW.md](./DATA_FLOW.md) → **State Management Flow**

### Performance
- P50 booking creation: ~85ms
- P95 booking confirmation: ~300ms
- Dashboard metrics P50: ~100ms
- Optimized with query indexing and connection pooling

See [ARCHITECTURE.md](./ARCHITECTURE.md) → **Performance Benchmarks** and [DATA_FLOW.md](./DATA_FLOW.md) → **Performance Optimizations**

## Documentation Structure

### FEATURES.md
Describes what the system can do, organized by capability area:
- Core booking system
- Host dashboard
- Client experience
- Analytics & reporting
- Payment processing
- Offline support
- Feature completeness matrix with roadmap

**Read this to**: Understand capabilities, plan features, communicate with stakeholders

### ARCHITECTURE.md
Describes the system design and technology choices:
- System overview with mermaid diagrams
- Three-tier architecture (Frontend → BFF → Services)
- Service topology and responsibilities
- Technology stack for each layer
- Communication patterns (sync/async)
- Performance benchmarks
- Deployment diagrams (development & production)
- Production status and roadmap

**Read this to**: Understand overall system design, make architectural decisions

### IMPLEMENTATION.md
Technical deep-dives into how key features work:
- Offline-first synchronization (queue, retry, sync)
- Payment status checking (gRPC method, backend, frontend)
- Error message constants (DRY principle)
- Timestamp handling across layers
- Database query optimization
- gRPC communication patterns
- Frontend state management
- Security implementations
- Known limitations & future work

**Read this to**: Implement features, debug complex issues, understand trade-offs

### DATA_FLOW.md
Step-by-step flows for all major operations:
- Booking creation workflow
- Booking confirmation workflow
- Dashboard metrics calculation
- Payment hold lifecycle
- Offline sync workflow
- Error handling flow
- State management with React Query
- Performance optimizations

**Read this to**: Understand request/response flows, debug data issues, trace requests

### requirements.md
Feature specifications and system requirements

**Read this to**: Understand detailed feature requirements

### ADRs/
Architecture Decision Records - why we made certain design choices

**Read this to**: Understand rationale behind architectural decisions

## Topic-Based Navigation

### How do I...?

**...understand how bookings work?**
1. Read [FEATURES.md](./FEATURES.md) → Core Booking System
2. Study [DATA_FLOW.md](./DATA_FLOW.md) → Booking Creation Flow
3. Review [ARCHITECTURE.md](./ARCHITECTURE.md) → Key Services Architecture → Booking Service

**...understand offline support?**
1. Read [FEATURES.md](./FEATURES.md) → Offline-First Architecture
2. Study [IMPLEMENTATION.md](./IMPLEMENTATION.md) → Offline-First Synchronization
3. Check [DATA_FLOW.md](./DATA_FLOW.md) for offline workflow

**...understand payment processing?**
1. Read [FEATURES.md](./FEATURES.md) → Payment Processing & Escrow
2. Study [IMPLEMENTATION.md](./IMPLEMENTATION.md) → Payment Status Check
3. Review [ARCHITECTURE.md](./ARCHITECTURE.md) → Key Services Architecture → Escrow Service

**...understand real-time metrics?**
1. Read [FEATURES.md](./FEATURES.md) → Analytics & Reporting
2. Study [DATA_FLOW.md](./DATA_FLOW.md) → Dashboard Metrics Calculation
3. Review [ARCHITECTURE.md](./ARCHITECTURE.md) → Key Services Architecture → Analytics Service

**...understand the frontend architecture?**
1. Read [FEATURES.md](./FEATURES.md) → Technical Implementation → Frontend Capabilities
2. Study [IMPLEMENTATION.md](./IMPLEMENTATION.md) → Frontend State Management
3. Review [DATA_FLOW.md](./DATA_FLOW.md) → State Management Flow

**...understand the backend architecture?**
1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) → System Overview diagram
2. Study [IMPLEMENTATION.md](./IMPLEMENTATION.md) → gRPC Communication
3. Review [DATA_FLOW.md](./DATA_FLOW.md) → Service Communication

**...add a new API endpoint?**
1. Check [ARCHITECTURE.md](./ARCHITECTURE.md) → Service Port Registry
2. Reference [DATA_FLOW.md](./DATA_FLOW.md) for similar flows
3. Follow pattern in `bff/src/routes/`

**...add a new database query?**
1. Review [IMPLEMENTATION.md](./IMPLEMENTATION.md) → Database Query Optimization
2. Check `backend/migrations/` for schema
3. Follow gRPC pattern in service handlers

**...debug a data flow issue?**
1. Reference [DATA_FLOW.md](./DATA_FLOW.md) for expected flow
2. Check [IMPLEMENTATION.md](./IMPLEMENTATION.md) for technical details
3. Review logs: Network (browser) → BFF → Service → Database

## System Overview Concepts

### Key Architectural Decisions
- **Three-tier architecture**: Frontend → BFF → Microservices ensures clear separation
- **gRPC for backend**: Low-latency service-to-service communication
- **Offline-first frontend**: Users can work offline with automatic sync
- **Escrow payments**: Secure fund holding with PayFast integration
- **Real-time analytics**: Live metrics from current booking data (no pre-aggregation)

See [ADRs/](./ADRs/) for detailed decision records

### Technology Choices
- **Next.js 15 + React 18** for modern frontend with SSR
- **Express.js** for lightweight API gateway
- **Go + gRPC** for high-performance microservices
- **PostgreSQL** for reliable relational data
- **Dexie + IndexedDB** for browser persistence

### Performance Characteristics
- Booking operations: P50 ~45ms, P95 ~120ms
- Dashboard metrics: P50 ~80ms, P95 ~200ms
- Optimized with indexing and connection pooling
- See [ARCHITECTURE.md](./ARCHITECTURE.md) → Performance Benchmarks

### Production Status
**What's Production-Ready** ✅
- All core features fully implemented
- Offline-first frontend with automatic sync
- Escrow payment integration
- Real-time analytics
- Comprehensive error handling
- Security best practices

**What's Planned** 🔲
- Payout automation
- Dynamic pricing
- Email verification
- Advanced analytics
- See [ARCHITECTURE.md](./ARCHITECTURE.md) → Production Status

## Development Resources

### Code Locations
- Frontend: `frontend/src/`
- BFF: `bff/src/routes/` and `bff/src/grpc/`
- Services: `backend/{service-name}/grpc_handlers.go`
- Definitions: `backend/proto/`
- Migrations: `backend/migrations/`

### Stack Components
- **Frontend**: Next.js 15, React 18, TypeScript, shadcn/ui, TanStack Query
- **BFF**: Express.js, TypeScript, gRPC, Zod validation
- **Services**: Go 1.21+, gRPC, pgx
- **Database**: PostgreSQL 12+
- **Offline**: Dexie IndexedDB wrapper

### Running Locally
See [../README.md](../README.md) → Quick Start section for setup instructions

## Contributing

When modifying or extending the system:
1. Update relevant documentation with changes
2. Add Architecture Decision Records for significant decisions
3. Include performance implications
4. Update diagrams if architecture changes
5. Test changes in local development environment

## Last Updated

April 2026

For questions or clarifications, refer to the specific documentation sections linked above.
