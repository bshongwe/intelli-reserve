/**
 * Query Optimization Helper
 * 
 * Provides database query optimization patterns including:
 * - Connection pooling with tuned parameters
 * - Query result caching
 * - Batch loading capabilities
 * - Performance monitoring
 */

import { Pool } from 'pg';

export interface QueryCache {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

const QUERY_CACHE = new Map<string, QueryCache>();

/**
 * Get cache TTL for different query types
 */
export function getCacheTTL(queryType: 'dashboard' | 'analytics' | 'services' | 'slots'): number {
  const ttlMap = {
    dashboard: 5 * 60 * 1000, // 5 minutes
    analytics: 10 * 60 * 1000, // 10 minutes
    services: 15 * 60 * 1000, // 15 minutes
    slots: 2 * 60 * 1000, // 2 minutes
  };
  return ttlMap[queryType];
}

/**
 * Create cache key from query parameters
 */
export function createCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.entries(params)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  return `${prefix}:${sortedParams}`;
}

/**
 * Get cached result if available and not expired
 */
export function getCachedResult<T>(cacheKey: string): T | null {
  const cached = QUERY_CACHE.get(cacheKey);
  if (!cached) return null;

  const isExpired = Date.now() - cached.timestamp > cached.ttl;
  if (isExpired) {
    QUERY_CACHE.delete(cacheKey);
    return null;
  }

  return cached.data as T;
}

/**
 * Set cached result
 */
export function setCachedResult<T>(cacheKey: string, data: T, ttl: number): void {
  QUERY_CACHE.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

/**
 * Clear cache for a specific prefix
 */
export function clearCacheByPrefix(prefix: string): void {
  for (const [key] of QUERY_CACHE.entries()) {
    if (key.startsWith(prefix)) {
      QUERY_CACHE.delete(key);
    }
  }
}

/**
 * Execute query with caching
 */
export async function queryWithCache<T>(
  pool: Pool,
  query: string,
  params: unknown[],
  cacheKey: string,
  ttl: number
): Promise<T[]> {
  // Try to get from cache first
  const cached = getCachedResult<T[]>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Execute query
  const result = await pool.query(query, params);
  const data = result.rows as T[];

  // Cache the result
  setCachedResult(cacheKey, data, ttl);

  return data;
}

/**
 * Optimize pool configuration for better performance
 */
export function getOptimizedPoolConfig() {
  return {
    max: 20, // Maximum number of clients
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    // Enable connection pooling statement caching
    statement_cache_size: 100,
  };
}

/**
 * Health check query (fast)
 */
export async function healthCheck(pool: Pool): Promise<boolean> {
  try {
    const result = await pool.query('SELECT 1');
    return result.rows.length > 0;
  } catch {
    return false;
  }
}
