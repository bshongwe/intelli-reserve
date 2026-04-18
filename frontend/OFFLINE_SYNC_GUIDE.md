# Offline Sync Integration Guide

## Overview

The offline sync feature automatically queues API requests when the user is offline and retries them when the connection is restored. This guide shows how to integrate it into your Next.js application.

## Architecture

```
┌─────────────────────────────────┐
│   User Action (e.g., Booking)   │
└────────────┬────────────────────┘
             ↓
    ┌────────────────────┐
    │ API Request via    │
    │ axios             │
    └────┬───────────────┘
         ↓
   ┌──────────────┐
   │ Connection?  │
   └──┬────────┬──┘
      │        │
    YES       NO
      │        │
      ↓        ↓
   Success  ┌──────────────────────┐
      ↓     │ Queue Request in      │
      ↓     │ IndexedDB via Dexie   │
      ↓     │                      │
      ↓     │ Show "Queued" Toast   │
      ↓     └──────────┬───────────┘
      │                ↓
      │         Return 202 Accepted
      │                ↓
      │          User Can Proceed
      │
      ├─────────────────┐
      │                 ↓
   Update DB      User Reconnects
      │                 ↓
      │         useSyncOnline detects
      │         connection & queued items
      │                 ↓
      │         syncManager.syncOfflineQueue()
      │                 ↓
      │         Retry all pending
      │         (max 3 attempts each)
      │                 ↓
      │         Update DB, notify UI
      ↓                 ↓
   Notification   Notification
   Success        Success
```

## Installation

### 1. Install Dependencies

```bash
cd frontend
npm install
```

This installs the required packages:
- `dexie@^3.2.4` - IndexedDB wrapper
- `axios-retry@^2.3.6` - Retry mechanisms

### 2. Initialize in App Root

Add initialization code to your app entry point (e.g., `src/app/layout.tsx` or `src/pages/_app.tsx`):

#### Next.js App Router (src/app/layout.tsx)

```typescript
'use client';

import { useEffect } from 'react';
import { initSyncManager } from '@/services/syncManager';
import { setupOfflineInterceptor } from '@/lib/offlineInterceptor';
import { useSyncOnline } from '@/hooks/useSyncOnline';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { apiClient } from '@/api'; // Your axios instance

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  useEffect(() => {
    // Initialize sync manager once
    initSyncManager(apiClient);
    
    // Setup error interceptor for auto-queueing
    setupOfflineInterceptor(apiClient);
  }, []);

  // This hook handles auto-sync when going online
  useSyncOnline();

  return (
    <html>
      <body>
        {children}
        {/* Offline indicator at bottom-right */}
        <OfflineIndicator />
      </body>
    </html>
  );
}
```

#### Next.js Pages Router (src/pages/_app.tsx)

```typescript
'use client';

import { useEffect } from 'react';
import { initSyncManager } from '@/services/syncManager';
import { setupOfflineInterceptor } from '@/lib/offlineInterceptor';
import { useSyncOnline } from '@/hooks/useSyncOnline';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { apiClient } from '@/api';
import type { AppProps } from 'next/app';

function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize sync manager
    initSyncManager(apiClient);
    
    // Setup error interceptor
    setupOfflineInterceptor(apiClient);
  }, []);

  // Auto-sync on reconnect
  useSyncOnline();

  return (
    <>
      <Component {...pageProps} />
      <OfflineIndicator />
    </>
  );
}

export default App;
```

### 3. Update Your API Client

If you're using axios, make sure your API client is properly configured:

```typescript
// src/api.ts or src/lib/axios.ts

import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add any other interceptors (auth, etc.) before setup in layout
export default apiClient;
```

## Usage

### Automatic Queueing

Once set up, offline requests are handled automatically:

