'use client';

import { useEffect, useState } from 'react';

export interface SyncEvent {
  type: 'queued' | 'success' | 'retry' | 'failed' | 'start' | 'complete';
  data?: {
    readonly requestId?: string;
    readonly retryCount?: number;
    readonly error?: string;
    readonly status?: number;
    readonly statusText?: string;
    readonly syncedCount?: number;
    readonly timestamp?: number;
    readonly stats?: { total: number };
    readonly [key: string]: unknown;
  };
  timestamp: number;
}

/**
 * Hook to listen for sync events
 * Returns the latest sync event and all events
 */
export function useSyncProgress() {
  const [lastEvent, setLastEvent] = useState<SyncEvent | null>(null);
  const [allEvents, setAllEvents] = useState<SyncEvent[]>([]);
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    const handleSyncEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{
        type: string;
        data?: SyncEvent['data'];
        timestamp: number;
      }>;

      const syncEvent: SyncEvent = {
        type: customEvent.detail.type as SyncEvent['type'],
        data: customEvent.detail.data,
        timestamp: customEvent.detail.timestamp,
      };

      setLastEvent(syncEvent);
      setAllEvents((prev) => [...prev, syncEvent].slice(-20)); // Keep last 20 events

      // Update queue count based on event type
      if (customEvent.detail.data?.stats?.total === undefined) {
        switch (syncEvent.type) {
          case 'queued':
            setQueueCount((prev) => prev + 1);
            break;
          case 'success':
          case 'failed':
            setQueueCount((prev) => Math.max(prev - 1, 0));
            break;
          case 'start':
            // Reset count at start of sync
            setQueueCount(0);
            break;
          case 'complete':
            // Keep final count from complete event data if present
            if (customEvent.detail.data?.syncedCount !== undefined) {
              setQueueCount(0);
            }
            break;
          // 'retry' doesn't change queue count
        }
      } else {
        setQueueCount(customEvent.detail.data.stats.total);
      }
    };

    if (typeof globalThis !== 'undefined') {
      globalThis.addEventListener('offline:sync', handleSyncEvent);
      return () => {
        globalThis.removeEventListener('offline:sync', handleSyncEvent);
      };
    }

    return undefined;
  }, []);

  return {
    lastEvent,
    allEvents,
    queueCount,
    hasPending: queueCount > 0,
  };
}
