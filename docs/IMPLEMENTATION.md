# Implementation Details

This document provides technical deep-dives into how key features are implemented.

## Offline-First Synchronization

### Architecture Overview

The offline sync system allows the frontend to queue failed requests and automatically retry them when the connection is restored, providing a seamless experience even with intermittent connectivity.

**Components**:
1. **OfflineDb** (`frontend/src/db/offlineDb.ts`) - IndexedDB wrapper using Dexie
2. **SyncManager** (`frontend/src/services/syncManager.ts`) - Orchestrates retry logic
3. **React Hooks** - UI integration (`useSyncProgress`, `useSyncOnline`)

### Data Flow

```
┌─ Request Fails (5xx or Network Error)
│
├─ Not Queued Yet
│  └─ Add to IndexedDB with status='pending'
│     └─ Dispatch 'queued' event
│
└─ User/Connection Status Changes
   └─ If Online: Trigger sync
      └─ For each pending request:
         ├─ Attempt 1: Send request (1s)
         ├─ Attempt 2: Send request (2s)
         ├─ Attempt 3: Send request (4s)
         ├─ Success: Remove from queue, emit 'success'
         └─ Failed: Update status to 'failed', emit 'failed'
```

### Queue Schema

**IndexedDB Table**: `queue` (primary key: `++id`)

```typescript
{
  id?: number;                                      // Auto-increment primary key
  requestId: string;                               // Unique request identifier
  endpoint: string;                                // API endpoint (e.g., "/api/bookings")
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';   // HTTP method
  payload: any;                                    // Request body
  headers?: Record<string, string>;                // Optional custom headers
  timestamp: number;                               // When queued (milliseconds)
  retryCount: number;                              // Current retry attempt (0-indexed)
  maxRetries: number;                              // Maximum allowed retries (default: 3)
  lastError?: string;                              // Last error message
  status: 'pending' | 'retrying' | 'synced' | 'failed';
  createdAt: Date;                                 // Queue creation time
  updatedAt: Date;                                 // Last status change
}
```

### Retry Logic

**Exponential Backoff**:
- Attempt 1: Immediately
- Attempt 2: After 1 second
- Attempt 3: After 2 seconds (1 + 1)
- Attempt 4: After 4 seconds (2 + 2)
- After max retries: Mark as failed

**Retryable Errors**:
- 5xx server errors (500, 502, 503, etc.)
- Network timeouts (timeout > 10 seconds)
- Connection refused
- DNS resolution failures

**Non-Retryable Errors**:
- 4xx client errors (400, 401, 403, 404, etc.) - indicates bad data
- 429 rate limiting - should be handled with different strategy

### Key Operations

**Adding a Request**:
```typescript
await offlineDb.addRequest({
  requestId: 'uuid',
  endpoint: '/api/bookings',
  method: 'POST',
  payload: { serviceId, timeSlotId, ... },
  timestamp: Date.now(),
  retryCount: 0,
  maxRetries: 3,
  status: 'pending',
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

**Updating Status**:
```typescript
// Uses .where().modify() for Dexie compatibility
await offlineDb.updateStatus(requestId, 'retrying', errorMessage);
```

**Incrementing Retry Count**:
```typescript
// Returns new count synchronously
const newCount = await offlineDb.incrementRetry(requestId);
// Only used when retrying, not when updating status
```

**Syncing the Queue**:
```typescript
await syncManager.syncOfflineQueue();
// 1. Fetches all pending/retrying requests
// 2. For each: attempts retry with exponential backoff
// 3. Updates status and emits events
// 4. Emits 'complete' event when done
```

### Event System

**Custom Events** dispatched to `window`:

```javascript
// When sync starts
dispatchEvent(new CustomEvent('offline:sync', {
  detail: { type: 'start', data: { timestamp } }
}));

// When request synced successfully
dispatchEvent(new CustomEvent('offline:sync', {
  detail: { type: 'success', data: { requestId, status, statusText } }
}));

// When request fails
dispatchEvent(new CustomEvent('offline:sync', {
  detail: { type: 'failed', data: { requestId, error } }
}));