```typescript
// This component doesn't need any changes
function BookingForm() {
  const handleSubmit = async (data: BookingData) => {
    try {
      // This request is automatically queued if offline
      const response = await apiClient.post('/api/bookings', data);
      console.log('✅ Booking created:', response.data);
    } catch (error) {
      // Won't be called for offline requests (returns 202)
      console.error('❌ Error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

### Manual Sync Controls

Add the SyncQueueStatus component to show queue statistics and manual controls:

```typescript
import { SyncQueueStatus } from '@/components/SyncQueueStatus';

export function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1>Settings</h1>
      
      {/* Shows queue stats and retry buttons */}
      <SyncQueueStatus />
    </div>
  );
}
```

### Use Connection Status Hook

Detect connection changes in your components:

```typescript
import { useConnectionStatus } from '@/hooks/useConnectionStatus';

function MyComponent() {
  const { isOnline, wasOffline } = useConnectionStatus();

  return (
    <div>
      {isOnline ? (
        <p>✅ Online - all requests are processed immediately</p>
      ) : (
        <p>⚠️ Offline - requests will be queued and sent when online</p>
      )}
      
      {wasOffline && isOnline && (
        <p>ℹ️ Connection restored - syncing queued requests...</p>
      )}
    </div>
  );
}
```

### Monitor Sync Progress

Track sync events in your components:

```typescript
import { useSyncProgress } from '@/hooks/useSyncProgress';

function SyncDebugPanel() {
  const { lastEvent, allEvents, queueCount, hasPending } = useSyncProgress();

  return (
    <div className="bg-gray-100 p-4 rounded">
      <p>Queue Count: {queueCount}</p>
      <p>Has Pending: {hasPending ? 'Yes' : 'No'}</p>
      
      {lastEvent && (
        <div className="mt-2">
          <p>Last Event: {lastEvent.type}</p>
          <pre>{JSON.stringify(lastEvent.data, null, 2)}</pre>
        </div>
      )}
      
      <details>
        <summary>Event History ({allEvents.length})</summary>
        <pre>{JSON.stringify(allEvents, null, 2)}</pre>
      </details>
    </div>
  );
}
```

## Features

### ✅ Automatic Features

- **Auto-Queueing**: Failed requests are automatically queued
- **Auto-Retry**: Queued requests retry when online
- **Auto-Sync**: Sync starts automatically when connection restored
- **Error Filtering**: Only queues retryable errors (5xx, network errors)
- **Request Filtering**: Only queues data-modifying requests (POST, PUT, PATCH, DELETE)

### Manual Controls

- **Manual Retry**: Users can manually retry all queued requests
- **Clear Failed**: Remove failed items from queue
- **Monitor Status**: View queue statistics and event history

### Safety Features

- **Max Retries**: 3 attempts per request
- **Timeout**: 10 seconds per attempt
- **Client Error Handling**: 4xx errors fail immediately (don't retry)
- **Deduplication**: Prevents duplicate in-flight retries
- **SSR Safe**: All browser APIs wrapped with safety checks

## Events System

The offline sync system dispatches custom events for pub/sub:

```typescript
// Listen for app coming online
document.addEventListener('app:online', () => {
  console.log('App is online, sync starting...');
});

// Listen for app going offline
document.addEventListener('app:offline', () => {
  console.log('App is offline, queueing requests...');
});

