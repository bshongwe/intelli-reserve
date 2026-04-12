import { Router } from 'express';
import { z } from 'zod';
import { BookingServiceAdapter } from '../grpc/adapters';

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

    res.status(201).json({
      id: response.booking?.id,
      serviceId: response.booking?.serviceId,
      timeSlotId: response.booking?.timeSlotId,
      hostId: response.booking?.hostId,
      clientName: response.booking?.clientName,
      clientEmail: response.booking?.clientEmail,
      clientPhone: response.booking?.clientPhone,
      numberOfParticipants: response.booking?.numberOfParticipants,
      status: response.booking?.status || 'pending',
      notes: response.booking?.notes,
      createdAt: response.booking?.createdAt,
      updatedAt: response.booking?.updatedAt,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      console.error('Booking error:', error);
      res.status(500).json({ error: 'Failed to create booking', details: error.message });
    }
  }
});

// Get bookings by host ID with optional status filter
router.get('/', async (req, res) => {
  try {
    const { hostId, status } = req.query;

    if (!hostId || typeof hostId !== 'string') {
      return res.status(400).json({ error: 'hostId query parameter required' });
    }

    // Call GetHostBookings with the status filter if provided
    const statusFilter = (typeof status === 'string') ? status : undefined;
    const response = await BookingServiceAdapter.getHostBookings(
      hostId,
      statusFilter
    );

    // Map response to Booking objects
    const bookings = (response.bookings || []).map((booking: any) => ({
      id: booking.id,
      serviceId: booking.serviceId,
      timeSlotId: booking.timeSlotId,
      hostId: booking.hostId,
      clientName: booking.clientName,
      clientEmail: booking.clientEmail,
      clientPhone: booking.clientPhone,
      numberOfParticipants: booking.numberOfParticipants,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    }));

    res.json(bookings);
  } catch (error: any) {
    console.error('Error fetching host bookings:', error);
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
    
    res.json({
      id: response.booking?.id,
      serviceId: response.booking?.serviceId,
      timeSlotId: response.booking?.timeSlotId,
      hostId: response.booking?.hostId,
      clientName: response.booking?.clientName,
      clientEmail: response.booking?.clientEmail,
      clientPhone: response.booking?.clientPhone,
      numberOfParticipants: response.booking?.numberOfParticipants,
      status: response.booking?.status,
      notes: response.booking?.notes,
      createdAt: response.booking?.createdAt,
      updatedAt: response.booking?.updatedAt,
    });
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

    res.json({
      id: response.booking?.id,
      serviceId: response.booking?.serviceId,
      timeSlotId: response.booking?.timeSlotId,
      hostId: response.booking?.hostId,
      clientName: response.booking?.clientName,
      clientEmail: response.booking?.clientEmail,
      clientPhone: response.booking?.clientPhone,
      numberOfParticipants: response.booking?.numberOfParticipants,
      status: response.booking?.status,
      notes: response.booking?.notes,
      createdAt: response.booking?.createdAt,
      updatedAt: response.booking?.updatedAt,
    });
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

    res.json({
      id: response.booking?.id,
      serviceId: response.booking?.serviceId,
      timeSlotId: response.booking?.timeSlotId,
      hostId: response.booking?.hostId,
      clientName: response.booking?.clientName,
      clientEmail: response.booking?.clientEmail,
      clientPhone: response.booking?.clientPhone,
      numberOfParticipants: response.booking?.numberOfParticipants,
      status: response.booking?.status,
      notes: response.booking?.notes,
      createdAt: response.booking?.createdAt,
      updatedAt: response.booking?.updatedAt,
    });
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
