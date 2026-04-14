import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

/**
 * gRPC Client Configuration
 * Handles all communication with backend microservices via gRPC
 */

const PROTO_PATH = path.join(__dirname, '../../..', 'backend/proto');
const BACKEND_URL = process.env.BACKEND_GRPC_URL || 'localhost:8090';
const ANALYTICS_URL = process.env.ANALYTICS_GRPC_URL || 'localhost:8091';
const INVENTORY_URL = process.env.INVENTORY_GRPC_URL || 'localhost:8092';
const SERVICES_URL = process.env.SERVICES_GRPC_URL || 'localhost:8093';

// Package definitions
let bookingPackageDef: any;
let analyticsPackageDef: any;
let servicesPackageDef: any;
let inventoryPackageDef: any;

// gRPC clients
let bookingClient: any;
let analyticsClient: any;
let servicesClient: any;
let inventoryClient: any;

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

    inventoryPackageDef = protoLoader.loadSync(path.join(PROTO_PATH, 'inventory.proto'), {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      includeDirs: [PROTO_PATH],
    });

    // Get gRPC service descriptors
    const bookingGrpcObj = grpc.loadPackageDefinition(bookingPackageDef) as any;
    const analyticsGrpcObj = grpc.loadPackageDefinition(analyticsPackageDef) as any;
    const servicesGrpcObj = grpc.loadPackageDefinition(servicesPackageDef) as any;
    const inventoryGrpcObj = grpc.loadPackageDefinition(inventoryPackageDef) as any;

    // Create clients
    const BookingService = bookingGrpcObj.intelli_reserve.booking.BookingService;
    const AnalyticsService = analyticsGrpcObj.intelli_reserve.analytics.AnalyticsService;
    const ServicesManagement = servicesGrpcObj.intelli_reserve.services.ServicesManagement;
    const InventoryService = inventoryGrpcObj.intelli_reserve.inventory.InventoryService;

    bookingClient = new BookingService(BACKEND_URL, grpc.credentials.createInsecure());
    analyticsClient = new AnalyticsService(ANALYTICS_URL, grpc.credentials.createInsecure());
    servicesClient = new ServicesManagement(SERVICES_URL, grpc.credentials.createInsecure());
    inventoryClient = new InventoryService(INVENTORY_URL, grpc.credentials.createInsecure());

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
    console.log('[gRPC Client] CreateBooking called with:', JSON.stringify(request, null, 2));
    const method = promisifyGRPCMethod(bookingClient, 'CreateBooking');
    try {
      const result = await method(request);
      console.log('[gRPC Client] CreateBooking response:', JSON.stringify(result, null, 2));
      return result;
    } catch (error: any) {
      console.error('[gRPC Client] CreateBooking error:', error);
      throw error;
    }
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
 * INVENTORY SERVICE METHODS
 */

export const inventoryService = {
  createTimeSlot: async (request: any) => {
    const method = promisifyGRPCMethod(inventoryClient, 'CreateTimeSlot');
    return method(request);
  },

  getTimeSlots: async (request: any) => {
    const method = promisifyGRPCMethod(inventoryClient, 'GetTimeSlots');
    return method(request);
  },

  updateOccupancy: async (request: any) => {
    const method = promisifyGRPCMethod(inventoryClient, 'UpdateOccupancy');
    return method(request);
  },

  getAvailability: async (request: any) => {
    const method = promisifyGRPCMethod(inventoryClient, 'GetAvailability');
    return method(request);
  },

  blockTimeSlot: async (request: any) => {
    const method = promisifyGRPCMethod(inventoryClient, 'BlockTimeSlot');
    return method(request);
  },

  getCapacityStatus: async (request: any) => {
    const method = promisifyGRPCMethod(inventoryClient, 'GetCapacityStatus');
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
  if (inventoryClient) inventoryClient.close();
  console.log('✅ gRPC clients closed');
}

