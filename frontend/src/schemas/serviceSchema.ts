import { z } from "zod";

export const serviceSchema = z.object({
  name: z
    .string()
    .min(3, "Service name must be at least 3 characters")
    .max(100, "Service name must be less than 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be less than 1000 characters"),
  category: z.enum(["Photography", "Consulting", "Workshop", "Coaching", "Other"], {
    errorMap: () => ({ message: "Please select a valid category" }),
  }),
  durationMinutes: z
    .number()
    .min(15, "Duration must be at least 15 minutes")
    .max(480, "Duration must be at most 8 hours (480 minutes)"),
  basePrice: z
    .number()
    .min(100, "Price must be at least R100")
    .max(1000000, "Price seems unusually high"),
  maxParticipants: z
    .number()
    .min(1, "At least 1 participant required")
    .max(1000, "Maximum 1000 participants"),
  isActive: z.boolean().default(true),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;

export const recurringSlotSchema = z.object({
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
  daysOfWeek: z.array(z.number().min(0).max(6)).min(1, "Select at least one day"),
  startDate: z.date(),
  endDate: z.date().optional(),
});

export type RecurringSlotData = z.infer<typeof recurringSlotSchema>;

export const timeSlotSchema = z.object({
  id: z.string(),
  date: z.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  serviceId: z.string(),
  isAvailable: z.boolean().default(true),
  isRecurring: z.boolean().default(false),
});

export type TimeSlot = z.infer<typeof timeSlotSchema>;
