/**
 * API Service Layer - All communication with BFF backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_BFF_URL || 'http://localhost:3001/api';

// Types
export interface Service {
  id: string;
  hostId: string;
  name: string;
  description: string;
  category: string;
  durationMinutes: number;
  basePrice: number;
  maxParticipants: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  id: string;
  serviceId: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isRecurring: boolean;
  recurringRuleId?: string;
  bookedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsData {
  revenueData: Array<{
    month: string;
    revenue: number;
    bookings: number;
  }>;
  bookingStatusData: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  topServices: Array<{
    id: string;
    name: string;
    bookings: number;
    revenue: number;
  }>;
  topCustomers: Array<{
    id: string;
    name: string;
    bookings: number;
    totalSpent: number;
  }>;
  metrics: {
    totalRevenue: string;
    totalBookings: number;
    activeCustomers: number;
    avgRating: number;
  };
}

export interface DashboardMetrics {
  revenueData: Array<{
    month: string;
    revenue: number;
    bookings: number;
  }>;
  occupancyData: Array<{
    date: string;
    occupancy: number;
  }>;
  upcomingBookings: number;
  totalRevenue: string;
}

// Error handler
function handleError(error: any): never {
  console.error('API Error:', error);
  const message = error?.message || 'An error occurred';
  throw new Error(message);
}

// Helper for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    handleError(error);
  }

  return response.json();
}

// Services API
export const servicesAPI = {
  /**
   * Get all services for a host
   */
  getHostServices: async (hostId: string): Promise<Service[]> => {
    return apiCall(`/services?hostId=${hostId}`);
  },

  /**
   * Create a new service
   */
  createService: async (
    hostId: string,
    data: Omit<Service, 'id' | 'hostId' | 'createdAt' | 'updatedAt'>
  ): Promise<Service> => {
    return apiCall(`/services?hostId=${hostId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update a service
   */
  updateService: async (
    serviceId: string,
    data: Partial<Omit<Service, 'id' | 'hostId' | 'createdAt' | 'updatedAt'>>
  ): Promise<Service> => {
    return apiCall(`/services/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a service
   */
  deleteService: async (serviceId: string): Promise<void> => {
    return apiCall(`/services/${serviceId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Bulk delete services
   */
  bulkDeleteServices: async (serviceIds: string[]): Promise<void> => {
    return apiCall(`/services/bulk/delete`, {
      method: 'POST',
      body: JSON.stringify({ ids: serviceIds }),
    });
  },

  /**
   * Toggle service active status
   */
  toggleServiceStatus: async (serviceId: string, isActive: boolean): Promise<Service> => {
    return apiCall(`/services/${serviceId}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },
};

// Time Slots API
export const timeSlotsAPI = {
  /**
   * Get time slots for a service on a specific date
   */
  getTimeSlots: async (serviceId: string, date: string): Promise<TimeSlot[]> => {
    return apiCall(`/time-slots?serviceId=${serviceId}&date=${date}`);
  },

  /**
   * Create a single time slot
   */
  createTimeSlot: async (
    serviceId: string,
    slotDate: string,
    startTime: string,
    endTime: string
  ): Promise<TimeSlot> => {
    return apiCall(`/time-slots`, {
      method: 'POST',
      body: JSON.stringify({
        serviceId,
        slotDate,
        startTime,
        endTime,
      }),
    });
  },

  /**
   * Create recurring time slots
   */
  createRecurringSlots: async (
    serviceId: string,
    startTime: string,
    endTime: string,
    daysOfWeek: number[],
    startDate: string,
    endDate?: string
  ): Promise<{ message: string; count: number }> => {
    return apiCall(`/recurring-slots`, {
      method: 'POST',
      body: JSON.stringify({
        serviceId,
        startTime,
        endTime,
        daysOfWeek,
        startDate,
        endDate,
      }),
    });
  },

  /**
   * Delete a time slot
   */
  deleteTimeSlot: async (slotId: string): Promise<void> => {
    return apiCall(`/time-slots/${slotId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Update time slot availability
   */
  updateTimeSlotAvailability: async (
    slotId: string,
    isAvailable: boolean
  ): Promise<void> => {
    return apiCall(`/time-slots/${slotId}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ isAvailable }),
    });
  },
};

// Analytics API
export const analyticsAPI = {
  /**
   * Get analytics dashboard data
   */
  getAnalytics: async (
    hostId: string,
    timeRange: '1m' | '3m' | '6m' | '1y' = '6m'
  ): Promise<AnalyticsData> => {
    return apiCall(`/analytics?hostId=${hostId}&timeRange=${timeRange}`);
  },

  /**
   * Get host dashboard metrics
   */
  getDashboardMetrics: async (hostId: string): Promise<DashboardMetrics> => {
    return apiCall(`/dashboard/metrics?hostId=${hostId}`);
  },
};

export default {
  servicesAPI,
  timeSlotsAPI,
  analyticsAPI,
};
