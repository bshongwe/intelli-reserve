# Offline Sync Architecture Diagrams

## 1. Request Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          User Makes Request                         │
│                      (e.g., Create Booking)                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ↓
                    ┌─────────────────┐
                    │  Axios Client   │
                    │  POST /api/...  │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                ✅ SUCCESS        ❌ FAILURE
                    │                 │
                    ↓                 ↓
          ┌─────────────────┐  ┌────────────────────┐
          │ Response OK     │  │ Error Handler      │
          │ (200-300)       │  │ (axios interceptor)│
          └────────┬────────┘  └────────┬───────────┘
                   │                    │
                   ↓                    ↓
              Update State         Network?
                   │                │   │
                   ↓            YES │   │ NO
              Notify User           │   ↓
                   │                │  4xx?
                   │                │   │
                   │            YES │   │ NO
                   │                │   ↓
                   │                │  5xx or
                   │                │  Network?
                   │                │   │
                   │            YES │   │ NO
                   │                │   │
                   ↓                │   ↓
              ┌─────────────┐       │  Reject
              │   Done ✅   │       │  Error
              └─────────────┘       │
                                    ↓
                            ┌──────────────────┐
                            │ Add to Queue     │
                            │ (IndexedDB)      │
                            └────────┬─────────┘
                                     │
                                     ↓
                            ┌──────────────────┐
                            │ Return 202       │
                            │ Accepted         │
                            └────────┬─────────┘
                                     │
                                     ↓
                            ┌──────────────────┐
                            │ Show Toast:      │
                            │ "Request Queued" │
                            │ "Will send when" │
                            │ "online"         │
                            └────────┬─────────┘
                                     │
                                     ↓
                            ┌──────────────────┐
                            │ User Can Keep    │
                            │ Working (no UX   │
                            │ blocking)        │
                            └──────────────────┘
```

## 2. Offline Queue Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                    QUEUE ITEM LIFECYCLE                             │
└─────────────────────────────────────────────────────────────────────┘

                          Created
                            │
                    ┌───────┴────────┐
                    │                │
              ┌─────▼─────┐      ┌───▼──────────┐
              │  PENDING  │      │  QUEUED      │
              │           │      │  in IndexedDB│
              │ Waiting   │      │ Timestamp    │
              │ for sync  │      │ recorded     │
              └─────┬─────┘      └──────────────┘
                    │
          ┌─────────┴──────────┐
          │                    │
    User Online           Manual Retry
    or Auto Sync          or Timeout
          │                    │
          └─────────┬──────────┘
                    │
              ┌─────▼──────┐
              │ RETRYING   │
              │            │
              │ Attempt 1  │
              │ of 3       │
              └─────┬──────┘
                    │
         ┌──────────┴──────────┐
         │                     │
      SUCCESS              FAILURE
         │                     │
    ┌────▼────┐          ┌─────▼──────┐
    │  SYNCED  │          │ Attempt 2? │
    │          │          │            │
    │ Removed  │          │ if count<3 │
    │ from     │          │ retry      │
    │ queue    │          │ else mark  │
    │ DB clean │          │ FAILED     │
    └──────────┘          └─────┬──────┘
                                │
                    ┌───────────┴────────┐
                    │                    │
                ┌───▼────────┐      ┌────▼────┐
                │  RETRY 2   │      │ FAILED  │
                │  of 3      │      │         │
                └───┬────────┘      │ Manual  │
                    │               │ delete  │
         ┌──────────┴──────────┐    │ or      │
         │                     │    │ View in │
      SUCCESS              FAILURE  │ Stats   │
         │                     │    └────┬────┘
    ┌────▼────┐          ┌─────▼──────┐ │
    │  SYNCED  │          │ Attempt 3? │ │
    │ Remove   │          │            │ │
    └──────────┘          │ if count<3 │ │
                          │ retry      │ │
                          │ else mark  │ │
                          │ FAILED     │ │
                          └─────┬──────┘ │
                                │        │
                    ┌───────────┴─┐   ┌──▼───┐
                    │             │   │      │
                ┌───▼────────┐ ┌──┴───▼─┐  │
                │  RETRY 3   │ │ FAILED │◄─┘
                │  of 3      │ │        │
                └───┬────────┘ │ Shown  │
                    │          │ in UI  │
         ┌──────────┴──────────┐ │
         │                     │ │
      SUCCESS              FAILURE
         │                     │
    ┌────▼────┐          ┌─────▼──────┐
    │  SYNCED  │          │ FAILED     │
    │ Remove   │          │ (Final)    │
    │ Database │          │            │
    │ Clean ✅ │          │ User can   │
    └──────────┘          │ clear or   │
                          │ retry      │
                          │ manually   │
                          └────────────┘
```

