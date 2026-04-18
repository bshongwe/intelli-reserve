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
   * Update request status (does not modify retryCount)
   */
  async updateStatus(
    requestId: string,
    status: QueuedRequest['status'],
    error?: string
  ) {
    return this.queue
      .where('requestId')
      .equals(requestId)
      .modify({
        status,
        lastError: error,
        updatedAt: new Date(),
      });
  }

  /**
   * Remove request from queue (successful sync)
   */
  async removeRequest(requestId: string) {
    return this.queue.where('requestId').equals(requestId).delete();
  }

  /**
   * Increment retry count and return new count
   */
  async incrementRetry(requestId: string): Promise<number> {
    let newCount = 0;
    await this.queue
      .where('requestId')
      .equals(requestId)
      .modify((item) => {
        item.retryCount = (item.retryCount ?? 0) + 1;
        item.status = 'retrying';
        item.updatedAt = new Date();
        newCount = item.retryCount;
      });
    return newCount;
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

// Singleton instance (lazy; SSR-safe)
let _offlineDb: OfflineDb | null = null;

export function getOfflineDb(): OfflineDb {
  if (globalThis.window === undefined) {
    throw new TypeError('offlineDb is only available in the browser');
  }
  if (!_offlineDb) {
    _offlineDb = new OfflineDb();
  }
  return _offlineDb;
}

// Fallback export for backward compatibility (but typed to error in SSR)
export const offlineDb: OfflineDb = new Proxy({} as OfflineDb, {
  get(_target, prop) {
    return Reflect.get(getOfflineDb(), prop, getOfflineDb());
  },
});
