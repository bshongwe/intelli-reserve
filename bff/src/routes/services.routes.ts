import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';
import { ServicesManagementAdapter } from '../grpc/adapters';

const mapService = (s: any) => ({
  id: s.id, hostId: s.host_id, name: s.name, description: s.description,
  category: s.category, durationMinutes: s.duration_minutes, basePrice: s.base_price,
  maxParticipants: s.max_participants, isActive: s.is_active,
  createdAt: s.created_at, updatedAt: s.updated_at,
});

const mapTimeSlot = (ts: any) => ({
  id: ts.id, serviceId: ts.service_id, slotDate: ts.date,
  startTime: ts.start_time, endTime: ts.end_time,
  isAvailable: ts.is_available, isRecurring: false, bookedCount: 0,
  createdAt: ts.created_at, updatedAt: ts.updated_at,
});

export function createServiceRoutes(pool: Pool): Router {
  const router = Router();

  // GET /api/services?hostId=X
  router.get('/', async (req: Request, res: Response) => {
    try {
      const hostId = req.query.hostId as string;
      if (!hostId) return res.status(400).json({ error: 'hostId required' });

      const response = await ServicesManagementAdapter.getHostServices(hostId);
      if (!response.success) return res.status(500).json({ error: response.error_message || 'Failed to fetch services' });

      res.json((response.services || []).map(mapService));
    } catch (error: any) {
      console.error('Error fetching services:', error);
      res.status(500).json({ error: error?.details || error?.message || 'Failed to fetch services' });
    }
  });

  // POST /api/services?hostId=X
  router.post('/', async (req: Request, res: Response) => {
    try {
      const hostId = req.query.hostId as string;
      if (!hostId) return res.status(400).json({ error: 'hostId required' });

      const { name, description, category, durationMinutes, basePrice, maxParticipants, isActive } = req.body;
      const response = await ServicesManagementAdapter.createService(
        hostId, name, description, category, durationMinutes, basePrice, maxParticipants, isActive ?? true
      );
      if (!response.success) return res.status(500).json({ error: response.error_message || 'Failed to create service' });

      res.status(201).json(mapService(response.service));
    } catch (error: any) {
      console.error('Error creating service:', error);
      res.status(500).json({ error: error?.details || error?.message || 'Failed to create service' });
    }
  });

  // PUT /api/services/:id
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description, category, durationMinutes, basePrice, maxParticipants, isActive } = req.body;
      const response = await ServicesManagementAdapter.updateService(id, {
        name, description, category,
        duration_minutes: durationMinutes,
        base_price: basePrice,
        max_participants: maxParticipants,
        is_active: isActive,
      });
      if (!response.success) return res.status(500).json({ error: response.error_message || 'Failed to update service' });

      res.json(mapService(response.service));
    } catch (error: any) {
      console.error('Error updating service:', error);
      res.status(500).json({ error: error?.details || error?.message || 'Failed to update service' });
    }
  });

  // PATCH /api/services/:id  (toggle isActive)
  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      if (isActive === undefined) return res.status(400).json({ error: 'isActive required' });

      const response = await ServicesManagementAdapter.updateService(id, { is_active: isActive });
      if (!response.success) return res.status(500).json({ error: response.error_message || 'Failed to update service' });

      res.json(mapService(response.service));
    } catch (error: any) {
      console.error('Error toggling service status:', error);
      res.status(500).json({ error: error?.details || error?.message || 'Failed to update service' });
    }
  });

  // DELETE /api/services/:id
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const response = await ServicesManagementAdapter.deleteService(id);
      if (!response.success) return res.status(500).json({ error: response.error_message || 'Failed to delete service' });

      res.json({ message: 'Service deleted' });
    } catch (error: any) {
      console.error('Error deleting service:', error);
      res.status(500).json({ error: error?.details || error?.message || 'Failed to delete service' });
    }
  });

  // POST /api/services/bulk/delete  (direct DB — no bulk RPC in proto)
  router.post('/bulk/delete', async (req: Request, res: Response) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ids array required' });

      await Promise.all(ids.map((id: string) => ServicesManagementAdapter.deleteService(id)));
      res.json({ message: `${ids.length} services deleted`, count: ids.length });
    } catch (error: any) {
      console.error('Error bulk deleting services:', error);
      res.status(500).json({ error: error?.details || error?.message || 'Failed to delete services' });
    }
  });

  // ─── Time Slots ──────────────────────────────────────────────────────────────

  // GET /api/services/time-slots?serviceId=X&date=Y
  router.get('/time-slots', async (req: Request, res: Response) => {
    try {
      const { serviceId, date } = req.query;
      if (!serviceId || !date) return res.status(400).json({ error: 'serviceId and date required' });

      const response = await ServicesManagementAdapter.getAvailableTimeSlots(
        serviceId as string, date as string, date as string
      );
      if (!response.success) return res.status(500).json({ error: response.error_message || 'Failed to fetch time slots' });

      res.json((response.time_slots || []).map(mapTimeSlot));
    } catch (error: any) {
      console.error('Error fetching time slots:', error);
      res.status(500).json({ error: error?.details || error?.message || 'Failed to fetch time slots' });
    }
  });

  // POST /api/services/time-slots
  router.post('/time-slots', async (req: Request, res: Response) => {
    try {
      const { serviceId, slotDate, startTime, endTime } = req.body;
      if (!serviceId || !slotDate || !startTime || !endTime) {
        return res.status(400).json({ error: 'serviceId, slotDate, startTime, endTime required' });
      }

      const response = await ServicesManagementAdapter.createTimeSlot(serviceId, slotDate, startTime, endTime, true);
      if (!response.success) return res.status(500).json({ error: response.error_message || 'Failed to create time slot' });

      res.status(201).json(mapTimeSlot(response.time_slot));
    } catch (error: any) {
      console.error('Error creating time slot:', error);
      res.status(500).json({ error: error?.details || error?.message || 'Failed to create time slot' });
    }
  });

  // DELETE /api/services/time-slots/:id
  router.delete('/time-slots/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const response = await ServicesManagementAdapter.deleteTimeSlot(id);
      if (!response.success) return res.status(500).json({ error: response.error_message || 'Failed to delete time slot' });

      res.json({ message: 'Time slot deleted' });
    } catch (error: any) {
      console.error('Error deleting time slot:', error);
      res.status(500).json({ error: error?.details || error?.message || 'Failed to delete time slot' });
    }
  });

  // PATCH /api/services/time-slots/:id/availability
  router.patch('/time-slots/:id/availability', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { isAvailable } = req.body;
      if (isAvailable === undefined) return res.status(400).json({ error: 'isAvailable required' });

      const response = await ServicesManagementAdapter.updateTimeSlotAvailability(id, isAvailable);
      if (!response.success) return res.status(500).json({ error: response.error_message || 'Failed to update availability' });

      res.json({ message: 'Availability updated' });
    } catch (error: any) {
      console.error('Error updating availability:', error);
      res.status(500).json({ error: error?.details || error?.message || 'Failed to update availability' });
    }
  });

  // POST /api/services/recurring-slots  (direct DB — no recurring RPC in proto)
  router.post('/recurring-slots', async (req: Request, res: Response) => {
    try {
      const { serviceId, startTime, endTime, daysOfWeek, startDate, endDate } = req.body;
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000);
      let count = 0;

      const current = new Date(start);
      while (current <= end) {
        if (daysOfWeek.includes(current.getDay())) {
          const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
          const response = await ServicesManagementAdapter.createTimeSlot(serviceId, dateStr, startTime, endTime, true);
          if (response.success) count++;
        }
        current.setDate(current.getDate() + 1);
      }

      res.status(201).json({ message: `Generated ${count} recurring slots`, count });
    } catch (error: any) {
      console.error('Error generating recurring slots:', error);
      res.status(500).json({ error: error?.details || error?.message || 'Failed to generate recurring slots' });
    }
  });

  return router;
}

export default createServiceRoutes;