// Listen for sync events
document.addEventListener('offline:sync', (e: CustomEvent) => {
  const { type, data, timestamp } = e.detail;
  console.log(`Sync event: ${type}`, data);
});
```

## Database Schema (IndexedDB)

The offline queue is stored in IndexedDB with this schema:

```typescript
interface QueuedRequest {
  id?: number;                          // Auto-increment ID
  requestId: string;                    // Unique: method:endpoint:timestamp
  endpoint: string;                     // API endpoint
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: any;                         // Request body
  headers?: Record<string, string>;     // Custom headers
  timestamp: number;                    // When queued
  retryCount: number;                   // Current retry attempt
  maxRetries: number;                   // Max retry attempts (default: 3)
  lastError?: string;                   // Last error message
  status: 'pending' | 'retrying' | 'synced' | 'failed';
  createdAt: Date;                      // Creation timestamp
  updatedAt: Date;                      // Last update timestamp
}
```

View the queue in DevTools:
1. Open Chrome DevTools
2. Go to **Application** tab
3. Click **IndexedDB**
4. Look for **offline-db** database
5. View **QueuedRequests** table

## Testing

### Test Offline Mode

1. Open DevTools (F12)
2. Go to **Network** tab
3. Find the **Throttling** dropdown (usually shows "No throttling")
4. Select **Offline**
5. Make a request - should see 202 Accepted response

### Simulate Connection Loss

```typescript
// In console:
document.dispatchEvent(new Event('offline'));

// Go online:
document.dispatchEvent(new Event('online'));
```

### Monitor IndexedDB

1. DevTools → **Application** tab
2. **IndexedDB** → **offline-db** → **QueuedRequests**
3. See all queued requests with their status

### Check Console Logs

All sync operations log with emojis:
- 📋 Queued
- 🔄 Retrying
- ✅ Success
- ❌ Failed
- ▶️ Sync started
- ✨ Sync complete

## Troubleshooting

### "getSyncManager() called before initialization"

**Problem**: `useSyncOnline` hook called before `initSyncManager` runs

**Solution**: Ensure `initSyncManager` is called in your root layout's `useEffect`

### Requests not queueing

**Problem**: Requests fail but don't queue

**Reasons & Solutions**:
- Only POST, PUT, PATCH, DELETE are queued (GET requests aren't)
- 4xx errors (bad request, 401, 403) aren't queued by design
- Sync manager not initialized - check root layout

### IndexedDB not persisting

**Problem**: Queue clears after page reload

**Reasons & Solutions**:
- Browser in private/incognito mode - use normal mode
- IndexedDB disabled in browser settings
- Storage quota exceeded - clear some storage

### Sync not triggering on reconnect

**Problem**: Queued items don't retry when going online

**Reasons & Solutions**:
- `useSyncOnline` hook not in root component
- Check browser console for errors
- Verify `app:online` event is fired when reconnecting

## Performance Considerations

- **Queue Size**: Typically < 100KB for 10-20 requests
- **Sync Duration**: ~1-2 seconds for typical queue
- **Memory Impact**: Minimal - IndexedDB is persistent storage
- **CPU Impact**: Low - only during sync operations

## Security Notes

- **Payload Storage**: Request bodies stored in IndexedDB (not encrypted)
- **Sensitive Data**: Don't queue requests with passwords/tokens in body
- **Local Storage**: Use secure headers for auth tokens
- **CORS**: Ensure server allows preflight requests

## Next Steps

1. ✅ Install dependencies (`npm install`)
2. ✅ Initialize in app root (layout or _app)
3. ✅ Add `<OfflineIndicator />` component
4. ✅ Optionally add `<SyncQueueStatus />` component
5. ✅ Test offline mode in DevTools
6. ✅ Monitor logs and IndexedDB during testing
7. ✅ Deploy and monitor in production

## Related Files

- `frontend/src/db/offlineDb.ts` - Dexie database wrapper
- `frontend/src/services/syncManager.ts` - Core sync logic
- `frontend/src/lib/offlineInterceptor.ts` - Axios interceptor
- `frontend/src/hooks/useConnectionStatus.ts` - Connection detection
- `frontend/src/hooks/useSyncOnline.ts` - Auto-sync hook
- `frontend/src/hooks/useSyncProgress.ts` - Progress monitoring
- `frontend/src/components/OfflineIndicator.tsx` - Status indicator
- `frontend/src/components/SyncQueueStatus.tsx` - Queue stats

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review console logs (search for emoji indicators)
3. Inspect IndexedDB in DevTools
4. Check network tab for 202 Accepted responses