// When sync completes
dispatchEvent(new CustomEvent('offline:sync', {
  detail: { type: 'complete', data: { syncedCount, timestamp, error } }
}));
```

### React Integration

**useSyncProgress Hook**:
- Listens to `offline:sync` events
- Tracks queue count and sync state
- Exposes `{ queueCount, isOnline, lastSyncAt, isSyncing }`

**useSyncOnline Hook**:
- Detects online/offline state transitions
- Auto-triggers sync when connection restored
- Wrapped in `useCallback` to prevent listener churn

### SSR Safety

The offline system is server-side rendering safe:
- Dexie initialized lazily only in browser
- Browser guard prevents IndexedDB access during SSR
- Event listeners only added on client
- No hydration mismatches

## Payment Status Check

### Architecture

The payment status check allows the frontend to query whether a booking has a released escrow hold (payment confirmed).

**Flow**:
1. Frontend queries `GetHoldsByBookingId(bookingId)` via gRPC
2. Escrow Service looks up all holds for that booking
3. Frontend checks if any hold has status='released'
4. UI shows "Paid" badge or "Pay Now" button accordingly

### gRPC Method

**Proto Definition** (`backend/proto/escrow.proto`):
```protobuf
service EscrowService {
  rpc GetHoldsByBookingId(GetHoldsByBookingIdRequest) 
    returns (GetHoldsByBookingIdResponse);
}

message GetHoldsByBookingIdRequest {
  string booking_id = 1;
}

