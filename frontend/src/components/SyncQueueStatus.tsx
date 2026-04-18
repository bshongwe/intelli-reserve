'use client';

import { useSyncProgress } from '@/hooks/useSyncProgress';
import { getSyncManager } from '@/services/syncManager';
import { Trash2, RotateCcw } from 'lucide-react';
import { useState } from 'react';

interface QueueStats {
  readonly total: number;
  readonly pending: number;
  readonly retrying: number;
  readonly failed: number;
  readonly synced: number;
}

async function getQueueStats(): Promise<QueueStats | null> {
  try {
    const syncManager = getSyncManager();
    return await syncManager.getQueueStats();
  } catch {
    return null;
  }
}

async function handleManualRetry(): Promise<void> {
  try {
    const syncManager = getSyncManager();
    await syncManager.syncOfflineQueue();
  } catch (error) {
    console.error('❌ Manual retry failed:', error);
  }
}

async function handleClearFailed(): Promise<void> {
  try {
    const syncManager = getSyncManager();
    await syncManager.clearFailed();
  } catch (error) {
    console.error('❌ Clear failed items failed:', error);
  }
}

/**
 * Sync Queue Status Component
 * Shows detailed queue statistics and provides controls
 */
export function SyncQueueStatus() {
  const { queueCount, allEvents } = useSyncProgress();
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleLoadStats(): Promise<void> {
    setIsLoading(true);
    const result = await getQueueStats();
    setStats(result);
    setIsLoading(false);
  }

  const statusColor = (count: number): string => {
    if (count === 0) return 'text-gray-600';
    if (count <= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (queueCount === 0 && allEvents.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4 bg-white shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Sync Queue Status</h3>
        <button
          onClick={handleLoadStats}
          disabled={isLoading}
          className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-400"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Queue Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">Pending Items</p>
        <p className={`text-2xl font-bold ${statusColor(queueCount)}`}>
          {queueCount}
        </p>
      </div>

      {/* Detailed Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded">
          <div>
            <p className="text-xs text-gray-600">Total</p>
            <p className="text-lg font-semibold text-gray-900">{stats.total}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Pending</p>
            <p className="text-lg font-semibold text-yellow-600">
              {stats.pending}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Retrying</p>
            <p className="text-lg font-semibold text-orange-600">
              {stats.retrying}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Failed</p>
            <p className="text-lg font-semibold text-red-600">{stats.failed}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Synced</p>
            <p className="text-lg font-semibold text-green-600">{stats.synced}</p>
          </div>
        </div>
      )}

      {/* Recent Events */}
      {allEvents.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-900 mb-2">Recent Events</p>
          <div className="space-y-1 max-h-40 overflow-y-auto text-xs">
            {allEvents.slice(0, 5).map((event) => (
              <div key={`${event.timestamp}-${event.type}`} className="text-gray-600 flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>
                  {event.type === 'queued' && '📋 Queued'}
                  {event.type === 'success' && '✅ Success'}
                  {event.type === 'retry' && '🔄 Retry'}
                  {event.type === 'failed' && '❌ Failed'}
                  {event.type === 'start' && '▶️ Start'}
                  {event.type === 'complete' && '✨ Complete'}
                  {event.data?.requestId && ` - ${event.data.requestId.substring(0, 30)}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleManualRetry}
          disabled={queueCount === 0}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded transition"
        >
          <RotateCcw className="w-4 h-4" />
          Retry All
        </button>
        <button
          onClick={handleClearFailed}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition"
        >
          <Trash2 className="w-4 h-4" />
          Clear Failed
        </button>
      </div>

      {/* Queue Empty Message */}
      {queueCount === 0 && allEvents.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          No sync issues detected. All requests synced successfully!
        </p>
      )}
    </div>
  );
}
