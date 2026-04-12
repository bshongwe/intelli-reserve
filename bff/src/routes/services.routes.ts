import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface ServiceRequest {
  name: string;
  description: string;
  category: string;
  durationMinutes: number;
  basePrice: number;
  maxParticipants: number;
  isActive?: boolean;
}

export interface ServiceResponse {
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

export interface TimeSlotRequest {
  serviceId: string;
  slotDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
}

export interface TimeSlotResponse {
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

export interface RecurringSlotRequest {
  serviceId: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  daysOfWeek: number[]; // 0-6
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

// Validation helpers
function validateServiceRequest(req: ServiceRequest): string | null {
  if (!req.name || req.name.length < 3 || req.name.length > 100) {
    return 'Name must be 3-100 characters';
  }
  if (!req.description || req.description.length < 10 || req.description.length > 1000) {
    return 'Description must be 10-1000 characters';
  }
  if (req.durationMinutes < 15 || req.durationMinutes > 480) {
    return 'Duration must be 15-480 minutes';
  }
  if (req.basePrice < 100) {
    return 'Price must be at least 100 cents';
  }
  if (req.maxParticipants < 1 || req.maxParticipants > 1000) {
    return 'Max participants must be 1-1000';
  }
  return null;
}

export function createServiceRoutes(pool: Pool): Router {
  const router = Router();

  // Create service
  router.post('/', async (req: Request, res: Response) => {
    try {
      const hostId = req.query.hostId as string;
      if (!hostId) {
        return res.status(400).json({ error: 'hostId required' });
      }

      const serviceReq: ServiceRequest = req.body;
      const validationError = validateServiceRequest(serviceReq);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      const id = uuidv4();
      const now = new Date().toISOString();

      const result = await pool.query(
        `INSERT INTO services (id, host_id, name, description, category, duration_minutes, base_price, max_participants, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [id, hostId, serviceReq.name, serviceReq.description, serviceReq.category, serviceReq.durationMinutes, serviceReq.basePrice, serviceReq.maxParticipants, serviceReq.isActive ?? true, now, now]
      );

      const service = result.rows[0];
      res.status(201).json({
        id: service.id,
        hostId: service.host_id,
        name: service.name,
        description: service.description,
        category: service.category,
        durationMinutes: service.duration_minutes,
        basePrice: service.base_price,
        maxParticipants: service.max_participants,
        isActive: service.is_active,
        createdAt: service.created_at,
        updatedAt: service.updated_at,
      });
    } catch (error) {
      console.error('Error creating service:', error);
      res.status(500).json({ error: 'Failed to create service' });
    }
  });

  // Get services for host
  router.get('/', async (req: Request, res: Response) => {
    try {
      const hostId = req.query.hostId as string;
      if (!hostId) {
        return res.status(400).json({ error: 'hostId required' });
      }

      const result = await pool.query(
        `SELECT * FROM services WHERE host_id = $1 ORDER BY created_at DESC`,
        [hostId]
      );

      const services: ServiceResponse[] = result.rows.map((row: any) => ({
        id: row.id,
        hostId: row.host_id,
        name: row.name,
        description: row.description,
        category: row.category,
        durationMinutes: row.duration_minutes,
        basePrice: row.base_price,
        maxParticipants: row.max_participants,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      res.json(services);
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ error: 'Failed to fetch services' });
    }
  });

  // Get time slots for service
  router.get('/time-slots', async (req: Request, res: Response) => {
    try {
      const serviceId = req.query.serviceId as string;
      const slotDate = req.query.date as string;

      if (!serviceId || !slotDate) {
        return res.status(400).json({ error: 'serviceId and date required' });
      }

      const result = await pool.query(
        `SELECT * FROM time_slots WHERE service_id = $1 AND slot_date::text = $2 ORDER BY start_time`,
        [serviceId, slotDate]
      );

      const slots: TimeSlotResponse[] = result.rows.map((row: any) => ({
        id: row.id,
        serviceId: row.service_id,
        slotDate: row.slot_date,
        startTime: row.start_time,
        endTime: row.end_time,
        isAvailable: row.is_available,
        isRecurring: row.is_recurring,
        recurringRuleId: row.recurring_rule_id,
        bookedCount: row.booked_count,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      res.json(slots);
    } catch (error) {
      console.error('Error fetching time slots:', error);
      res.status(500).json({ error: 'Failed to fetch time slots' });
    }
  });

  // Create single time slot
  router.post('/time-slots', async (req: Request, res: Response) => {
    try {
      const slotReq: TimeSlotRequest = req.body;
      const id = uuidv4();
      const now = new Date().toISOString();

      const result = await pool.query(
        `INSERT INTO time_slots (id, service_id, slot_date, start_time, end_time, is_available, is_recurring, booked_count, created_at, updated_at)
        VALUES ($1, $2, $3::date, $4::time, $5::time, $6, $7, $8, $9, $10)
        RETURNING *`,
        [id, slotReq.serviceId, slotReq.slotDate, slotReq.startTime, slotReq.endTime, true, false, 0, now, now]
      );

      const slot = result.rows[0];
      res.status(201).json({
        id: slot.id,
        serviceId: slot.service_id,
        slotDate: slot.slot_date,
        startTime: slot.start_time,
        endTime: slot.end_time,
        isAvailable: slot.is_available,
        isRecurring: slot.is_recurring,
        bookedCount: slot.booked_count,
        createdAt: slot.created_at,
        updatedAt: slot.updated_at,
      });
    } catch (error) {
      console.error('Error creating time slot:', error);
      res.status(500).json({ error: 'Failed to create time slot' });
    }
  });

  // Generate recurring slots
  router.post('/recurring-slots', async (req: Request, res: Response) => {
    try {
      const slotReq: RecurringSlotRequest = req.body;
      const startDate = new Date(slotReq.startDate);
      const endDate = slotReq.endDate ? new Date(slotReq.endDate) : new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);

      let generatedCount = 0;
      const now = new Date().toISOString();

      // Properly iterate through dates
      const current = new Date(startDate);
      while (current <= endDate) {
        const dayOfWeek = current.getDay();

        if (slotReq.daysOfWeek.includes(dayOfWeek)) {
          const id = uuidv4();
          // Format date as YYYY-MM-DD to avoid timezone issues
          const year = current.getFullYear();
          const month = String(current.getMonth() + 1).padStart(2, '0');
          const day = String(current.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;

          await pool.query(
            `INSERT INTO time_slots (id, service_id, slot_date, start_time, end_time, is_available, is_recurring, booked_count, created_at, updated_at)
            VALUES ($1, $2, $3::date, $4::time, $5::time, $6, $7, $8, $9, $10)`,
            [id, slotReq.serviceId, dateStr, slotReq.startTime, slotReq.endTime, true, true, 0, now, now]
          );

          generatedCount++;
        }

        // Move to next day
        current.setDate(current.getDate() + 1);
      }

      res.status(201).json({
        message: `Generated ${generatedCount} recurring slots`,
        count: generatedCount,
      });
    } catch (error) {
      console.error('Error generating recurring slots:', error);
      res.status(500).json({ error: 'Failed to generate recurring slots' });
    }
  });

  // Delete time slot
  router.delete('/time-slots/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await pool.query(`DELETE FROM time_slots WHERE id = $1`, [id]);

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Time slot not found' });
      }

      res.json({ message: 'Time slot deleted' });
    } catch (error) {
      console.error('Error deleting time slot:', error);
      res.status(500).json({ error: 'Failed to delete time slot' });
    }
  });

  // Update time slot availability
  router.patch('/time-slots/:id/availability', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { isAvailable } = req.body;

      if (isAvailable === undefined) {
        return res.status(400).json({ error: 'isAvailable required' });
      }

      const now = new Date().toISOString();
      const result = await pool.query(
        `UPDATE time_slots SET is_available = $1, updated_at = $2 WHERE id = $3`,
        [isAvailable, now, id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Time slot not found' });
      }

      res.json({ message: 'Availability updated' });
    } catch (error) {
      console.error('Error updating availability:', error);
      res.status(500).json({ error: 'Failed to update availability' });
    }
  });

  // Update service
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const serviceReq: Partial<ServiceRequest> = req.body;
      const now = new Date().toISOString();

      // Build dynamic update query
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (serviceReq.name !== undefined) {
        updates.push(`name = $${paramCount}`);
        values.push(serviceReq.name);
        paramCount++;
      }
      if (serviceReq.description !== undefined) {
        updates.push(`description = $${paramCount}`);
        values.push(serviceReq.description);
        paramCount++;
      }
      if (serviceReq.category !== undefined) {
        updates.push(`category = $${paramCount}`);
        values.push(serviceReq.category);
        paramCount++;
      }
      if (serviceReq.durationMinutes !== undefined) {
        updates.push(`duration_minutes = $${paramCount}`);
        values.push(serviceReq.durationMinutes);
        paramCount++;
      }
      if (serviceReq.basePrice !== undefined) {
        updates.push(`base_price = $${paramCount}`);
        values.push(serviceReq.basePrice);
        paramCount++;
      }
      if (serviceReq.maxParticipants !== undefined) {
        updates.push(`max_participants = $${paramCount}`);
        values.push(serviceReq.maxParticipants);
        paramCount++;
      }
      if (serviceReq.isActive !== undefined) {
        updates.push(`is_active = $${paramCount}`);
        values.push(serviceReq.isActive);
        paramCount++;
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updates.push(`updated_at = $${paramCount}`);
      values.push(now);
      paramCount++;

      values.push(id);

      const result = await pool.query(
        `UPDATE services SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Service not found' });
      }

      const service = result.rows[0];
      res.json({
        id: service.id,
        hostId: service.host_id,
        name: service.name,
        description: service.description,
        category: service.category,
        durationMinutes: service.duration_minutes,
        basePrice: service.base_price,
        maxParticipants: service.max_participants,
        isActive: service.is_active,
        createdAt: service.created_at,
        updatedAt: service.updated_at,
      });
    } catch (error) {
      console.error('Error updating service:', error);
      res.status(500).json({ error: 'Failed to update service' });
    }
  });

  // Delete single service
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await pool.query(`DELETE FROM services WHERE id = $1`, [id]);

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Service not found' });
      }

