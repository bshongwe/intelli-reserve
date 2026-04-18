import axios, { AxiosInstance } from 'axios';
import { offlineDb, QueuedRequest } from '@/db/offlineDb';

/**
 * Sync Manager - Handles retrying offline-queued requests
 */
export class SyncManager {
  private readonly apiClient: AxiosInstance;
  private readonly syncInProgress = new Set<string>();
  private isSyncing = false;

  constructor(apiClient: AxiosInstance) {
    this.apiClient = apiClient;
  }

  /**
   * Sync all pending requests from offline queue
   */
  async syncOfflineQueue() {
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    this.isSyncing = true;
    console.log('🔄 Starting offline queue sync...');

    try {
      const pendingRequests = await offlineDb.getPendingRequests();

      if (pendingRequests.length === 0) {
        console.log('✅ No pending requests to sync');
        this.isSyncing = false;
        return;
      }

      console.log(`📤 Syncing ${pendingRequests.length} pending requests...`);

      for (const request of pendingRequests) {
        if (this.syncInProgress.has(request.requestId)) {
          console.log(
            `⏭️  Skipping ${request.requestId} - already in progress`
          );
          continue;
        }

        await this.retryRequest(request);
      }

      // Clean up synced items
      await offlineDb.clearSynced();
      console.log('✅ Offline queue sync complete');
    } catch (error) {
      console.error('❌ Error syncing offline queue:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Retry a single request
   */
  private async retryRequest(request: QueuedRequest) {
    const { requestId, endpoint, method, payload, maxRetries } = request;

    this.syncInProgress.add(requestId);

    try {
      await offlineDb.updateStatus(requestId, 'retrying');

      console.log(`🔄 Retrying ${method} ${endpoint} (attempt ${request.retryCount + 1})`);

      const response = await this.apiClient({
        method,
        url: endpoint,
        data: payload,
        timeout: 10000, // 10 second timeout
      });

      // Success!
      await offlineDb.removeRequest(requestId);
      console.log(`✅ ${requestId} synced successfully`);

      // Dispatch success event
      this.dispatchSyncEvent('success', { requestId, response });
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.message
        : 'Unknown error';

      console.error(`❌ Retry failed for ${requestId}: ${errorMessage}`);

      // Check if we should retry again
      if (request.retryCount < maxRetries) {
        await offlineDb.incrementRetry(requestId);
        console.log(
          `⏳ Will retry ${requestId} (${request.retryCount + 1}/${maxRetries})`
        );
        this.dispatchSyncEvent('retry', { requestId, retryCount: request.retryCount + 1 });
      } else {
        // Max retries exceeded
        await offlineDb.updateStatus(requestId, 'failed', errorMessage);
        console.log(`💔 ${requestId} failed after ${maxRetries} retries`);
        this.dispatchSyncEvent('failed', { requestId, error: errorMessage });
      }
    } finally {
      this.syncInProgress.delete(requestId);
    }
  }

  /**
   * Queue a failed request for later retry
   */
  async queueRequest(
    endpoint: string,
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    payload: any,
    maxRetries = 3
  ) {
    const requestId = `${method}:${endpoint}:${Date.now()}`;

    try {
      const request: Omit<QueuedRequest, 'id' | 'createdAt' | 'updatedAt'> = {
        requestId,
        endpoint,
        method,
        payload,
        status: 'pending',
        retryCount: 0,
        maxRetries,
        timestamp: Date.now(),
      };
      
      await offlineDb.addRequest(request as Omit<QueuedRequest, 'id'>);

      console.log(`📝 Queued ${requestId} for offline retry`);
      this.dispatchSyncEvent('queued', { requestId });

      return requestId;
    } catch (error) {
      console.error('Failed to queue request:', error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    return offlineDb.getStats();
  }

  /**
   * Clear failed items from queue
   */
  async clearFailed() {
    return offlineDb.clearFailed();
  }

  /**
   * Dispatch sync event for UI to listen to
   */
  private dispatchSyncEvent(
    type: 'queued' | 'success' | 'retry' | 'failed' | 'start' | 'complete',
    data: any
  ) {
    if (typeof globalThis !== 'undefined') {
      globalThis.dispatchEvent(
        new CustomEvent('offline:sync', {
          detail: { type, data, timestamp: Date.now() },
        })
      );
    }
  }
}

// Singleton instance (initialized in app)
let syncManager: SyncManager | null = null;

export function initSyncManager(apiClient: AxiosInstance) {
  syncManager = new SyncManager(apiClient);
  return syncManager;
}

export function getSyncManager() {
  if (!syncManager) {
    throw new Error(
      'SyncManager not initialized. Call initSyncManager first.'
    );
  }
  return syncManager;
}
