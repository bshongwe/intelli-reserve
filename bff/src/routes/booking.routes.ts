import { Router } from 'express';
import { z } from 'zod';
import axios from 'axios';

const router = Router();

const CreateBookingSchema = z.object({
  inventoryId: z.string(),
  slotStart: z.string().datetime(),
  userId: z.string(),
  tenantId: z.string(),
});

router.post('/', async (req, res) => {
  try {
    const validated = CreateBookingSchema.parse(req.body);

    // Call backend Booking Service (gRPC or REST – here using REST for simplicity)
    const response = await axios.post('http://localhost:8080/v1/bookings', validated, {
      headers: { 'X-Request-ID': req.headers['x-request-id'] || crypto.randomUUID() }
    });

    res.status(201).json({
      bookingId: response.data.bookingId,
      status: 'INITIATED',
      message: 'Booking saga started. Check status for updates.'
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create booking' });
    }
  }
});

export default router;
