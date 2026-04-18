'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to detect online/offline status
 * Returns true when connected to internet, false otherwise
 */
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  useEffect(() => {
    // Set initial state based on navigator
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true); // Mark that we were offline and came back online
      // Dispatch custom event to trigger sync
      if (typeof globalThis !== 'undefined') {
        globalThis.dispatchEvent(
          new CustomEvent('app:online', { detail: { timestamp: Date.now() } })
        );
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (typeof globalThis !== 'undefined') {
        globalThis.dispatchEvent(new CustomEvent('app:offline'));
      }
    };

    if (typeof globalThis !== 'undefined') {
      globalThis.addEventListener('online', handleOnline);
      globalThis.addEventListener('offline', handleOffline);

      return () => {
        globalThis.removeEventListener('online', handleOnline);
        globalThis.removeEventListener('offline', handleOffline);
      };
    }

    return undefined;
  }, []);

  return { isOnline, wasOffline };
}

/**
 * Hook to listen for online/offline events
 */
export function useOnlineEvent(callback: () => void) {
  useEffect(() => {
    if (typeof globalThis !== 'undefined') {
      globalThis.addEventListener('app:online', callback);
      return () => {
        if (typeof globalThis !== 'undefined') {
          globalThis.removeEventListener('app:online', callback);
        }
      };
    }

    return undefined;
  }, [callback]);
}

/**
 * Hook to listen for offline events
 */
export function useOfflineEvent(callback: () => void) {
  useEffect(() => {
    if (typeof globalThis !== 'undefined') {
      globalThis.addEventListener('app:offline', callback);
      return () => {
        if (typeof globalThis !== 'undefined') {
          globalThis.removeEventListener('app:offline', callback);
        }
      };
    }

    return undefined;
  }, [callback]);
}
