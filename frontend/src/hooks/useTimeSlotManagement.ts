import { useState, useCallback, useMemo } from "react";
import { TimeSlot } from "@/schemas/serviceSchema";

interface UseTimeSlotManagementProps {
  initialSlots?: TimeSlot[];
  selectedDate: Date;
  selectedServiceId: string;
}

export function useTimeSlotManagement({
  initialSlots = [],
  selectedDate,
  selectedServiceId,
}: UseTimeSlotManagementProps) {
  const [slots, setSlots] = useState<TimeSlot[]>(initialSlots);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [blockedTimes, setBlockedTimes] = useState<string[]>([]);

  // Filter slots for selected date and service
  const slotsForSelectedDate = useMemo(() => {
    return slots.filter(
      (slot) =>
        slot.serviceId === selectedServiceId &&
        slot.date.toDateString() === selectedDate.toDateString()
    );
  }, [slots, selectedDate, selectedServiceId]);

  // Add a new slot
  const addSlot = useCallback(
    (startTime: string, endTime: string) => {
      const newSlot: TimeSlot = {
        id: `slot-${Date.now()}`,
        date: selectedDate,
        startTime,
        endTime,
        serviceId: selectedServiceId,
        isAvailable: true,
        isRecurring: false,
      };
      setSlots((prev) => [...prev, newSlot]);
      return newSlot;
    },
    [selectedDate, selectedServiceId]
  );

  // Update slot time
  const updateSlotTime = useCallback(
    (slotId: string, startTime: string, endTime: string) => {
      setSlots((prev) =>
        prev.map((slot) =>
          slot.id === slotId ? { ...slot, startTime, endTime } : slot
        )
      );
    },
    []
  );

  // Delete slot
  const deleteSlot = useCallback((slotId: string) => {
    setSlots((prev) => prev.filter((slot) => slot.id !== slotId));
  }, []);

  // Toggle slot availability
  const toggleSlotAvailability = useCallback((slotId: string) => {
    setSlots((prev) =>
      prev.map((slot) =>
        slot.id === slotId ? { ...slot, isAvailable: !slot.isAvailable } : slot
      )
    );
  }, []);

  // Block a time range
  const blockTimeRange = useCallback((startTime: string, endTime: string) => {
    setBlockedTimes((prev) => [...prev, `${startTime}-${endTime}`]);
    // Also mark all slots in this range as unavailable
    setSlots((prev) =>
      prev.map((slot) => {
        if (
          slot.date.toDateString() === selectedDate.toDateString() &&
          slot.serviceId === selectedServiceId &&
          slot.startTime >= startTime &&
          slot.endTime <= endTime
        ) {
          return { ...slot, isAvailable: false };
        }
        return slot;
      })
    );
  }, [selectedDate, selectedServiceId]);

  // Unblock a time range
  const unblockTimeRange = useCallback((startTime: string, endTime: string) => {
    setBlockedTimes((prev) => prev.filter((t) => t !== `${startTime}-${endTime}`));
  }, []);

  // Reorder slots (for drag-and-drop)
  const reorderSlots = useCallback((slotIds: string[]) => {
    const slotsMap = new Map(slots.map((s) => [s.id, s]));
    const reorderedSlots = slotIds
      .map((id) => slotsMap.get(id))
      .filter((s): s is TimeSlot => s !== undefined);

    const otherSlots = slots.filter((s) => !slotIds.includes(s.id));
    setSlots([...reorderedSlots, ...otherSlots]);
  }, [slots]);

  return {
    slots: slotsForSelectedDate,
    allSlots: slots,
    blockedTimes,
    activeId,
    setActiveId,
    addSlot,
    updateSlotTime,
    deleteSlot,
    toggleSlotAvailability,
    blockTimeRange,
    unblockTimeRange,
    reorderSlots,
  };
}
