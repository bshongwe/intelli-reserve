/**
 * Service Validation Module
 * Centralized validation logic for service and time slot requests
 */

export interface ServiceRequest {
  name: string;
  description: string;
  category: string;
  durationMinutes: number;
  basePrice: number;
  maxParticipants: number;
  isActive?: boolean;
}

export interface TimeSlotRequest {
  serviceId: string;
  slotDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
}

export interface RecurringSlotRequest {
  serviceId: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  daysOfWeek: number[]; // 0-6
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

export class ValidationError extends Error {
  constructor(public message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate service creation request
 */
export function validateServiceRequest(req: ServiceRequest): void {
  if (!req.name || req.name.length < 3 || req.name.length > 100) {
    throw new ValidationError('Name must be 3-100 characters');
  }
  if (!req.description || req.description.length < 10 || req.description.length > 1000) {
    throw new ValidationError('Description must be 10-1000 characters');
  }
  if (req.durationMinutes < 15 || req.durationMinutes > 480) {
    throw new ValidationError('Duration must be 15-480 minutes');
  }
  if (req.basePrice < 100) {
    throw new ValidationError('Price must be at least 100 cents');
  }
  if (req.maxParticipants < 1 || req.maxParticipants > 1000) {
    throw new ValidationError('Max participants must be 1-1000');
  }
}

/**
 * Validate time slot request
 */
export function validateTimeSlotRequest(req: TimeSlotRequest): void {
  if (!req.serviceId) {
    throw new ValidationError('Service ID is required');
  }
  if (!req.slotDate || !/^\d{4}-\d{2}-\d{2}$/.test(req.slotDate)) {
    throw new ValidationError('Valid slot date (YYYY-MM-DD) is required');
  }
  if (!req.startTime || !/^\d{2}:\d{2}$/.test(req.startTime)) {
    throw new ValidationError('Valid start time (HH:MM) is required');
  }
  if (!req.endTime || !/^\d{2}:\d{2}$/.test(req.endTime)) {
    throw new ValidationError('Valid end time (HH:MM) is required');
  }
  
  // Validate time range
  const [startHour, startMin] = req.startTime.split(':').map(Number);
  const [endHour, endMin] = req.endTime.split(':').map(Number);
  const startTimeMs = startHour * 60 + startMin;
  const endTimeMs = endHour * 60 + endMin;
  
  if (startTimeMs >= endTimeMs) {
    throw new ValidationError('End time must be after start time');
  }
}

/**
 * Validate recurring slots request
 */
export function validateRecurringSlotRequest(req: RecurringSlotRequest): void {
  validateTimeSlotRequest({
    serviceId: req.serviceId,
    slotDate: req.startDate,
    startTime: req.startTime,
    endTime: req.endTime,
  });
  
  if (!Array.isArray(req.daysOfWeek) || req.daysOfWeek.length === 0) {
    throw new ValidationError('At least one day of week is required (0-6)');
  }
  
  if (!req.daysOfWeek.every(day => day >= 0 && day <= 6)) {
    throw new ValidationError('Days of week must be between 0 (Sunday) and 6 (Saturday)');
  }
  
  if (req.endDate && new Date(req.endDate) < new Date(req.startDate)) {
    throw new ValidationError('End date must be after start date');
  }
}
