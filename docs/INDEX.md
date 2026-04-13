# Documentation Index

Welcome to the IntelliReserve documentation! This index helps you navigate all available documentation.

## Getting Started

- **[README.md](../README.md)** – Main project overview and quick start guide
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** – System design and technology stack (START HERE for system understanding)
- **[DATA_FLOW.md](./DATA_FLOW.md)** – Detailed flow diagrams for all major operations

## Key Documentation

### System Design
- [ARCHITECTURE.md](./ARCHITECTURE.md)
  - System overview with architectural diagram
  - Three-tier architecture explanation
  - Technology stack for each layer
  - Service responsibilities
  - Communication patterns
  - Performance benchmarks

### Data & Operations
- [DATA_FLOW.md](./DATA_FLOW.md)
  - Step-by-step booking creation flow
  - Real-time booking confirmation flow
  - Dashboard metrics calculation
  - Timestamp handling across layers
  - Error handling flow
  - State management with React Query
  - Race condition handling
  - Performance optimizations

### Requirements & Planning
- [requirements.md](./requirements.md) – Feature specifications and system requirements
- [ADRs/](./ADRs/) – Architecture Decision Records with rationale

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

## Development Resources

### Understanding the Stack
- **Frontend**: Next.js 15, React 18, TypeScript, shadcn/ui, TanStack Query
- **BFF**: Express.js, TypeScript, gRPC, Zod validation
- **Services**: Go, gRPC, pgx
- **Database**: PostgreSQL 12+

### Code Locations
- Frontend code: `frontend/src/`
- BFF routes: `bff/src/routes/`
- Booking service handlers: `backend/booking-service/grpc_handlers.go`
- Proto definitions: `backend/proto/`
- Database schema: `backend/migrations/`

### Common Tasks

**Adding a new API endpoint:**
1. Define in BFF: `bff/src/routes/`
2. Call appropriate service method via gRPC
3. Transform and return JSON response
4. Add frontend API method in `frontend/src/lib/api.ts`
5. Update frontend component to use the method

**Adding a new database query:**
1. Update Go service: `backend/booking-service/`
2. Add gRPC method definition in `backend/proto/`
3. Implement handler in Go service
4. Rebuild proto: `./scripts/generate-grpc.sh`
5. Call from BFF via adapter
6. Expose through REST endpoint

**Debugging a data flow issue:**
1. Check browser DevTools Network tab for API calls
2. Review BFF logs for request/response
3. Check PostgreSQL logs for query errors
4. Review Go service logs for gRPC errors
5. Reference [DATA_FLOW.md](./DATA_FLOW.md) for expected flow

## FAQ

**Q: How do timestamps work across the system?**
A: See [ARCHITECTURE.md](./ARCHITECTURE.md) → **Timestamp Handling** and [DATA_FLOW.md](./DATA_FLOW.md) → **Data Type Conversions**

**Q: How is real-time data kept in sync?**
A: See [DATA_FLOW.md](./DATA_FLOW.md) → **State Management Flow** for React Query strategy

**Q: What happens when booking status is updated?**
A: See [DATA_FLOW.md](./DATA_FLOW.md) → **Booking Confirmation Flow** for complete timeline

**Q: How are metrics calculated?**
A: See [DATA_FLOW.md](./DATA_FLOW.md) → **Dashboard Metrics Flow** and SQL queries

**Q: How does error handling work?**
A: See [DATA_FLOW.md](./DATA_FLOW.md) → **Error Flow** for error propagation

**Q: What's the performance like?**
A: See [ARCHITECTURE.md](./ARCHITECTURE.md) → **Performance Benchmarks** for timing data

## Contributing

When adding new features:
1. Update this documentation with new flows
2. Add decision records in `ADRs/` if architectural changes
3. Include performance implications
4. Document any new data type conversions
5. Update architecture diagrams if needed

## Last Updated

April 2026

For questions or clarifications, refer to the specific documentation sections linked above.
