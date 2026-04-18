'use client';

import { useEffect, useState } from 'react';

export interface SyncEvent {
  type: 'queued' | 'success' | 'retry' | 'failed' | 'start' | 'complete';
  data: any;
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
      const customEvent = event as CustomEvent<{ type: string; data: any; timestamp: number }>;
      const syncEvent: SyncEvent = {
        type: customEvent.detail.type as SyncEvent['type'],
        data: customEvent.detail.data,
        timestamp: customEvent.detail.timestamp,
      };

      setLastEvent(syncEvent);
      setAllEvents((prev) => [...prev, syncEvent].slice(-20)); // Keep last 20 events

      // Update queue count
      if (customEvent.detail.data?.stats) {
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