message GetHoldsByBookingIdResponse {
  bool success = 1;
  repeated Hold holds = 2;
  string error_message = 3;
}
```

### Backend Implementation

**Escrow Service Handler** (`backend/escrow-service/grpc_handlers.go`):
```go
func (s *EscrowService) GetHoldsByBookingId(
  ctx context.Context, 
  req *pb.GetHoldsByBookingIdRequest,
) (*pb.GetHoldsByBookingIdResponse, error) {
  // Query escrow_holds table where booking_id = ?
  rows, err := s.db.Query(ctx,
    `SELECT id, booking_id, status, ... 
     FROM escrow_holds 
     WHERE booking_id = $1 
     ORDER BY created_at DESC`,
    req.BookingId,
  )
  
  // Parse results into Hold messages
  var holds []*pb.Hold
  for rows.Next() {
    var hold pb.Hold
    // Scan row into hold
    holds = append(holds, &hold)
  }
  
  return &pb.GetHoldsByBookingIdResponse{
    Success: true,
    Holds: holds,
  }, nil
}
```

### BFF Integration

**Adapter** (`bff/src/grpc/adapters.ts`):
```typescript
async getHoldsByBookingId(bookingId: string) {
  return await escrowService.getHoldsByBookingId({
    bookingId,
  });
}
```

**Route** (`bff/src/routes/escrow.routes.ts`):
```typescript
router.get('/bookings/:bookingId/holds', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const response = await EscrowServiceAdapter.getHoldsByBookingId(bookingId);
    
    res.json({
      holds: response.holds || [],
      success: response.success,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Frontend API Layer

**API Method** (`frontend/src/lib/escrow-api.ts`):
```typescript
export async function getHoldsByBookingId(bookingId: string): Promise<Hold[]> {
  const response = await fetch(`/api/escrow/bookings/${bookingId}/holds`);
  if (!response.ok) {
    throw new Error(`Failed to fetch holds: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.holds || [];
}
```

### UI Usage

**Payment Status Hook** (`frontend/src/hooks/usePaymentStatus.ts`):
```typescript
export async function checkPaymentStatus(bookingId: string): Promise<PaymentStatus> {
  const holds = await getHoldsByBookingId(bookingId);
  
  // Check if any hold is 'released' (payment confirmed)
  const releasedHold = holds.find(hold => hold.status === 'released');
  
  return {
    isPaid: !!releasedHold,
    holdId: releasedHold?.id,
    holdStatus: releasedHold?.status,
  };
}
```

**Component Usage**:
```typescript
const { isPaid } = await checkPaymentStatus(bookingId);

{isPaid ? (
  <Badge variant="success">✓ Paid</Badge>
) : (
  <Button onClick={proceedToPayment}>💳 Pay Now</Button>
)}
```

## Error Message Constants (DRY Principle)

### Rationale

To eliminate duplicated string literals and improve maintainability, all error messages are defined as module-level constants. This provides:
- Single point of change
- Linter-detected duplicates
- Type safety in statically-typed languages
- Consistent messaging

### Implementation Pattern

**Services Service** (`backend/services-service/grpc_handlers.go`):
```go
const (
  errServiceIDRequired   = "service_id is required"
  errServiceNotFound     = "service not found"
  errTimeSlotIDRequired  = "time_slot_id is required"
  errTimeSlotNotFound    = "time slot not found"
)

// Usage
if req.ServiceId == "" {
  return &pb.GetServiceResponse{
    Success: false, 
    ErrorMessage: errServiceIDRequired
  }, status.Error(codes.InvalidArgument, errServiceIDRequired)
}
```

**Inventory Service** (`backend/inventory-service/`):
```go
// grpc_handlers.go
const (
  errTimeSlotNotFound = "Time slot not found"
)

// internal/repo/repository.go
const (
  errServiceNotFound   = "service not found"
  errTimeSlotNotFound  = "time slot not found"
)
```

**BFF Routes** (`bff/src/routes/escrow.routes.ts`):
```typescript
const MSG_VALIDATION_FAILED = 'Validation failed';
const MSG_HOLD_CREATED = 'Escrow hold created successfully';
const MSG_ERROR_CREATING_HOLD = 'Failed to create escrow hold';

// Usage
if (error.name === 'ZodError') {
  res.status(400).json({ 
    error: MSG_VALIDATION_FAILED, 
    details: error.errors 
  });
}
```

## Timestamp Handling

Timestamps are critical for consistency across layers. Here's how they're managed:

### Storage Layer (PostgreSQL)
- Type: `timestamp without time zone`
- Timezone: UTC (explicitly ensured by Go services)
- Range: 1-9999 AD

### Service Layer (Go)
```go
// Parse from database
var createdAt time.Time
row.Scan(&createdAt)  // Scans into time.Time in UTC

// Convert for wire format
func formatTimestamp(t time.Time) string {
  return t.Format(time.RFC3339)  // E.g., "2026-04-18T15:30:45Z"
}

// Response
return &pb.BookingResponse{
  CreatedAt: formatTimestamp(createdAt),  // RFC3339 string
  UpdatedAt: formatTimestamp(updatedAt),
}
```

### Wire Format (gRPC/Protobuf)
```protobuf
message Booking {
  string created_at = 1;  // RFC3339 string format
  string updated_at = 2;  // RFC3339 string format
}
```

### Frontend (TypeScript)
```typescript
interface Booking {
  createdAt: string;  // RFC3339 from backend
  updatedAt: string;  // RFC3339 from backend
}

// Parsing for display
const date = new Date(booking.createdAt);  // ISO8601 parsing
const formatted = date.toLocaleDateString();
```

### Key Points
1. **Always UTC**: Services explicitly set timezone to UTC
2. **RFC3339 Format**: Wire format is always RFC3339 for JSON compatibility
3. **Client Parsing**: Browsers parse RFC3339 as ISO8601
4. **No Conversion**: Avoid timezone conversion; keep UTC throughout

## Database Query Optimization

### Indexes

**Performance-Critical Indexes**:
```sql
CREATE INDEX idx_bookings_host_id ON bookings(host_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_host_status ON bookings(host_id, status);
CREATE INDEX idx_bookings_created_desc ON bookings(created_at DESC);

CREATE INDEX idx_time_slots_service_id ON time_slots(service_id);
CREATE INDEX idx_time_slots_service_date ON time_slots(service_id, slot_date);

CREATE INDEX idx_escrow_holds_booking_id ON escrow_holds(booking_id);
CREATE INDEX idx_escrow_holds_host_status ON escrow_holds(host_id, status);
```

### Connection Pooling

**pgx Configuration** (Go services):
```go
poolConfig := pgxpool.Config{
  MaxConns:          25,     // Maximum pool size
  MinConns:          5,      // Minimum idle connections
  MaxConnLifetime:   15 * time.Minute,
  MaxConnIdleTime:   5 * time.Minute,
  HealthCheckPeriod: 1 * time.Minute,
}

pool, err := pgxpool.NewWithConfig(ctx, &poolConfig)
```

### Query Patterns

**Pending Bookings** (frequently executed):
```sql
SELECT id, service_id, time_slot_id, host_id, client_name, 
       client_email, status, created_at, updated_at
FROM bookings
WHERE host_id = $1 AND status = 'pending'
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
```
- Uses index: `(host_id, status)`
- Fast range scan for host's pending bookings

**Dashboard Metrics** (aggregation):
```sql
SELECT 
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN status='confirmed' THEN 1 END) as confirmed,
  COUNT(CASE WHEN status='completed' THEN 1 END) as completed,
  COALESCE(SUM(CASE WHEN status='completed' THEN gross_amount_cents ELSE 0 END), 0) as total_revenue
FROM bookings
WHERE host_id = $1;
```
- Single table scan with aggregation
- No indexes needed; streaming aggregation efficient

## gRPC Communication

### Service Discovery

**Port Registry**:
| Service | gRPC Port |
|---------|-----------|
| Booking | 8090 |
| Analytics | 8091 |
| Inventory | 8092 |
| Services | 8093 |
| Notification | 8094 |
| Identity | 8095 |
| Escrow | 8096 |

### Request Flow

```
Client (HTTP)
  ↓
BFF (Express)
  ├─ Parse HTTP request
  ├─ Validate with Zod
  ├─ Transform to gRPC message
  ├─ Call service via gRPC
  ├─ Receive gRPC response
  ├─ Transform to JSON
  └─ Return HTTP response
  ↓
Service (Go)
  ├─ Receive gRPC message
  ├─ Validate inputs
  ├─ Execute business logic
  ├─ Query PostgreSQL
  ├─ Build response message
  └─ Return gRPC response
```

### Error Handling

**gRPC Status Codes**:
```
OK            = 0  // Success
Cancelled     = 1  // Cancelled by client
Unknown       = 2  // Unknown error
InvalidArg    = 3  // Validation failed
DeadlineEx    = 4  // Timeout
NotFound      = 5  // Resource not found
AlreadyExists = 6  // Already exists
PermissionDenied = 7  // Authorization failed
Internal      = 13 // Server error
```

**BFF Mapping** (current implementation):
```typescript
try {
  const response = await grpcCall();
  return httpResponse(response);
} catch (error) {
  // Currently: all gRPC errors → HTTP 500
  // TODO: Map gRPC codes to HTTP codes:
  // - 3 (InvalidArg) → 400
  // - 5 (NotFound) → 404
  // - 7 (PermissionDenied) → 403
  return httpError(500, error.message);
}
```

**TODO**: Implement proper error code mapping for better frontend error handling.

## Frontend State Management

### React Query Configuration

**Pending Bookings**:
```typescript
useQuery({
  queryKey: ['pending-bookings', hostId],
  queryFn: () => bookingsAPI.getPendingBookings(hostId),
  staleTime: 1 * 60 * 1000,      // 1 minute
  refetchInterval: 15 * 1000,    // 15 seconds
  // Aggressive refresh for time-sensitive operations
});
```

**Dashboard Metrics**:
```typescript
useQuery({
  queryKey: ['dashboard-metrics', hostId],
  queryFn: () => analyticsAPI.getDashboardMetrics(hostId),
  staleTime: 5 * 60 * 1000,      // 5 minutes
  refetchInterval: 30 * 1000,    // 30 seconds
  // Less frequent for slow-changing metrics
});
```

### Cache Invalidation

**On Booking Confirmation**:
```typescript
const confirmMutation = useMutation({
  mutationFn: (bookingId) => bookingsAPI.confirmBooking(bookingId),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['pending-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    // useQuery automatically refetches with new data
  }
});
```

## Security

### Input Validation

**BFF Layer** (Zod schemas):
```typescript
const CreateBookingSchema = z.object({
  serviceId: z.string().uuid(),
  timeSlotId: z.string().uuid(),
  hostId: z.string().min(1),
  clientName: z.string().min(1).max(255),
  clientEmail: z.string().email(),
  numberOfParticipants: z.number().int().min(1),
});
```

**Service Layer** (Go):
```go
if req.ServiceId == "" {
  return nil, status.Error(codes.InvalidArgument, "service_id is required")
}
```

### Query Injection Prevention

**Parameterized Queries** (Go with pgx):
```go
// ✅ Safe: Uses $1, $2 placeholders
err := db.QueryRow(ctx,
  "SELECT * FROM bookings WHERE id = $1 AND host_id = $2",
  bookingID, hostID,
).Scan(...)

// ❌ Unsafe: String concatenation
query := fmt.Sprintf("SELECT * FROM bookings WHERE id = '%s'", bookingID)
```

### Authentication

**JWT Tokens**:
- Issued by Identity Service on login
- Contains: user ID, email, role
- Expiry: 1 hour
- Stored in: HTTP-only cookies or localStorage
- Included in: Authorization header for gRPC calls (TODO)

## Known Limitations & Future Work

### Current Limitations
- No soft deletes (hard deletes remove data permanently)
- No refresh tokens (users re-login hourly)
- No email verification (any email accepted)
- No mTLS between services (internal communication unencrypted)
- gRPC errors not mapped to HTTP codes (all errors are 500)
- Single database for all services (not fully isolated)

### Planned Improvements
- Event-driven architecture (Kafka/RabbitMQ)
- Soft deletes with audit trails
- Refresh token support
- Email verification flow
- mTLS service-to-service
- Error code mapping middleware
- Admin dashboard
- Multi-language support
- Mobile native apps
- Advanced analytics with ML
