import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

/**
 * gRPC Client Configuration
 * Handles all communication with backend microservices via gRPC
 */

const PROTO_PATH = path.join(__dirname, '../../..', 'backend/proto');
const BACKEND_URL = process.env.BACKEND_GRPC_URL || 'localhost:8090';

// Package definitions
let bookingPackageDef: any;
let analyticsPackageDef: any;
let servicesPackageDef: any;

// gRPC clients
let bookingClient: any;
let analyticsClient: any;
let servicesClient: any;

/**
 * Initialize all gRPC clients
 */
export async function initializeGRPCClients(): Promise<void> {
  try {
    // Load proto files
    bookingPackageDef = protoLoader.loadSync(path.join(PROTO_PATH, 'booking.proto'), {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      includeDirs: [PROTO_PATH],
    });

    analyticsPackageDef = protoLoader.loadSync(path.join(PROTO_PATH, 'analytics.proto'), {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      includeDirs: [PROTO_PATH],
    });

    servicesPackageDef = protoLoader.loadSync(path.join(PROTO_PATH, 'services.proto'), {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      includeDirs: [PROTO_PATH],
    });

    // Get gRPC service descriptors
    const bookingGrpcObj = grpc.loadPackageDefinition(bookingPackageDef);
    const analyticsGrpcObj = grpc.loadPackageDefinition(analyticsPackageDef);
    const servicesGrpcObj = grpc.loadPackageDefinition(servicesPackageDef);

    // Create clients
    const BookingService = (bookingGrpcObj.intelli_reserve.booking as any).BookingService;
    const AnalyticsService = (analyticsGrpcObj.intelli_reserve.analytics as any).AnalyticsService;
    const ServicesManagement = (servicesGrpcObj.intelli_reserve.services as any).ServicesManagement;

    bookingClient = new BookingService(BACKEND_URL, grpc.credentials.createInsecure());
    analyticsClient = new AnalyticsService(BACKEND_URL, grpc.credentials.createInsecure());
    servicesClient = new ServicesManagement(BACKEND_URL, grpc.credentials.createInsecure());

    console.log('✅ gRPC clients initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize gRPC clients:', error);
    throw error;
  }
}

/**
 * Wrapper for promisifying gRPC client methods
 */
function promisifyGRPCMethod(client: any, method: string): (request: any) => Promise<any> {
  return (request: any) => {
    return new Promise((resolve, reject) => {
      client[method](request, (error: any, response: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  };
}

/**
 * BOOKING SERVICE METHODS
 */

export const bookingService = {
  createBooking: async (request: any) => {
    const method = promisifyGRPCMethod(bookingClient, 'CreateBooking');
    return method(request);
  },

  getBooking: async (request: any) => {
    const method = promisifyGRPCMethod(bookingClient, 'GetBooking');
    return method(request);
  },

  getHostBookings: async (request: any) => {
    const method = promisifyGRPCMethod(bookingClient, 'GetHostBookings');
    return method(request);
  },

  getClientBookings: async (request: any) => {
    const method = promisifyGRPCMethod(bookingClient, 'GetClientBookings');
    return method(request);
  },

  updateBookingStatus: async (request: any) => {
    const method = promisifyGRPCMethod(bookingClient, 'UpdateBookingStatus');
    return method(request);
  },

  cancelBooking: async (request: any) => {
    const method = promisifyGRPCMethod(bookingClient, 'CancelBooking');
    return method(request);
  },

  deleteBooking: async (request: any) => {
    const method = promisifyGRPCMethod(bookingClient, 'DeleteBooking');
    return method(request);
  },
};

/**
 * ANALYTICS SERVICE METHODS
 */

export const analyticsService = {
  getDashboardMetrics: async (request: any) => {
    const method = promisifyGRPCMethod(analyticsClient, 'GetDashboardMetrics');
    return method(request);
  },

  getAnalytics: async (request: any) => {
    const method = promisifyGRPCMethod(analyticsClient, 'GetAnalytics');
    return method(request);
  },

  getRevenueReport: async (request: any) => {
    const method = promisifyGRPCMethod(analyticsClient, 'GetRevenueReport');
    return method(request);
  },

  getBookingStatistics: async (request: any) => {
    const method = promisifyGRPCMethod(analyticsClient, 'GetBookingStatistics');
    return method(request);
  },
};

/**
 * SERVICES MANAGEMENT METHODS
 */

export const servicesManagement = {
  createService: async (request: any) => {
    const method = promisifyGRPCMethod(servicesClient, 'CreateService');
    return method(request);
  },

  getService: async (request: any) => {
    const method = promisifyGRPCMethod(servicesClient, 'GetService');
    return method(request);
  },

  getHostServices: async (request: any) => {
    const method = promisifyGRPCMethod(servicesClient, 'GetHostServices');
    return method(request);
  },

  updateService: async (request: any) => {
    const method = promisifyGRPCMethod(servicesClient, 'UpdateService');
    return method(request);
  },

  deleteService: async (request: any) => {
    const method = promisifyGRPCMethod(servicesClient, 'DeleteService');
    return method(request);
  },

  createTimeSlot: async (request: any) => {
    const method = promisifyGRPCMethod(servicesClient, 'CreateTimeSlot');
    return method(request);
  },

  getTimeSlot: async (request: any) => {
    const method = promisifyGRPCMethod(servicesClient, 'GetTimeSlot');
    return method(request);
  },

  getAvailableTimeSlots: async (request: any) => {
    const method = promisifyGRPCMethod(servicesClient, 'GetAvailableTimeSlots');
    return method(request);
  },

  updateTimeSlotAvailability: async (request: any) => {
    const method = promisifyGRPCMethod(servicesClient, 'UpdateTimeSlotAvailability');
    return method(request);
  },

  deleteTimeSlot: async (request: any) => {
    const method = promisifyGRPCMethod(servicesClient, 'DeleteTimeSlot');
    return method(request);
  },
};

/**
 * Cleanup function to close all gRPC client connections
 */
export function closeGRPCClients(): void {
  if (bookingClient) bookingClient.close();
  if (analyticsClient) analyticsClient.close();
  if (servicesClient) servicesClient.close();
  console.log('✅ gRPC clients closed');
}