      res.json({ message: 'Service deleted' });
    } catch (error) {
      console.error('Error deleting service:', error);
      res.status(500).json({ error: 'Failed to delete service' });
    }
  });

  // Bulk delete services
  router.post('/bulk/delete', async (req: Request, res: Response) => {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'ids array required' });
      }

      const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
      const result = await pool.query(
        `DELETE FROM services WHERE id IN (${placeholders})`,
        ids
      );

      res.json({
        message: `${result.rowCount} services deleted`,
        count: result.rowCount,
      });
    } catch (error) {
      console.error('Error bulk deleting services:', error);
      res.status(500).json({ error: 'Failed to delete services' });
    }
  });

  // Toggle service status
  router.patch('/services/:id/status', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (isActive === undefined) {
        return res.status(400).json({ error: 'isActive required' });
      }

      const now = new Date().toISOString();
      const result = await pool.query(
        `UPDATE services SET is_active = $1, updated_at = $2 WHERE id = $3 RETURNING *`,
        [isActive, now, id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Service not found' });
      }

      const service = result.rows[0];
      res.json({
        id: service.id,
        hostId: service.host_id,
        name: service.name,
        description: service.description,
        category: service.category,
        durationMinutes: service.duration_minutes,
        basePrice: service.base_price,
        maxParticipants: service.max_participants,
        isActive: service.is_active,
        createdAt: service.created_at,
        updatedAt: service.updated_at,
      });
    } catch (error) {
      console.error('Error toggling service status:', error);
      res.status(500).json({ error: 'Failed to toggle service status' });
    }
  });

  return router;
}

export default createServiceRoutes;
