import Dexie, { Table } from 'dexie';

/**
 * Offline Queue Item - represents a failed API request to be retried
 */
export interface QueuedRequest {
  id?: number;
  requestId: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  status: 'pending' | 'retrying' | 'synced' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Offline Database - Stores failed requests while offline
 * Uses IndexedDB under the hood via Dexie
 */
export class OfflineDb extends Dexie {
  queue!: Table<QueuedRequest>;

  constructor() {
    super('IntelliReserveOfflineDb');
    this.version(1).stores({
      queue: '++id, requestId, status, timestamp',
    });
  }

  /**
   * Add a request to the offline queue
   */
  async addRequest(request: Omit<QueuedRequest, 'id'>) {
    return this.queue.add({
      ...request,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Get all pending requests
   */
  async getPendingRequests() {
    return this.queue
      .where('status')
      .anyOf(['pending', 'retrying'])
      .toArray();
  }

  /**
   * Update request status
   */
  async updateStatus(
    requestId: string,
    status: QueuedRequest['status'],
    error?: string
  ) {
    return this.queue.update(requestId, {
      status,
      lastError: error,
      updatedAt: new Date(),
      retryCount: this.queue
        .where('requestId')
        .equals(requestId)
        .toArray()
        .then((items) =>
          items[0]?.retryCount ? items[0].retryCount + 1 : 0
        ),
    });
  }

  /**
   * Remove request from queue (successful sync)
   */
  async removeRequest(requestId: string) {
    return this.queue.where('requestId').equals(requestId).delete();
  }

  /**
   * Increment retry count
   */
  async incrementRetry(requestId: string) {
    const items = await this.queue
      .where('requestId')
      .equals(requestId)
      .toArray();
    if (items.length > 0) {
      return this.queue.update(requestId, {
        retryCount: items[0].retryCount + 1,
        status: 'retrying',
        updatedAt: new Date(),
      });
    }
    return undefined;
  }

  /**
   * Get queue statistics
   */
  async getStats() {
    const items = await this.queue.toArray();
    return {
      total: items.length,
      pending: items.filter((i) => i.status === 'pending').length,
      retrying: items.filter((i) => i.status === 'retrying').length,
      failed: items.filter((i) => i.status === 'failed').length,
      synced: items.filter((i) => i.status === 'synced').length,
    };
  }

  /**
   * Clear all failed items (after user confirms)
   */
  async clearFailed() {
    return this.queue.where('status').equals('failed').delete();
  }

  /**
   * Clear all synced items
   */
  async clearSynced() {
    return this.queue.where('status').equals('synced').delete();
  }

  /**
   * Clear entire queue (use with caution)
   */
  async clearAll() {
    return this.queue.clear();
  }
}

// Singleton instance
export const offlineDb = new OfflineDb();