## 3. Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ROOT LAYOUT                                  │
│                   (App Router or Pages)                             │
└─────────────────────────────────────────────────────────────────────┘
         │
         ├─► useEffect(() => {
         │       initSyncManager(apiClient)
         │       setupOfflineInterceptor(apiClient)
         │   }, [])
         │
         ├─► useSyncOnline()
         │
         └─► <OfflineIndicator />
               │
               └─► Shows floating badge at bottom-right
                   - Offline (orange)
                   - Syncing... (blue)
                   - Synced! (green)
                   - Sync Failed (red)
                   - Retrying... (yellow)

                        USER PAGES
                            │
                            └─► <SyncQueueStatus />
                                (Optional, on settings page)
                                │
                                ├─ Shows queue count
                                ├─ Breakdown by status
                                ├─ Recent events
                                ├─ Manual Retry button
                                └─ Clear Failed button
```

## 4. Service Integration

```
┌──────────────────────────────────────────────────────────────────────┐
│                     OFFLINE SYNC SYSTEM                              │
└──────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────┐
    │        AXIOS INSTANCE (apiClient)           │
    │  - Configured with base URL                 │
    │  - Timeout: 10 seconds                      │
    │  - Default headers                          │
    └────────────────┬──────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
    ┌─────▼──────┐      ┌──────▼───────┐
    │ Requests   │      │ setupOffline
    │            │      │ Interceptor()
    │ Hit        │      │
    │ server     │      │ Installs error
    │            │      │ interceptor
    │            │      │
    └──────┬─────┘      └──────┬───────┘
           │                   │
           │        ┌──────────┘
           │        │
        Success    ┌─▼──────────────────┐
           │       │ Check Error Type   │
           │       │ - Network error?   │
           │       │ - 5xx server?      │
           │       │ - 4xx client?      │
           │       │ - Timeout?         │
           │       └──────┬─────────────┘
           │              │
           │       ┌──────┴──────┐
           │       │             │
           │    YES(retryable)  NO(reject)
           │       │             │
           │    ┌──▼─────────────┐
           │    │ Check Method   │
           │    │ POST/PUT/PATCH │
           │    │ DELETE? (not   │
           │    │ GET)           │
           │    └──┬────────────┘
           │       │
           │    YES(retryable)
           │       │
           │    ┌──▼───────────────────────┐
           │    │ syncManager.queue        │
           │    │ Request()                │
           │    │ - Generate requestId     │
           │    │ - Store in IndexedDB     │
           │    │ - Dispatch 'queued'event │
           │    └──┬─────────────────────┘
           │       │
           │    ┌──▼───────────────────┐
           │    │ Return 202 Accepted  │
           │    │ (not error to app)    │
           │    └──────────────────────┘
           │
    ┌──────┴──────────────┐
    │                     │
 Update UI           ┌────▼──────────────┐
 Show data           │ USER EVENT:       │
 or Toast            │ Connection        │
                     │ Restored          │
                     └────┬───────────────┘
                          │
                     ┌────▼──────────────┐
                     │ useSyncOnline()   │
                     │ Detects online    │
                     │ event             │
                     └────┬───────────────┘
                          │
                     ┌────▼──────────────────┐
                     │ syncManager.sync      │
                     │ OfflineQueue()        │
                     │ - Get all pending     │
                     │ - Retry each (max 3)  │
                     │ - Update statuses     │
                     │ - Dispatch events     │
                     └────┬─────────────────┘
                          │
           ┌──────────────┴──────────────┐
           │                             │
        SUCCESS                      FAILURE
           │                             │
    ┌──────▼────┐              ┌───────▼──────┐
    │ Remove    │              │ Mark FAILED  │
    │ from      │              │ in IndexedDB │
    │ queue     │              │              │
    │ Clean DB  │              │ Show UI      │
    │ Notify UI │              │ Notify user  │
    └───────────┘              └──────────────┘
