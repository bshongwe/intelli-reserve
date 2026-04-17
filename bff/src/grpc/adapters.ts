/**
 * gRPC Service Adapters
 * Translates Express REST endpoints to gRPC service calls
 * Acts as a bridge between REST and gRPC protocols
 */

import {
  bookingService,
  analyticsService,
  servicesManagement,
  inventoryService,
  notificationService,
  identityService,
  escrowService,
} from './client';

/**
 * BOOKING SERVICE ADAPTERS
 */

export const BookingServiceAdapter = {
  async createBooking(
    serviceId: string,
    timeSlotId: string,
    hostId: string,
    clientName: string,
    clientEmail: string,
    clientPhone?: string,
    numberOfParticipants?: number,
    notes?: string
  ) {
    const payload = {
      service_id: serviceId,
      time_slot_id: timeSlotId,
      host_id: hostId,
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone || '',
      number_of_participants: numberOfParticipants || 1,
      notes: notes || '',
    };
    
    console.log('[gRPC Adapter] Creating booking with payload:', JSON.stringify(payload, null, 2));
    
    try {
      const response = await bookingService.createBooking(payload);
      console.log('[gRPC Adapter] Booking creation response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error: any) {
      console.error('[gRPC Adapter] Booking creation error:', error);
      console.error('[gRPC Error Details]', {
        code: error.code,
        message: error.message,
        details: error.details,
        stack: error.stack,
      });
      throw error;
    }
  },

  async getBooking(bookingId: string) {
    return await bookingService.getBooking({
      booking_id: bookingId,
    });
  },

  async getHostBookings(
    hostId: string,
    statusFilter?: string,
    limit: number = 50,
    offset: number = 0
  ) {
    return await bookingService.getHostBookings({
      host_id: hostId,
      status_filter: statusFilter || '',
      limit,
      offset,
    });
  },

  async getClientBookings(
    clientEmail: string,
    statusFilter?: string,
    limit: number = 50,
    offset: number = 0
  ) {
    return await bookingService.getClientBookings({
      client_email: clientEmail,
      status_filter: statusFilter || '',
      limit,
      offset,
    });
  },

  async updateBookingStatus(bookingId: string, newStatus: string) {
    return await bookingService.updateBookingStatus({
      booking_id: bookingId,
      new_status: newStatus,
    });
  },

  async cancelBooking(bookingId: string, reason?: string) {
    return await bookingService.cancelBooking({
      booking_id: bookingId,
      reason: reason || '',
    });
  },

  async deleteBooking(bookingId: string) {
    return await bookingService.deleteBooking({
      booking_id: bookingId,
    });
  },
};

/**
 * ANALYTICS SERVICE ADAPTERS
 */

export const AnalyticsServiceAdapter = {
  async getDashboardMetrics(hostId: string) {
    return await analyticsService.getDashboardMetrics({
      host_id: hostId,
    });
  },

  async getAnalytics(hostId: string, timeRange: string = '6m') {
    return await analyticsService.getAnalytics({
      host_id: hostId,
      time_range: timeRange,
    });
  },

  async getRevenueReport(hostId: string, startDate: string, endDate: string) {
    return await analyticsService.getRevenueReport({
      host_id: hostId,
      start_date: startDate,
      end_date: endDate,
    });
  },

  async getBookingStatistics(hostId: string, timeRange: string = '6m') {
    return await analyticsService.getBookingStatistics({
      host_id: hostId,
      time_range: timeRange,
    });
  },
};

/**
 * SERVICES MANAGEMENT ADAPTERS
 */

export const ServicesManagementAdapter = {
  async getHostServices(hostId: string, onlyActive: boolean = false, limit: number = 50, offset: number = 0) {
    return await servicesManagement.getHostServices({ host_id: hostId, only_active: onlyActive, limit, offset });
  },

  async getBrowseableServices(limit: number = 50, offset: number = 0) {
    return await servicesManagement.getBrowseableServices({ limit, offset });
  },

  async getService(serviceId: string) {
    return await servicesManagement.getService({ service_id: serviceId });
  },

  async createService(hostId: string, name: string, description: string, category: string, durationMinutes: number, basePrice: number, maxParticipants: number, isActive: boolean = true) {
    return await servicesManagement.createService({ host_id: hostId, name, description, category, duration_minutes: durationMinutes, base_price: basePrice, max_participants: maxParticipants, is_active: isActive });
  },

  async updateService(serviceId: string, updates: any) {
    return await servicesManagement.updateService({ service_id: serviceId, ...updates });
  },

  async deleteService(serviceId: string) {
    return await servicesManagement.deleteService({ service_id: serviceId });
  },

  async createTimeSlot(serviceId: string, date: string, startTime: string, endTime: string, isAvailable: boolean = true) {
    return await servicesManagement.createTimeSlot({ service_id: serviceId, date, start_time: startTime, end_time: endTime, is_available: isAvailable });
  },

  async getTimeSlot(timeSlotId: string) {
    return await servicesManagement.getTimeSlot({ time_slot_id: timeSlotId });
  },

  async getAvailableTimeSlots(serviceId: string, dateFrom: string, dateTo: string) {
    return await servicesManagement.getAvailableTimeSlots({ service_id: serviceId, date_from: dateFrom, date_to: dateTo });
  },

  async updateTimeSlotAvailability(timeSlotId: string, isAvailable: boolean) {
    return await servicesManagement.updateTimeSlotAvailability({ time_slot_id: timeSlotId, is_available: isAvailable });
  },

  async deleteTimeSlot(timeSlotId: string) {
    return await servicesManagement.deleteTimeSlot({ time_slot_id: timeSlotId });
  },
};

/**
 * IDENTITY SERVICE ADAPTERS
 */

export const IdentityServiceAdapter = {
  async register(email: string, password: string, fullName: string, userType: string) {
    return identityService.register({ email, password, full_name: fullName, user_type: userType });
  },

  async login(email: string, password: string) {
    return identityService.login({ email, password });
  },

  async getUser(userId: string) {
    return identityService.getUser({ user_id: userId });
  },

  async updateUser(userId: string, fullName: string, phone: string, bio: string, profileImageUrl: string) {
    return identityService.updateUser({ user_id: userId, full_name: fullName, phone, bio, profile_image_url: profileImageUrl });
  },

  async refreshToken(userId: string, refreshToken: string) {
    return identityService.refreshToken({ user_id: userId, refresh_token: refreshToken });
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    return identityService.changePassword({ user_id: userId, current_password: currentPassword, new_password: newPassword });
  },
};

/**
 * NOTIFICATION SERVICE ADAPTERS
 */

export const NotificationServiceAdapter = {
  async sendBookingConfirmation(
    bookingId: string,
    hostId: string,
    clientEmail: string,
    clientName: string,
    serviceName: string,
    slotDate: string,
    startTime: string
  ) {
    return notificationService.sendBookingConfirmation({
      booking_id: bookingId,
      host_id: hostId,
      client_email: clientEmail,
      client_name: clientName,
      service_name: serviceName,
      slot_date: slotDate,
      start_time: startTime,
    });
  },

  async sendBookingCancellation(
    bookingId: string,
    hostId: string,
    clientEmail: string,
    clientName: string,
    serviceName: string,
    reason: string
  ) {
    return notificationService.sendBookingCancellation({
      booking_id: bookingId,
      host_id: hostId,
      client_email: clientEmail,
      client_name: clientName,
      service_name: serviceName,
      reason,
    });
  },
};

/**
 * INVENTORY SERVICE ADAPTERS
 */

export const InventoryServiceAdapter = {
  async createTimeSlot(
    serviceId: string,
    date: string,
    startTime: string,
    endTime: string,
    capacity: number,
    isAvailable: boolean = true
  ) {
    return await inventoryService.createTimeSlot({
      service_id: serviceId,
      date,
      start_time: startTime,
      end_time: endTime,
      capacity,
      is_available: isAvailable,
    });
  },

  async getTimeSlots(serviceId: string, date: string, status?: string) {
    return await inventoryService.getTimeSlots({
      service_id: serviceId,
      date,
      status: status || '',
    });
  },

  async updateOccupancy(timeSlotId: string, bookedCount: number) {
    return await inventoryService.updateOccupancy({
      time_slot_id: timeSlotId,
      booked_count: bookedCount,
    });
  },

  async getAvailability(serviceId: string, dateFrom: string, dateTo: string) {
    return await inventoryService.getAvailability({
      service_id: serviceId,
      date_from: dateFrom,
      date_to: dateTo,
    });
  },

  async blockTimeSlot(timeSlotId: string, reason?: string) {
    return await inventoryService.blockTimeSlot({
      time_slot_id: timeSlotId,
      reason: reason || '',
    });
  },

  async getCapacityStatus(serviceId: string, date: string) {
    return await inventoryService.getCapacityStatus({
      service_id: serviceId,
      date,
    });
  },
};

/**
 * ESCROW SERVICE ADAPTERS
 */

export const EscrowServiceAdapter = {
  async createHold(bookingId: string, hostId: string, clientId: string, grossAmountCents: number, platformFeeCents: number, holdReason: string = 'booking_payment') {
    return await escrowService.createHold({
      booking_id: bookingId,
      host_id: hostId,
      client_id: clientId,
      gross_amount_cents: grossAmountCents,
      platform_fee_cents: platformFeeCents,
      hold_reason: holdReason,
    });
  },

  async getHold(holdId: string) {
    return await escrowService.getHold({
      hold_id: holdId,
    });
  },

  async releaseHold(holdId: string, hostId: string) {
    return await escrowService.releaseHold({
      hold_id: holdId,
      host_id: hostId,
    });
  },

  async refundHold(holdId: string, hostId: string, reason: string = '') {
    return await escrowService.refundHold({
      hold_id: holdId,
      host_id: hostId,
      reason,
    });
  },

  async getEscrowAccount(hostId: string) {
    return await escrowService.getEscrowAccount({
      host_id: hostId,
    });
  },

  async getAvailableBalance(hostId: string) {
    return await escrowService.getAvailableBalance({
      host_id: hostId,
    });
  },

  async requestPayout(hostId: string, amountCents: number, bankAccountToken: string) {
    return await escrowService.requestPayout({
      host_id: hostId,
      amount_cents: amountCents,
      bank_account_token: bankAccountToken,
    });
  },

  async getPayoutStatus(payoutId: string) {
    return await escrowService.getPayoutStatus({
      payout_id: payoutId,
    });
  },

  async getPayoutHistory(hostId: string, limit: number = 50, offset: number = 0) {
    return await escrowService.getPayoutHistory({
      host_id: hostId,
      limit,
      offset,
    });
  },

  async getTransactionHistory(hostId: string, limit: number = 50, offset: number = 0) {
    return await escrowService.getTransactionHistory({
      host_id: hostId,
      limit,
      offset,
    });
  },

  async openDispute(bookingId: string, holdId: string, initiatedByUserId: string, reason: string) {
    return await escrowService.openDispute({
      booking_id: bookingId,
      hold_id: holdId,
      initiated_by_user_id: initiatedByUserId,
      reason,
    });
  },

  async getDisputeStatus(disputeId: string) {
    return await escrowService.getDisputeStatus({
      dispute_id: disputeId,
    });
  },
};
