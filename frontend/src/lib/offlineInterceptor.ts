import { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { getSyncManager } from '@/services/syncManager';

/**
 * API error response interceptor
 * Queues failed requests for offline retry
 */
export function setupOfflineInterceptor(apiClient: AxiosInstance) {
  apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      // Check if this is a network error or server error
      const isNetworkError = !error.response;
      const isServerError =
        error.response && error.response.status >= 500;
      const isClientFatal =
        error.response && error.response.status >= 400 && error.response.status < 500;

      // Don't queue 4xx errors (bad requests, not found, etc)
      // Only queue network errors and 5xx errors
      if (isClientFatal) {
        console.log(
          `⏭️  Not queueing ${error.config?.method?.toUpperCase()} ${error.config?.url} - client error (${error.response?.status})`
        );
        throw error;
      }

      if (!isNetworkError && !isServerError) {
        throw error;
      }

      const { method, url, data } = error.config || {};

      // Only queue data-modifying requests (not GET/HEAD)
      const isModifyingRequest = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
        method?.toUpperCase() || ''
      );

      if (!isModifyingRequest || !url) {
        throw error;
      }

      try {
        const syncManager = getSyncManager();
        
        // Queue for offline retry
        const requestId = await syncManager.queueRequest(
          url,
          method?.toUpperCase() as 'POST' | 'PUT' | 'PATCH' | 'DELETE',
          data,
          3 // max 3 retries
        );

        console.log(
          `✅ Queued ${method?.toUpperCase()} ${url} as ${requestId}`
        );

        // Return a successful response to prevent UI errors
        // The request is queued and will be retried when online
        return {
          config: error.config,
          data: {
            queued: true,
            requestId,
            message: 'Request queued - will be sent when online',
          },
          status: 202, // Accepted - request queued for processing
          statusText: 'Accepted',
          headers: error.response?.headers || {},
        } as AxiosResponse;
      } catch (queueError) {
        console.error('Failed to queue request:', queueError);
        throw error;
      }
    }
  );

  return apiClient;
}