```

## 5. Database Schema (IndexedDB)

```
┌──────────────────────────────────────────────────────────┐
│                    OFFLINE-DB (Dexie)                     │
└──────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
          ┌─────▼────────────┐   ┌──────▼───────────┐
          │ QueuedRequests   │   │ Other tables     │
          │ Table            │   │ (future use)     │
          └────┬─────────────┘   └──────────────────┘
               │
          ┌────┴──────────────────────────────────┐
          │                                       │
    ┌─────▼──────────────┐        ┌──────────────▼────┐
    │ Primary Key: id    │        │ Indexed Fields:    │
    │ (auto-increment)   │        │ - status           │
    └─────────────────┬──┘        │ - endpoint         │
                      │           │ - timestamp        │
                      │           └──────────────────┬─┘
                      │                              │
                      │           ┌──────────────────┘
                      │           │
    ┌─────────────────┴───────────▼──────────────┐
    │                                            │
    │  Fields in each QueuedRequest:             │
    │  - id: number (primary key)                │
    │  - requestId: string (unique)              │
    │  - endpoint: string                        │
    │  - method: 'POST'|'PUT'|'PATCH'|'DELETE'   │
    │  - payload: any (serialized JSON)          │
    │  - headers?: Record<string, string>        │
    │  - timestamp: number (when queued)         │
    │  - retryCount: number (current attempt)    │
    │  - maxRetries: number (max attempts: 3)    │
    │  - lastError?: string (error message)      │
    │  - status: status type (see below)         │
    │  - createdAt: Date (creation time)         │
    │  - updatedAt: Date (last update time)      │
    │                                            │
    │  Status Types:                             │
    │  - 'pending': Waiting for sync             │
    │  - 'retrying': Currently retrying          │
    │  - 'synced': Successfully synced           │
    │  - 'failed': Failed after 3 retries        │
    │                                            │
    └────────────────────────────────────────────┘
```

## 6. Event Flow

```
                          USER ACTION
                      (e.g., Submit Form)
                              │
                    ┌─────────┴──────────┐
                    │                    │
              ONLINE              OFFLINE
                    │                    │
            ┌───────▼───┐       ┌────────▼────┐
            │ API Call  │       │ API Call    │
            │ Success   │       │ Fails       │
            └───────┬───┘       │ (Network)   │
                    │           └────────┬────┘
                    │                    │
            ┌───────▼────────┐   ┌───────▼────────┐
            │ Update DB      │   │ offlineQueue   │
            │ Notify User    │   │ Dispatch       │
            │ (normal UX)    │   │ 'offline:sync' │
            │                │   │ event          │
            └────────────────┘   │ (type: queued) │
                                 │                │
                                 └────────┬───────┘
                                          │
                            ┌─────────────┴────────────┐
                            │                          │
                      USER GOES ONLINE            WAIT IN QUEUE
                      or Page Reloads                 │
                            │                         │
                       ┌────┴──────┐                   │
                       │            │                   │
                    ┌──▼───┐  ┌────▼──────┐             │
                    │Online│  │Has pending│             │
                    │event │  │items?     │             │
                    └──┬───┘  └────┬──────┘             │
                       │           │                    │
                       │          YES                   │
                       │           │                    │
                       └────┬──────┤                    │
                            │      │                    │
                    ┌───────▼──────▼─────┐              │
                    │useSyncOnline hook  │              │
                    │Calls:              │              │
                    │syncOfflineQueue()  │              │
                    └───────┬────────────┘              │
                            │                           │
                   ┌────────┴─────────┐                 │
                   │                  │                 │
              ┌────▼──────┐    ┌──────▼────┐           │
              │Start sync │    │Manual      │           │
              │event      │    │retry       │           │
              │'start'    │    │(button)    │           │
              └────┬──────┘    └──────┬─────┘           │
                   │                 │                  │
                   │  ┌──────────────┤                  │
                   │  │              │                  │
         ┌─────────▼──▼─────────┐    │                  │
         │Iterate all pending   │    │                  │
         │requests              │    │                  │
         │Retry each with       │    │                  │
         │10s timeout, max 3x   │    │                  │
         └────────┬┬────────────┘    │                  │
                  ││                 │                  │
            SUCCESS││FAILURE         │                  │
               │   ││    │           │                  │
         ┌─────▼────▼────▼────┐      │                  │
         │Dispatch            │      │                  │
         │'offline:sync' event│      │                  │
         │- type: 'success'   │      │                  │
         │- type: 'failed'    │      │                  │
         │- type: 'retry'     │      │                  │
         │- type: 'complete'  │      │                  │
         └────┬───────────────┘      │                  │
              │                      │                  │
      ┌───────┴────────────┬─────────┤                  │
      │                    │         │                  │
   ┌──▼───┐       ┌────────▼──┐  ┌──▼───────┐          │
   │Remove│       │Mark       │  │UI Updates│          │
   │from  │       │FAILED     │  │- Remove  │          │
   │queue │       │in DB      │  │- Notify  │          │
   │Clean │       │- Show to  │  │- Show    │          │
   │✅    │       │  User     │  │  toast   │          │
   └──────┘       └───────────┘  └──────────┘          │
                                                        │
                                  User can:
                                  - Manual retry
                                  - Clear failed
                                  - View stats
