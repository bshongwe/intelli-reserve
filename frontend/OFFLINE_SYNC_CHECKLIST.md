# Offline Sync - Integration Checklist

## Phase 1: Setup (15 minutes)

- [ ] **Install Dependencies**
  ```bash
  cd frontend
  npm install
  ```
  Installs: `dexie@3.2.4`, `axios-retry@2.3.6`

- [ ] **Verify Files Exist**
  ```bash
  # Check all offline sync files created
  ls -la src/db/offlineDb.ts
  ls -la src/services/syncManager.ts
  ls -la src/lib/offlineInterceptor.ts
  ls -la src/hooks/useConnectionStatus.ts
  ls -la src/hooks/useSyncOnline.ts
  ls -la src/hooks/useSyncProgress.ts
  ls -la src/components/OfflineIndicator.tsx
  ls -la src/components/SyncQueueStatus.tsx
  ```

## Phase 2: Integration (10 minutes)

Choose based on your Next.js setup:

### Option A: App Router (src/app/layout.tsx)

- [ ] **Add imports**
  ```typescript
  'use client';
  
  import { useEffect } from 'react';
  import { initSyncManager } from '@/services/syncManager';
  import { setupOfflineInterceptor } from '@/lib/offlineInterceptor';
  import { useSyncOnline } from '@/hooks/useSyncOnline';
  import { OfflineIndicator } from '@/components/OfflineIndicator';
  import { apiClient } from '@/api';
  ```

- [ ] **Add useEffect initialization**
  ```typescript
  useEffect(() => {
    initSyncManager(apiClient);
    setupOfflineInterceptor(apiClient);
  }, []);
  ```

- [ ] **Add hook**
  ```typescript
  useSyncOnline();
  ```

- [ ] **Add indicator component**
  ```typescript
  <OfflineIndicator />
  ```

### Option B: Pages Router (src/pages/_app.tsx)

- [ ] **Add imports**
  ```typescript
  'use client';
  
  import { useEffect } from 'react';
  import { initSyncManager } from '@/services/syncManager';
  import { setupOfflineInterceptor } from '@/lib/offlineInterceptor';
  import { useSyncOnline } from '@/hooks/useSyncOnline';
  import { OfflineIndicator } from '@/components/OfflineIndicator';
  import { apiClient } from '@/api';
  ```

- [ ] **Add useEffect initialization** in function body
  ```typescript
  useEffect(() => {
    initSyncManager(apiClient);
    setupOfflineInterceptor(apiClient);
  }, []);
  ```

- [ ] **Add hook** in function body
  ```typescript
  useSyncOnline();
  ```

- [ ] **Add indicator** in return JSX
  ```typescript
  <OfflineIndicator />
  ```

- [ ] **Verify apiClient export** in `src/api.ts`
  ```typescript
  export const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 10000,
  });
  ```

## Phase 3: Testing (20 minutes)

### Test 1: Basic Offline Simulation

- [ ] Open DevTools (F12)
- [ ] Go to **Network** tab
- [ ] Find **Throttling** dropdown
- [ ] Select **Offline**
- [ ] Make an API request (e.g., create booking)
- [ ] Verify you see "Offline" indicator at bottom-right
- [ ] Check Network tab for **202 Accepted** response
- [ ] Open DevTools → **Application** → **IndexedDB** → **offline-db**
- [ ] Verify request appears in **QueuedRequests** table

### Test 2: Auto-Sync on Reconnect

- [ ] Keep the page offline with queued request
- [ ] DevTools → **Network** tab
- [ ] Throttling → select **No throttling** (go online)
- [ ] Watch the "Offline" indicator disappear
- [ ] Watch "Syncing..." indicator appear
- [ ] Wait for success (should see green checkmark)
- [ ] Verify request is removed from IndexedDB queue

### Test 3: Multiple Retries

- [ ] Simulate offline + queue 3-4 requests
- [ ] Go online but make server unavailable (e.g., stop backend)
- [ ] Watch retry attempts in console logs
- [ ] Count retries (should be max 3 per request)
- [ ] Bring server back online
- [ ] Watch auto-retry succeed

### Test 4: Manual Retry Button

- [ ] Add `<SyncQueueStatus />` to a page
- [ ] Go offline and queue some requests
- [ ] Go online (but maybe server is slow)
- [ ] Click "Retry All" button
- [ ] Verify requests retry immediately

## Phase 4: Monitoring (10 minutes)

### Console Logs

- [ ] Open DevTools → **Console** tab
- [ ] Look for emoji-prefixed logs:
  - 📋 Request queued
  - 🔄 Retry attempt
  - ✅ Success
  - ❌ Failed
  - ▶️ Sync started
  - ✨ Sync complete

