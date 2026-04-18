'use client';

import { useEffect } from 'react';
import { getSyncManager } from '@/services/syncManager';
import { useOnlineEvent } from '@/hooks/useConnectionStatus';

/**
 * Hook that syncs offline queue when connection is restored
 * Should be called once in the app root
 */
export function useSyncOnline() {
  const handleOnline = async () => {
    try {
      console.log('🌐 Back online - syncing offline queue...');
      const syncManager = getSyncManager();
      await syncManager.syncOfflineQueue();
    } catch (error) {
      console.error('Error syncing offline queue:', error);
    }
  };

  // Listen for custom online event
  useOnlineEvent(handleOnline);

  // Also sync on app load if there are pending items
  useEffect(() => {
    const syncIfNeeded = async () => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        try {
          const syncManager = getSyncManager();
          const stats = await syncManager.getQueueStats();
          if (stats.pending > 0 || stats.retrying > 0) {
            console.log('📋 Found pending offline requests on app load - syncing...');
            await syncManager.syncOfflineQueue();
          }
        } catch (error) {
          console.error('Error checking offline queue on app load:', error);
        }
      }
    };

    syncIfNeeded();
  }, []);
}