```

## 7. Hook Dependencies

```
┌─────────────────────────────────────────────────┐
│         HOOK INITIALIZATION ORDER               │
└─────────────────────────────────────────────────┘

1. useEffect (in layout)
   └─► initSyncManager(apiClient)
   └─► setupOfflineInterceptor(apiClient)

2. useSyncOnline() hook
   └─► useOnlineEvent() (internal)
       └─► Listens for 'app:online' event
       └─► Calls syncManager.syncOfflineQueue()

3. useConnectionStatus() hook
   └─► Listens for 'online' and 'offline' events
   └─► Dispatches 'app:online' and 'app:offline'
   └─► Used by OfflineIndicator

4. useSyncProgress() hook
   └─► Listens for 'offline:sync' events
   └─► Maintains event history
   └─► Used by OfflineIndicator & SyncQueueStatus

5. <OfflineIndicator /> component
   └─► useConnectionStatus() for online/offline
   └─► useSyncProgress() for queue status
   └─► Renders floating indicator

6. <SyncQueueStatus /> component (optional)
   └─► useSyncProgress() for event history
   └─► Calls getSyncManager() for queue stats
   └─► Render manual controls
```

## 8. Error Handling Flow

```
┌─────────────────────────────────────────────────┐
│           ERROR HANDLING DECISION TREE           │
└─────────────────────────────────────────────────┘

                    API Request Made
                            │
                    Response or Error
                            │
                   ┌────────┴────────┐
                   │                 │
            Error Response?       Success
                   │                 │
                  YES                │
                   │         ┌───────▼──────┐
            ┌──────▼─────┐   │ Return data  │
            │ Error type │   │ Update UI    │
            └──────┬─────┘   └──────────────┘
                   │
         ┌─────────┼────────────┐
         │         │            │
      4xx Error  5xx Error  Network Error
      (client)   (server)   (no response)
         │         │            │
        NO        YES           YES
       Queue      Queue        Queue
         │         │            │
      Reject   (retryable)  (retryable)
      Error        │             │
                   │             │
                ┌──┴─────────────┘
                │
        Is method GET?
         │       │
        YES     NO
         │       │
       Reject  Queue
       Error    Request
                 │
        ┌────────▼──────────┐
        │Add to IndexedDB   │
        │- Generate ID      │
        │- Set status       │
        │  'pending'        │
        │- Record timestamp │
        │- Store payload    │
        │- Set retryCount=0 │
        │- Set maxRetries=3 │
        └────┬──────────────┘
             │
        ┌────▼───────────────┐
        │Dispatch 'offline:  │
        │sync' event         │
        │- type: 'queued'    │
        │- data: requestId   │
        │- timestamp         │
        └────┬───────────────┘
             │
        ┌────▼───────────────┐
        │Return 202 Accepted │
        │(Don't throw error) │
        └────┬───────────────┘
             │
        ┌────▼───────────────┐
        │User can keep       │
        │working (UI doesn't │
        │show error)         │
        └────────────────────┘
```

---

## Summary

These diagrams show:

1. **Request Flow**: How requests are processed and queued
2. **Queue Lifecycle**: How items move through different states
3. **Component Architecture**: How components work together
4. **Service Integration**: How Axios integrates with the system
5. **Database Schema**: IndexedDB structure
6. **Event Flow**: How events trigger sync operations
7. **Hook Dependencies**: Initialization order
8. **Error Handling**: Decision tree for queueing

For implementation details, see `OFFLINE_SYNC_GUIDE.md`.
