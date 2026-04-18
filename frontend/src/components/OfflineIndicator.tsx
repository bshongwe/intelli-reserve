'use client';

import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { useSyncProgress } from '@/hooks/useSyncProgress';
import { WifiOff, Wifi, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface IndicatorState {
  type: 'offline' | 'syncing' | 'success' | 'failed' | 'retry' | 'none';
}

function getIndicatorState(
  isOnline: boolean,
  queueCount: number,
  lastEvent: any,
): IndicatorState['type'] {
  if (!isOnline) {
    return 'offline';
  }

  if (queueCount > 0) {
    return 'syncing';
  }

  if (lastEvent?.type === 'success') {
    return 'success';
  }

  if (lastEvent?.type === 'failed') {
    return 'failed';
  }

  if (lastEvent?.type === 'retry') {
    return 'retry';
  }

  return 'none';
}

function getPlural(count: number): string {
  return count === 1 ? '' : 's';
}

function OfflineContent({ queueCount }: { readonly queueCount: number }) {
  return (
    <div className="bg-orange-100 border border-orange-300 rounded-lg p-3 flex items-center gap-2 shadow-lg">
      <WifiOff className="w-5 h-5 text-orange-600" />
      <div className="flex flex-col">
        <p className="text-sm font-semibold text-orange-900">Offline</p>
        {queueCount > 0 && (
          <p className="text-xs text-orange-800">
            {queueCount} request{getPlural(queueCount)} queued
          </p>
        )}
      </div>
    </div>
  );
}

function SyncingContent({ queueCount }: { readonly queueCount: number }) {
  return (
    <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 flex items-center gap-2 shadow-lg">
      <Wifi className="w-5 h-5 text-blue-600 animate-pulse" />
      <div className="flex flex-col">
        <p className="text-sm font-semibold text-blue-900">Syncing...</p>
        <p className="text-xs text-blue-800">
          {queueCount} request{getPlural(queueCount)} to sync
        </p>
      </div>
    </div>
  );
}

function SuccessContent({ lastEvent }: { readonly lastEvent: any }) {
  return (
    <div className="bg-green-100 border border-green-300 rounded-lg p-3 flex items-center gap-2 shadow-lg animate-pulse">
      <CheckCircle className="w-5 h-5 text-green-600" />
      <div className="flex flex-col">
        <p className="text-sm font-semibold text-green-900">Synced!</p>
        <p className="text-xs text-green-800">{lastEvent.data?.requestId}</p>
      </div>
    </div>
  );
}

function FailedContent({ lastEvent }: { readonly lastEvent: any }) {
  return (
    <div className="bg-red-100 border border-red-300 rounded-lg p-3 flex items-center gap-2 shadow-lg">
      <AlertCircle className="w-5 h-5 text-red-600" />
      <div className="flex flex-col">
        <p className="text-sm font-semibold text-red-900">Sync Failed</p>
        <p className="text-xs text-red-800">
          {lastEvent.data?.error?.substring(0, 30)}...
        </p>
      </div>
    </div>
  );
}

function RetryContent({ lastEvent }: { readonly lastEvent: any }) {
  return (
    <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 flex items-center gap-2 shadow-lg">
      <Clock className="w-5 h-5 text-yellow-600 animate-spin" />
      <div className="flex flex-col">
        <p className="text-sm font-semibold text-yellow-900">Retrying...</p>
        <p className="text-xs text-yellow-800">
          Attempt {lastEvent.data?.retryCount} of 3
        </p>
      </div>
    </div>
  );
}

/**
 * Offline Indicator Component
 * Shows connection status and sync progress
 */
export function OfflineIndicator() {
  const { isOnline } = useConnectionStatus();
  const { lastEvent, queueCount } = useSyncProgress();
  const [mounted, setMounted] = useState(false);

  // Wait for hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const indicatorType = getIndicatorState(isOnline, queueCount, lastEvent);

  if (indicatorType === 'none') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {indicatorType === 'offline' && <OfflineContent queueCount={queueCount} />}
      {indicatorType === 'syncing' && <SyncingContent queueCount={queueCount} />}
      {indicatorType === 'success' && <SuccessContent lastEvent={lastEvent} />}
      {indicatorType === 'failed' && <FailedContent lastEvent={lastEvent} />}
      {indicatorType === 'retry' && <RetryContent lastEvent={lastEvent} />}
    </div>
  );
}