### IndexedDB Inspector

- [ ] DevTools → **Application** tab
- [ ] **IndexedDB** → **offline-db** → **QueuedRequests**
- [ ] View queue items:
  - `requestId`: unique identifier
  - `status`: pending, retrying, synced, failed
  - `retryCount`: current attempt number
  - `endpoint`: API endpoint
  - `payload`: request body

### Component Usage

- [ ] `<OfflineIndicator />` appears at bottom-right
- [ ] Shows different states:
  - Orange (offline) when no connection
  - Blue (syncing) when online with queued items
  - Green (synced) after successful sync
  - Red (failed) if sync fails after 3 retries
  - Yellow (retrying) during retry attempts

- [ ] `<SyncQueueStatus />` shows:
  - Queue count
  - Breakdown by status (pending, retrying, failed, synced)
  - Recent event history
  - Retry All button
  - Clear Failed button

## Phase 5: Optional Enhancements (later)

- [ ] Add **Service Worker** for background sync
- [ ] Add **Analytics** to track offline usage
- [ ] Add **Notification** toast when sync completes
- [ ] Add **Keyboard shortcut** (e.g., Ctrl+R) for manual sync
- [ ] Add **Retry prioritization** (critical requests first)
- [ ] Add **Payload compression** for large requests

## Troubleshooting

### Issue: "getSyncManager() called before initialization"
- **Fix**: Ensure `initSyncManager(apiClient)` is called in root layout's `useEffect`

### Issue: Requests not queueing
- **Check**: 
  - Only POST/PUT/PATCH/DELETE queue (not GET)
  - Only 5xx and network errors queue (not 4xx)
  - Sync manager initialized?

### Issue: IndexedDB not showing queue
- **Check**:
  - Browser in private mode? (use normal mode)
  - IndexedDB enabled in browser settings?
  - Storage quota exceeded?

### Issue: Indicator not showing
- **Check**:
  - `useSyncOnline()` hook called in root?
  - `<OfflineIndicator />` added to root layout?
  - Component mounted (not in SSR only)?

### Issue: Sync not triggering on reconnect
- **Check**:
  - `useSyncOnline()` hook present?
  - Browser "online" event firing? (test in console)
  - No JavaScript errors? (check console)

## Performance Checklist

- [ ] Queue stays < 100KB (typical for 10-20 requests)
- [ ] Sync completes in < 5 seconds for typical queue
- [ ] No memory leaks (check Chrome task manager)
- [ ] No CPU spikes during sync (check task manager)
- [ ] IndexedDB storage reasonable (check quota)

## Security Checklist

- [ ] Auth tokens in headers (not in payload)
- [ ] No passwords stored in queued requests
- [ ] CORS preflight requests allowed by server
- [ ] SSL/HTTPS enabled in production
- [ ] IndexedDB not accessible from other origins

## Production Readiness

- [ ] All tests passing
- [ ] Console errors cleared
- [ ] IndexedDB working in multiple browsers
- [ ] Performance acceptable
- [ ] Security checks passed
- [ ] Documentation reviewed
- [ ] Team trained on feature
- [ ] Monitoring/logging in place

## Files Modified/Created

### Created Files (8 total)
1. ✅ `src/db/offlineDb.ts` - Dexie database wrapper
2. ✅ `src/services/syncManager.ts` - Sync logic
3. ✅ `src/lib/offlineInterceptor.ts` - Axios interceptor
4. ✅ `src/hooks/useConnectionStatus.ts` - Connection detection
5. ✅ `src/hooks/useSyncOnline.ts` - Auto-sync hook
6. ✅ `src/hooks/useSyncProgress.ts` - Progress monitoring
7. ✅ `src/components/OfflineIndicator.tsx` - Status indicator
8. ✅ `src/components/SyncQueueStatus.tsx` - Queue stats

### Updated Files
1. ✅ `package.json` - Added dexie and axios-retry
2. ⏳ `src/app/layout.tsx` or `src/pages/_app.tsx` - Add initialization

### Documentation
1. ✅ `OFFLINE_SYNC_GUIDE.md` - Comprehensive guide
2. ✅ `OFFLINE_SYNC_CHECKLIST.md` - This file

## Next Action

1. Run `npm install` in frontend folder
2. Choose App Router OR Pages Router integration
3. Add initialization code to your root layout
4. Test offline mode using DevTools
5. Verify requests queue and sync
6. Deploy with confidence!

---

**Status**: Ready for integration ✅

**Estimated Integration Time**: 30-45 minutes

**Estimated Testing Time**: 15-20 minutes

**Total to Production**: ~1 hour
