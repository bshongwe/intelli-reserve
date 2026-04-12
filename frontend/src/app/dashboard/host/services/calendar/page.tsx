"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { servicesAPI, timeSlotsAPI } from "@/lib/api";
import { DraggableTimeSlot } from "@/components/calendar/DraggableTimeSlot";
import { RecurringSlotGenerator } from "@/components/calendar/RecurringSlotGenerator";

export default function AvailabilityCalendarPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // TODO: Replace with actual auth integration to get real hostId
  const hostId = "host-001";

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>();
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [newSlotStart, setNewSlotStart] = useState("09:00");
  const [newSlotEnd, setNewSlotEnd] = useState("10:00");

  // Fetch services
  const { data: services = [] } = useQuery({
    queryKey: ["host-services", hostId],
    queryFn: () => servicesAPI.getHostServices(hostId),
  });

  // Set first service as default when services load
  useEffect(() => {
    if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  // Fetch time slots for selected date and service
  const dateKey = date ? format(date, "yyyy-MM-dd") : "";
  const { data: apiSlots = [] } = useQuery({
    queryKey: ["time-slots", selectedServiceId, dateKey],
    queryFn: () => selectedServiceId && dateKey ? timeSlotsAPI.getTimeSlots(selectedServiceId, dateKey) : Promise.resolve([]),
    enabled: !!selectedServiceId && !!dateKey,
  });

  // Transform API slots to schema format (convert slotDate string to date Date object)
  const filteredSlots = apiSlots.map((slot) => ({
    ...slot,
    date: new Date(slot.slotDate),
  }));

  const selectedService = services.find((s) => s.id === selectedServiceId);

  // Mutation: Add single time slot
  const addSlotMutation = useMutation({
    mutationFn: () => {
      if (!date || !selectedServiceId) {
        throw new Error("Date and service must be selected");
      }
      return timeSlotsAPI.createTimeSlot(
        selectedServiceId,
        format(date, "yyyy-MM-dd"),
        newSlotStart,
        newSlotEnd
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["time-slots", selectedServiceId, dateKey],
      });
      toast({
        title: "Slot Added",
        description: `Added slot from ${newSlotStart} to ${newSlotEnd}`,
      });
      setIsAddingSlot(false);
      setNewSlotStart("09:00");
      setNewSlotEnd("10:00");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add slot",
        variant: "destructive",
      });
    },
  });

  // Mutation: Delete time slot
  const deleteSlotMutation = useMutation({
    mutationFn: (slotId: string) => timeSlotsAPI.deleteTimeSlot(slotId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["time-slots", selectedServiceId, dateKey],
      });
      toast({ title: "Slot Deleted", variant: "destructive" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete slot",
        variant: "destructive",
      });
    },
  });

  // Mutation: Toggle time slot availability
  const toggleAvailabilityMutation = useMutation({
    mutationFn: (slotId: string) => {
      const slot = filteredSlots.find((s) => s.id === slotId);
      if (!slot) throw new Error("Slot not found");
      return timeSlotsAPI.updateTimeSlotAvailability(slotId, !slot.isAvailable);
    },
    onSuccess: (_, slotId) => {
      const slot = filteredSlots.find((s) => s.id === slotId);
      queryClient.invalidateQueries({
        queryKey: ["time-slots", selectedServiceId, dateKey],
      });
      toast({
        title: slot?.isAvailable ? "Slot Blocked" : "Slot Unblocked",
        description: `${slot?.startTime} - ${slot?.endTime}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update slot availability",
        variant: "destructive",
      });
    },
  });

  // Mutation: Create recurring slots
  const createRecurringMutation = useMutation({
    mutationFn: ({
      startTime,
      endTime,
      daysOfWeek,
      startDate,
      endDate,
    }: {
      startTime: string;
      endTime: string;
      daysOfWeek: number[];
      startDate: Date;
      endDate?: Date;
    }) => {
      if (!selectedServiceId) throw new Error("Service must be selected");
      return timeSlotsAPI.createRecurringSlots(
        selectedServiceId,
        startTime,
        endTime,
        daysOfWeek,
        format(startDate, "yyyy-MM-dd"),
        endDate ? format(endDate, "yyyy-MM-dd") : undefined
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["time-slots", selectedServiceId, dateKey],
      });
      toast({
        title: "Recurring Slots Generated",
        description: `Created ${data.count} recurring time slots`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create recurring slots",
        variant: "destructive",
      });
    },
  });

  // Mutation: Reorder time slots
  const reorderSlotsMutation = useMutation({
    mutationFn: (slots: typeof filteredSlots) => {
      if (!selectedServiceId) throw new Error("Service must be selected");
      // Send the new order to the API
      return timeSlotsAPI.reorderTimeSlots(selectedServiceId, slots.map(s => s.id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["time-slots", selectedServiceId, dateKey],
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reorder slots",
        variant: "destructive",
      });
    },
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Handle drag end - Note: re-ordering would require additional API endpoint
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = filteredSlots.findIndex((s) => s.id === active.id);
    const newIndex = filteredSlots.findIndex((s) => s.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedSlots = arrayMove([...filteredSlots], oldIndex, newIndex);
      reorderSlotsMutation.mutate(reorderedSlots);
      toast({ title: "Slots reordered", description: `Moved slot to position ${newIndex + 1}` });
    }
  };

  // Handle add slot
  const handleAddSlot = () => {
    if (!date) {
      toast({ title: "Error", description: "Please select a date", variant: "destructive" });
      return;
    }
    addSlotMutation.mutate();
  };

  // Handle delete slot
  const handleDeleteSlot = (slotId: string) => {
    deleteSlotMutation.mutate(slotId);
  };

  // Handle toggle availability
  const handleToggleAvailability = (slotId: string) => {
    toggleAvailabilityMutation.mutate(slotId);
  };

  // Handle generate recurring slots
  const handleGenerateRecurringSlots = ({
    startTime,
    endTime,
    daysOfWeek,
    startDate,
    endDate,
  }: {
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
    startDate: Date;
    endDate?: Date;
  }) => {
    createRecurringMutation.mutate({
      startTime,
      endTime,
      daysOfWeek,
      startDate,
      endDate,
    });
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-4 sm:py-6 px-3 sm:px-4 md:px-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Availability Calendar</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Manage and organize time slots for your services</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Picker */}
        <Card className="lg:col-span-5 overflow-hidden">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Select Date</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </div>
          </CardContent>
        </Card>

        {/* Slots & Management */}
        <Card className="lg:col-span-7 overflow-hidden">
          <CardHeader className="pb-4 sm:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl">Time Slots</CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">
                  {date ? format(date, "MMMM dd, yyyy") : "Select a date"} • {filteredSlots.length} {filteredSlots.length === 1 ? "slot" : "slots"}
                </CardDescription>
              </div>
              <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                <SelectTrigger className="w-full sm:w-72">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6 space-y-4">
            {/* Add Slot Dialog */}
            <Dialog open={isAddingSlot} onOpenChange={setIsAddingSlot}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 text-xs sm:text-sm w-full sm:w-auto">
                  <Plus className="h-3.5 w-3.5" />
                  Add Single Slot
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md mx-3">
                <DialogHeader>
                  <DialogTitle className="text-lg">Add Time Slot</DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    Add a single time slot for {date ? format(date, "MMMM dd, yyyy") : "selected date"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-time" className="text-xs sm:text-sm">Start Time</Label>
                      <Input
                        id="start-time"
                        type="time"
                        value={newSlotStart}
                        onChange={(e) => setNewSlotStart(e.target.value)}
                        className="text-xs sm:text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-time" className="text-xs sm:text-sm">End Time</Label>
                      <Input
                        id="end-time"
                        type="time"
                        value={newSlotEnd}
                        onChange={(e) => setNewSlotEnd(e.target.value)}
                        className="text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddSlot} className="w-full text-xs sm:text-sm">
                    Add Slot
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Draggable Slots */}
            {filteredSlots.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredSlots.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {filteredSlots.map((slot) => (
                      <DraggableTimeSlot
                        key={slot.id}
                        slot={slot}
                        price={selectedService?.basePrice || 0}
                        duration={selectedService?.durationMinutes || 0}
                        onDelete={() => handleDeleteSlot(slot.id)}
                        onToggleAvailability={() => handleToggleAvailability(slot.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="text-center py-8 text-xs sm:text-sm text-muted-foreground">
                No time slots for this date. Add a slot or generate recurring slots.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recurring Slots Generator */}
      <Card>
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Batch Operations</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Generate multiple slots at once</CardDescription>
        </CardHeader>
        <CardContent>
          <RecurringSlotGenerator
            onGenerateSlots={handleGenerateRecurringSlots}
            isLoading={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
