# IntelliReserve Architecture

## System Overview

IntelliReserve is a microservices-based booking and reservation platform with a modern three-tier architecture:

```mermaid
graph TB
    subgraph Client["🖥️ Client Layer"]
        FE["Frontend<br/>Next.js 15.2.0 + React 18<br/>Port: 3000<br/>- Host Dashboard<br/>- Client Dashboard<br/>- Analytics Dashboard<br/>- Service Management"]
    end
    
    subgraph BFF["🔗 API Gateway / BFF Layer"]
        BFFE["Backend for Frontend<br/>Express.js + TypeScript<br/>Port: 3001<br/>- Request Transformation<br/>- Input Validation<br/>- gRPC Adapter<br/>- CORS & Security"]
    end
    
    subgraph Services["🚀 Microservices Layer"]
        BS["Booking Service<br/>Go + gRPC<br/>Port: 8090<br/>- Create/Update/Cancel<br/>- List Bookings<br/>- Status Tracking"]
        AS["Analytics Service<br/>Go + gRPC<br/>Port: 8091<br/>- Revenue Trends<br/>- Occupancy Rates<br/>- Customer Stats"]
        IS["Inventory Service<br/>Go + gRPC<br/>Port: 8092<br/>- Time Slot Occupancy<br/>- Availability<br/>- Capacity Tracking"]
        SS["Services Service<br/>Go + gRPC<br/>Port: 8093<br/>- Service CRUD<br/>- Time Slot Management<br/>- Host Service Listings"]
        NS["Notification Service<br/>Go + gRPC<br/>Port: 8094<br/>- Email<br/>- SMS<br/>- Push Notifications"]
    end
    
    subgraph Data["💾 Data Persistence Layer"]
        DB["PostgreSQL Database<br/>Port: 5432<br/>- Users & Auth<br/>- Services & Pricing<br/>- Bookings & Status<br/>- Time Slots<br/>- Escrow & Transactions<br/>- Notifications & Logs"]
    end
    
    FE -->|HTTP/JSON| BFFE
    BFFE -->|gRPC| BS
    BFFE -->|gRPC| AS
    BFFE -->|gRPC| IS
    BFFE -->|gRPC| SS
    BFFE -->|gRPC| NS
    BS -->|SQL| DB
    AS -->|SQL| DB
    IS -->|SQL| DB
    SS -->|SQL| DB
    NS -->|SQL| DB
    
    style Client fill:#e1f5ff
    style BFF fill:#f3e5f5
    style Services fill:#e8f5e9
    style Data fill:#fff3e0
```

## Technology Stack

