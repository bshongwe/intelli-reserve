'use client';

import { useEffect } from 'react';
import { initSyncManager } from '@/services/syncManager';
import { setupOfflineInterceptor } from '@/lib/offlineInterceptor';
import { useSyncOnline } from '@/hooks/useSyncOnline';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { apiClient } from '@/lib/axiosClient';

/**
 * OfflineSync Component
 * Initializes offline sync on app load and provides UI indicators
 */
export function OfflineSync() {
  useEffect(() => {
    // Initialize sync manager and interceptor once on app start
    initSyncManager(apiClient);
    setupOfflineInterceptor(apiClient);
  }, []);

  // Hook that auto-syncs when connection is restored
  useSyncOnline();

  return <OfflineIndicator />;
}
