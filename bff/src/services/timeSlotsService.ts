/**
 * Time Slots Service
 * Business logic for time slot operations
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { TimeSlotRequest, RecurringSlotRequest } from '../lib/validation';

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

class TimeSlotsService {
  constructor(private readonly pool: Pool) {}

  /**
   * Get time slots for a specific service and date
   */
  async getSlots(serviceId: string, slotDate: string): Promise<TimeSlotResponse[]> {
    const result = await this.pool.query(
      `SELECT * FROM time_slots 
       WHERE service_id = $1 AND slot_date = $2::date 
       ORDER BY start_time ASC`,
      [serviceId, slotDate]
    );

    return result.rows.map(this.mapRowToResponse);
  }

  /**
   * Create a single time slot
   */
  async createSlot(slotReq: TimeSlotRequest): Promise<TimeSlotResponse> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const result = await this.pool.query(
      `INSERT INTO time_slots (
        id, service_id, slot_date, start_time, end_time, 
        is_available, is_recurring, booked_count, created_at, updated_at
      ) VALUES ($1, $2, $3::date, $4::time, $5::time, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        id, 
        slotReq.serviceId, 
        slotReq.slotDate, 
        slotReq.startTime, 
        slotReq.endTime, 
        true,  // is_available
        false, // is_recurring
        0,     // booked_count
        now, 
        now
      ]
    );

    return this.mapRowToResponse(result.rows[0]);
  }

  /**
   * Create recurring time slots
   */
  async createRecurringSlots(slotReq: RecurringSlotRequest): Promise<{ count: number }> {
    const startDate = new Date(slotReq.startDate);
    const endDate = slotReq.endDate 
      ? new Date(slotReq.endDate) 
      : new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);

    let generatedCount = 0;
    const now = new Date().toISOString();

    // Iterate through date range
    for (let current = new Date(startDate); current <= endDate; current.setDate(current.getDate() + 1)) {
      const dayOfWeek = current.getDay();

      // Skip if not in requested days of week
      if (!slotReq.daysOfWeek.includes(dayOfWeek)) {
        continue;
      }

      const id = uuidv4();
      const dateStr = current.toISOString().split('T')[0];

      try {
        await this.pool.query(
          `INSERT INTO time_slots (
            id, service_id, slot_date, start_time, end_time, 
            is_available, is_recurring, booked_count, created_at, updated_at
          ) VALUES ($1, $2, $3::date, $4::time, $5::time, $6, $7, $8, $9, $10)`,
          [
            id,
            slotReq.serviceId,
            dateStr,
            slotReq.startTime,
            slotReq.endTime,
            true,  // is_available
            true,  // is_recurring
            0,     // booked_count
            now,
            now
          ]
        );

        generatedCount++;
      } catch (error) {
        console.error(`Error creating recurring slot for ${dateStr}:`, error);
        // Continue with next date even if one fails
      }
    }

    return { count: generatedCount };
  }

  /**
   * Update time slot availability
   */
  async updateAvailability(slotId: string, isAvailable: boolean): Promise<TimeSlotResponse> {
    const now = new Date().toISOString();

    const result = await this.pool.query(
      `UPDATE time_slots 
       SET is_available = $1, updated_at = $2 
       WHERE id = $3 
       RETURNING *`,
      [isAvailable, now, slotId]
    );

    if (result.rows.length === 0) {
      throw new Error('Time slot not found');
    }

    return this.mapRowToResponse(result.rows[0]);
  }

  /**
   * Delete a time slot
   */
  async deleteSlot(slotId: string): Promise<void> {
    const result = await this.pool.query(
      `DELETE FROM time_slots WHERE id = $1`,
      [slotId]
    );

    if (result.rowCount === 0) {
      throw new Error('Time slot not found');
    }
  }

  /**
   * Map database row to response object
   */
  private mapRowToResponse(row: any): TimeSlotResponse {
    return {
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
    };
  }
}

export default TimeSlotsService;
