import { Router } from 'express';
import { z } from 'zod';
import { BookingServiceAdapter, NotificationServiceAdapter, ServicesManagementAdapter } from '../grpc/adapters';

const router = Router();

const CreateBookingSchema = z.object({
  serviceId: z.string(),
  timeSlotId: z.string(),
  hostId: z.string(),
  clientName: z.string(),
  clientEmail: z.string(),
  clientPhone: z.string().optional(),
  numberOfParticipants: z.number().optional(),
  notes: z.string().optional(),
});

const UpdateBookingStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
});

const CancelBookingSchema = z.object({
  reason: z.string().optional(),
});

const mapBooking = (booking: any) => ({
  id: booking.id,
  serviceId: booking.service_id ?? booking.serviceId,
  timeSlotId: booking.time_slot_id ?? booking.timeSlotId,
  hostId: booking.host_id ?? booking.hostId,
  clientName: booking.client_name ?? booking.clientName,
  clientEmail: booking.client_email ?? booking.clientEmail,
  clientPhone: booking.client_phone ?? booking.clientPhone,
  numberOfParticipants: booking.number_of_participants ?? booking.numberOfParticipants,
  status: booking.status,
  notes: booking.notes,
  createdAt: booking.created_at ?? booking.createdAt,
  updatedAt: booking.updated_at ?? booking.updatedAt,
});

router.post('/', async (req, res) => {
  try {
    const validated = CreateBookingSchema.parse(req.body);

    // Call backend Booking Service via gRPC
    const response = await BookingServiceAdapter.createBooking(
      validated.serviceId,
      validated.timeSlotId,
      validated.hostId,
      validated.clientName,
      validated.clientEmail,
      validated.clientPhone,
      validated.numberOfParticipants,
      validated.notes
    );

    res.status(201).json(mapBooking(response.booking));
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      console.error('Booking error:', error);
      res.status(500).json({ error: 'Failed to create booking', details: error.message });
    }
  }
});

// Get bookings by hostId or clientEmail with optional status filter
router.get('/', async (req, res) => {
  try {
    const { hostId, clientEmail, status } = req.query;
    const statusFilter = typeof status === 'string' ? status : undefined;

    if (typeof clientEmail === 'string') {
      const response = await BookingServiceAdapter.getClientBookings(clientEmail, statusFilter);
      return res.json((response.bookings || []).map(mapBooking));
    }

    if (typeof hostId === 'string') {
      const response = await BookingServiceAdapter.getHostBookings(hostId, statusFilter);
      return res.json((response.bookings || []).map(mapBooking));
    }

    return res.status(400).json({ error: 'hostId or clientEmail query parameter required' });
  } catch (error: any) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings', details: error.message });
  }
});

// Get booking by ID
router.get('/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID required' });
    }

    const response = await BookingServiceAdapter.getBooking(bookingId);
    
    res.json(mapBooking(response.booking));
  } catch (error: any) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking', details: error.message });
  }
});

// Update booking status (confirm, complete, etc.)
router.put('/:bookingId/status', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const validated = UpdateBookingStatusSchema.parse(req.body);

    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID required' });
    }

    const response = await BookingServiceAdapter.updateBookingStatus(bookingId, validated.status);
    const booking = response.booking;

    // Fire notification asynchronously on terminal status changes — don't block the response
    if (validated.status === 'confirmed' && booking) {
      ServicesManagementAdapter.getService(booking.service_id ?? booking.serviceId)
        .then((svcRes: any) => {
          const svc = svcRes.service;
          return NotificationServiceAdapter.sendBookingConfirmation(
            bookingId,
            booking.host_id ?? booking.hostId,
            booking.client_email ?? booking.clientEmail,
            booking.client_name ?? booking.clientName,
            svc?.name ?? 'Service',
            booking.slot_date ?? '',
            booking.start_time ?? ''
          );
        })
        .catch((err: any) => console.error('[Notification] Failed to send confirmation:', err));
    }

    res.json(mapBooking(booking));
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      console.error('Error updating booking status:', error);
      res.status(500).json({ error: 'Failed to update booking status', details: error.message });
    }
  }
});

// Cancel booking
router.post('/:bookingId/cancel', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const validated = CancelBookingSchema.parse(req.body);

    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID required' });
    }

    const response = await BookingServiceAdapter.cancelBooking(bookingId, validated.reason);
    const booking = response.booking;

    // Fire cancellation notification asynchronously
    if (booking) {
      ServicesManagementAdapter.getService(booking.service_id ?? booking.serviceId)
        .then((svcRes: any) => {
          const svc = svcRes.service;
          return NotificationServiceAdapter.sendBookingCancellation(
            bookingId,
            booking.host_id ?? booking.hostId,
            booking.client_email ?? booking.clientEmail,
            booking.client_name ?? booking.clientName,
            svc?.name ?? 'Service',
            validated.reason ?? 'No reason provided'
          );
        })
        .catch((err: any) => console.error('[Notification] Failed to send cancellation:', err));
    }

    res.json(mapBooking(booking));
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      console.error('Error cancelling booking:', error);
      res.status(500).json({ error: 'Failed to cancel booking', details: error.message });
    }
  }
});

export default router;