### Frontend
- **Framework**: Next.js 15.2.0 (React 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + PostCSS
- **UI Components**: shadcn/ui (Radix UI based)
- **State Management**: TanStack React Query (Server State)
- **Charts**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Fetch API (via centralized api.ts layer)

### Backend for Frontend (BFF)
- **Framework**: Express.js
- **Language**: TypeScript
- **gRPC Client**: @grpc/grpc-js
- **Validation**: Zod (TypeScript-first schema validation)
- **Request Logging**: Morgan
- **Error Handling**: Centralized with detailed error responses

### Microservices
- **Language**: Go 1.21+
- **gRPC Framework**: protobuf v3
- **Database Driver**: pgx (PostgreSQL)
- **HTTP Client**: Built-in net/http

### Data Layer
- **Database**: PostgreSQL 12+
- **Connection Pooling**: pgx with configured pool sizes
- **Migrations**: SQL migration files in `/backend/migrations`
- **Query Optimization**: Indexed columns for common queries

### DevOps & Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes (manifests in `/infra/kubernetes`)
- **Infrastructure as Code**: Terraform (in `/infra/terraform`)
- **Docker Compose**: Local development environment

## Service Port Registry

| Service | HTTP (Health) | gRPC | Status |
|---------|--------------|------|--------|
| Frontend | 3000 | — | ✅ Live |
| BFF | 3001 | — | ✅ Live |
| Booking Service | 8080 | 8090 | ✅ Live |
| Analytics Service | 8081 | 8091 | ✅ Live |
| Inventory Service | 8082 | 8092 | ✅ Live |
| Services Service | 8083 | 8093 | ✅ Live |
| Notification Service | 8084 | 8094 | ✅ Live |
| Identity Service | 8085 | 8095 | 🔲 Planned |
| Escrow Service | 8086 | 8096 | 🔲 Planned |
| Payout Service | 8087 | 8097 | 🔲 Planned |
| Pricing Service | 8088 | 8098 | 🔲 Planned |

## Key Services Architecture

### Booking Service
**Responsibility**: Manage all booking lifecycle operations

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant BFF as BFF Layer
    participant BS as Booking Service
    participant DB as PostgreSQL
    
    FE->>BFF: POST /api/bookings
    BFF->>BFF: Validate with Zod Schema
    BFF->>BS: gRPC CreateBooking()
    BS->>DB: INSERT INTO bookings
    DB->>BS: Return booking with timestamps
    BS->>BS: Convert time.Time to RFC3339
    BS->>BFF: Return Booking object
    BFF->>FE: 201 JSON response
```

**Core Methods**:
- `CreateBooking(serviceId, timeSlotId, hostId, clientInfo)` → Booking
- `GetBooking(bookingId)` → Booking
- `GetHostBookings(hostId, status?)` → []Booking
- `GetClientBookings(clientEmail, status?)` → []Booking
- `UpdateBookingStatus(bookingId, status)` → Booking
- `CancelBooking(bookingId, reason)` → Booking
- `DeleteBooking(bookingId)` → void

**Data Models**:
```protobuf
message Booking {
  string id = 1;
  string serviceId = 2;
  string timeSlotId = 3;
  string hostId = 4;
  string clientName = 5;
  string clientEmail = 6;
  string clientPhone = 7;
  int32 numberOfParticipants = 8;
  string status = 9;           // pending, confirmed, completed, cancelled
  string notes = 10;
  string createdAt = 11;       // RFC3339 format
  string updatedAt = 12;       // RFC3339 format
}
```

### Analytics Service
**Responsibility**: Aggregate and compute analytics metrics live from booking and service data

**Core Methods**:
- `GetDashboardMetrics(hostId)` → DashboardMetrics
- `GetAnalytics(hostId, timeRange)` → AnalyticsData
- `GetRevenueReport(hostId, startDate, endDate)` → RevenueReport
- `GetBookingStatistics(hostId, timeRange)` → BookingStatistics

**Note**: All metrics are computed live via SQL aggregation — no pre-aggregated snapshot tables exist. The `analytics` and `dashboard_metrics` tables were removed in migration 007.

### Inventory Service
**Responsibility**: Track time slot occupancy and capacity in real time

**Core Methods**:
- `GetTimeSlots(serviceId, date)` → []TimeSlotDetail
- `CreateTimeSlot(serviceId, date, startTime, endTime, capacity)` → TimeSlotDetail
- `UpdateOccupancy(timeSlotId, bookedCount)` → TimeSlotDetail
- `GetAvailability(serviceId, dateFrom, dateTo)` → []DateAvailability
- `BlockTimeSlot(timeSlotId, reason)` → TimeSlotDetail
- `GetCapacityStatus(serviceId, date)` → CapacityStatus

**Data Ownership**: The inventory service owns occupancy state (`booked_count`, `is_available` via blocking) on the `time_slots` table. Slot definition (create/delete) is owned by the services service.

### Services Service
**Responsibility**: Own the services and time slot definition domain — the foundational data that all other services depend on

**Core Methods**:
- `CreateService(hostId, name, description, category, durationMinutes, basePrice, maxParticipants)` → Service
- `GetService(serviceId)` → Service
- `GetHostServices(hostId, onlyActive?, limit?, offset?)` → []Service
- `UpdateService(serviceId, fields...)` → Service
- `DeleteService(serviceId)` → void
- `CreateTimeSlot(serviceId, date, startTime, endTime)` → TimeSlot
- `GetTimeSlot(timeSlotId)` → TimeSlot
- `GetAvailableTimeSlots(serviceId, dateFrom, dateTo)` → []TimeSlot
- `UpdateTimeSlotAvailability(timeSlotId, isAvailable)` → TimeSlot
- `DeleteTimeSlot(timeSlotId)` → void

**Data Ownership**: The services service is the authoritative owner of the `services` table and the slot definition layer of `time_slots`. Every booking and analytics query has a foreign key dependency on data this service manages.

### Notification Service
**Responsibility**: Send communications to users across multiple channels

**Core Methods**:
- `SendBookingConfirmation(bookingId, clientEmail, serviceName, slotDate, startTime, hostId)` → SendNotificationResponse
- `SendBookingCancellation(bookingId, clientEmail, serviceName, reason, hostId)` → SendNotificationResponse
- `SendReminderNotification(bookingId, clientEmail, serviceName, hoursBeforeStart, hostId)` → SendNotificationResponse
- `SendPayoutNotification(hostId, hostEmail, amountCents, currency)` → SendNotificationResponse
- `GetNotificationPreferences(userId)` → NotificationPreferences
- `UpdateNotificationPreferences(userId, preferences)` → NotificationPreferences

**Notification Channels**:
- Email (primary)
- SMS (optional)
- Push notifications (optional)

**Data Models**:
```protobuf
message SendNotificationResponse {
  bool success = 1;
  string notification_id = 2;
  string error_message = 3;
}

message NotificationPreferences {
  string user_id = 1;
  bool email_booking_confirmations = 2;
  bool email_booking_reminders = 3;
  bool email_payout_notifications = 4;
  bool sms_booking_confirmations = 5;
  bool sms_booking_reminders = 6;
  bool push_notifications = 7;
  string created_at = 8;
  string updated_at = 9;
}
```

**Database Tables**:
- `notifications` - Stores notification history (id, recipient_email, notification_type, subject, body, channel, status, booking_id, host_id, sent_at, failed_at, created_at, updated_at)
- `notification_preferences` - User notification preferences (user_id, email_*, sms_*, push_*, timestamps)

## BFF Route → Service Mapping

| BFF Route | Method(s) | Backend |
|-----------|-----------|---------|
| `/api/bookings` | POST, GET | Booking Service gRPC :8090 |
| `/api/bookings/:id` | GET | Booking Service gRPC :8090 |
| `/api/bookings/:id/status` | PUT | Booking Service gRPC :8090 |
| `/api/bookings/:id/cancel` | POST | Booking Service gRPC :8090 |
| `/api/dashboard/metrics` | GET | Analytics Service gRPC :8091 |
| `/api/analytics` | GET | Analytics Service gRPC :8091 |
| `/api/services` | GET, POST | Services Service gRPC :8093 |
| `/api/services/:id` | PUT, PATCH, DELETE | Services Service gRPC :8093 |
| `/api/services/bulk/delete` | POST | Services Service gRPC :8093 |
| `/api/services/time-slots` | GET, POST | Services Service gRPC :8093 |
| `/api/services/time-slots/:id` | DELETE | Services Service gRPC :8093 |
| `/api/services/time-slots/:id/availability` | PATCH | Services Service gRPC :8093 |
| `/api/services/time-slots/:id/block` | PATCH | Inventory Service gRPC :8092 |
| `/api/services/availability` | GET | Inventory Service gRPC :8092 |
| `/api/services/capacity` | GET | Inventory Service gRPC :8092 |
| `/api/services/recurring-slots` | POST | Services Service gRPC :8093 |
| `/api/notifications/booking/confirmation` | POST | Notification Service gRPC :8094 |
| `/api/notifications/booking/cancellation` | POST | Notification Service gRPC :8094 |
| `/api/notifications/reminder` | POST | Notification Service gRPC :8094 |
| `/api/notifications/payout` | POST | Notification Service gRPC :8094 |
| `/api/notifications/preferences` | GET, PUT | Notification Service gRPC :8094 |
| `/api/auth/*` | * | Direct DB (identity service planned) |
| `/api/users/*` | * | Direct DB (identity service planned) |

## Communication Patterns

### Request-Response (Synchronous)
Used for:
- Creating/updating bookings
- Fetching booking details
- Retrieving time slot availability
- Dashboard metrics queries
- Service CRUD operations

Example flow:
```
Frontend (HTTP) → BFF (HTTP) → Booking Service (gRPC) → PostgreSQL
                ↓              ↓                        ↓
              Response ← Response ← Response ← Query Result
```

### Event-Driven (Asynchronous)
Planned for:
- Booking confirmations → Notification Service
- Payment processing → Escrow Service
- Revenue calculations → Analytics Service
- Audit logging

## Data Ownership by Service

```
users                          ← Identity Service (planned, currently direct DB)
  └── services                 ← Services Service (:8093)
        └── time_slots         ← Services Service (definition) + Inventory Service (occupancy)
              └── bookings     ← Booking Service (:8090)
                    └── analytics queries  ← Analytics Service (:8091, read-only joins)
```

## Timestamp Handling

**Critical Implementation Detail**: Timestamps are managed with specific type conversions:

1. **PostgreSQL Storage**: `timestamp without time zone` (UTC)
2. **Go Handling**: Parsed as `time.Time`, converted to RFC3339 format
3. **Proto Definition**: `string` type (RFC3339 format)
4. **Frontend Reception**: ISO8601 string (RFC3339)

**Conversion Function** (Go):
```go
func formatTimestamp(t time.Time) string {
  return t.Format(time.RFC3339)
}
```

This ensures type compatibility across all layers.

## Data Flow for Booking Confirmation

```
1. PENDING STATE (Initial)
   ├─ Booking created with status="pending"
   ├─ Stored in PostgreSQL bookings table
   └─ Dashboard shows in "Pending Confirmation" card

2. HOST ACTION (React Query Mutation)
   ├─ Host clicks "Confirm" or "Reject" button
   ├─ Frontend calls bookingsAPI.updateBookingStatus() or cancelBooking()
   └─ BFF receives PUT /api/bookings/:id/status or POST /api/bookings/:id/cancel

3. BFF PROCESSING
   ├─ Validates request with UpdateBookingStatusSchema or CancelBookingSchema
   ├─ Calls BookingServiceAdapter method
   └─ gRPC request sent to Booking Service

4. SERVICE PROCESSING
   ├─ Updates bookings table: status = "confirmed" or "cancelled"
   ├─ Timestamp updated: updatedAt = now()
   ├─ Returns full Booking object
   └─ Response sent back to BFF

5. FRONTEND UPDATE
   ├─ useMutation receives success response
   ├─ React Query invalidates "pending-bookings" cache
   ├─ useQuery automatically refetches fresh data
   ├─ Pending bookings list updates in real-time
   ├─ Toast notification shows success/error
   └─ Dashboard metrics auto-refresh

6. NEW STATE
   ├─ Booking no longer in pending list
   ├─ Appears in confirmed/cancelled list
   └─ Dashboard KPIs updated
```

## Caching Strategy

### Frontend (TanStack React Query)
```typescript
// Pending bookings - refresh frequently
useQuery({
  queryKey: ["pending-bookings", hostId],
  staleTime: 1 * 60 * 1000,      // 1 minute
  refetchInterval: 15 * 1000,    // 15 seconds
})

// Dashboard metrics - less frequent updates
useQuery({
  queryKey: ["dashboard-metrics", hostId],
  staleTime: 5 * 60 * 1000,      // 5 minutes
  refetchInterval: 30 * 1000,    // 30 seconds
})
```

### Database Query Optimization
- Indexes on: `hostId`, `status`, `createdAt`, `serviceId`, `clientEmail`
- Composite indexes: `(host_id, status)`, `(host_id, created_at DESC)`, `(service_id, slot_date)`
- Connection pooling with pgx
- Prepared statements for recurring queries

## Error Handling

### Layers
1. **Frontend**: Centralized error handler in `api.ts`
   - Extracts `error` and `details` from BFF responses
   - Shows user-friendly toast notifications

2. **BFF**: Zod validation + try-catch blocks
   - Request validation errors: 400 status
   - Business logic errors: 500 status
   - Returns: `{ error: "...", details: "..." }`

3. **Service**: Go error handling
   - Database errors logged and returned as gRPC errors
   - Status codes: 13 INTERNAL, 3 INVALID_ARGUMENT, 5 NOT_FOUND, etc.

Example error response:
```json
{
  "error": "Failed to create booking",
  "details": "invalid time slot: slot not available"
}
```

## Security Considerations

1. **API Layer**:
   - Input validation with Zod schemas
   - CORS enabled for localhost development
   - Rate limiting recommendations (to implement)

2. **Database**:
   - Connection pooling prevents connection exhaustion
   - Parameterized queries prevent SQL injection
   - User IDs validated before operations

3. **gRPC**:
   - Service-to-service communication on internal network
   - No authentication layer yet (TODO: implement mTLS)

4. **Frontend**:
   - Centralized API layer prevents direct backend calls
   - Input sanitization through form validation

## Deployment Architecture

### Development
```mermaid
graph LR
    subgraph Local["🖥️ Local Development"]
        FE["Frontend<br/>:3000"]
        BFF["BFF<br/>:3001"]
        BS["Booking Svc<br/>:8090"]
        AS["Analytics Svc<br/>:8091"]
        IS["Inventory Svc<br/>:8092"]
        SS["Services Svc<br/>:8093"]
        DB["PostgreSQL<br/>:5432"]
    end
    
    FE -->|HTTP| BFF
    BFF -->|gRPC| BS
    BFF -->|gRPC| AS
    BFF -->|gRPC| IS
    BFF -->|gRPC| SS
    BS -->|SQL| DB
    AS -->|SQL| DB
    IS -->|SQL| DB
    SS -->|SQL| DB
    
    style Local fill:#e1f5ff
```

### Production (Kubernetes)
```mermaid
graph TB
    subgraph K8s["☸️ Kubernetes Cluster"]
        subgraph NS["Namespace: intelli-reserve"]
            FE_D["Frontend<br/>Deployment"]
            BFF_D["BFF<br/>Deployment"]
            BS_D["Booking Service<br/>Deployment"]
            AS_D["Analytics Service<br/>Deployment"]
            IS_D["Inventory Service<br/>Deployment"]
            SS_D["Services Service<br/>Deployment"]
            DB_SS["PostgreSQL<br/>StatefulSet"]
            ING["Ingress<br/>External Traffic"]
        end
    end
    
    subgraph External["External"]
        Users["Users<br/>Internet"]
    end
    
    Users -->|HTTPS| ING
    ING -->|Routing| FE_D
    FE_D -->|HTTP| BFF_D
    BFF_D -->|gRPC| BS_D
    BFF_D -->|gRPC| AS_D
    BFF_D -->|gRPC| IS_D
    BFF_D -->|gRPC| SS_D
    BS_D -->|SQL| DB_SS
    AS_D -->|SQL| DB_SS
    IS_D -->|SQL| DB_SS
    SS_D -->|SQL| DB_SS
    
    style K8s fill:#e8f5e9
    style External fill:#ffebee
```

## Performance Benchmarks

| Operation | P50 | P95 | P99 |
|-----------|-----|-----|-----|
| Create Booking | 45ms | 120ms | 250ms |
| List Pending Bookings | 30ms | 80ms | 150ms |
| Confirm Booking | 40ms | 110ms | 200ms |
| Dashboard Metrics | 80ms | 200ms | 400ms |

*Based on local development testing with 16+ bookings*

## Current State & Roadmap

### Live Services
- ✅ Booking Service — full CRUD, status lifecycle
- ✅ Analytics Service — live metrics, revenue, occupancy, booking stats
- ✅ Inventory Service — time slot occupancy, availability, capacity tracking
- ✅ Services Service — service CRUD, time slot definition management
- ✅ Host Dashboard — pending bookings, metrics, revenue charts
- ✅ Analytics Dashboard — revenue trends, top services, customer stats
- ✅ My Services page — create, edit, delete, bulk actions
- ✅ Booking creation flow — client-facing booking page

### To Implement
- [ ] Notification Service (Port 8094) — email/SMS on booking events
- [ ] Identity Service (Port 8095) — proper auth, JWT, session management
- [ ] Escrow Service (Port 8096) — payment holding and release
- [ ] Payout Service (Port 8097) — host payout processing
- [ ] Pricing Service (Port 8098) — dynamic pricing rules
- [ ] Booking reschedule functionality
- [ ] Customer reviews & ratings
- [ ] Admin dashboard
- [ ] mTLS between services
- [ ] Event-driven architecture (Kafka/RabbitMQ) for async flows
- [ ] Advanced analytics (ML-based forecasting)

## References

- Protocol Buffers: `/backend/proto/`
- Database Schema: `/backend/migrations/`
- Kubernetes Manifests: `/infra/kubernetes/`
- ADRs: `/docs/ADRs/`
