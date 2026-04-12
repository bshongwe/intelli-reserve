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

export default router;
