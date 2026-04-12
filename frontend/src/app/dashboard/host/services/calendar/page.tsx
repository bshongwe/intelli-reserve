"use client";

import { useState } from "react";
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
import type { TimeSlot } from "@/schemas/serviceSchema";
import { DraggableTimeSlot } from "@/components/calendar/DraggableTimeSlot";
import { RecurringSlotGenerator } from "@/components/calendar/RecurringSlotGenerator";

const services = [
  { id: "svc-001", name: "Portrait Photography Session", duration: 90, price: 2500 },
  { id: "svc-002", name: "Business Consulting Call", duration: 60, price: 1800 },
  { id: "svc-003", name: "Group Workshop: Digital Marketing", duration: 180, price: 850 },
];

// Mock time slots per date
const mockSlotsByDate: Record<string, TimeSlot[]> = {
  "2026-01-20": [
    { id: "slot-1", date: new Date("2026-01-20"), startTime: "09:00", endTime: "10:30", serviceId: "svc-001", isAvailable: true, isRecurring: false },
    { id: "slot-2", date: new Date("2026-01-20"), startTime: "11:00", endTime: "12:00", serviceId: "svc-001", isAvailable: true, isRecurring: false },
    { id: "slot-3", date: new Date("2026-01-20"), startTime: "14:00", endTime: "15:30", serviceId: "svc-001", isAvailable: false, isRecurring: false },
  ],
  "2026-01-21": [
    { id: "slot-4", date: new Date("2026-01-21"), startTime: "10:00", endTime: "11:00", serviceId: "svc-002", isAvailable: true, isRecurring: false },
    { id: "slot-5", date: new Date("2026-01-21"), startTime: "13:00", endTime: "14:00", serviceId: "svc-002", isAvailable: true, isRecurring: false },
  ],
};

export default function AvailabilityCalendarPage() {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date("2026-01-20"));
  const [selectedServiceId, setSelectedServiceId] = useState(services[0].id);
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [newSlotStart, setNewSlotStart] = useState("09:00");
  const [newSlotEnd, setNewSlotEnd] = useState("10:00");

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load slots for selected date
  const dateKey = date ? format(date, "yyyy-MM-dd") : "";
  const slotsForDate = mockSlotsByDate[dateKey] || [];
  const filteredSlots = slotsForDate.filter((s) => s.serviceId === selectedServiceId);

  const selectedService = services.find((s) => s.id === selectedServiceId);

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = filteredSlots.findIndex((s) => s.id === active.id);
    const newIndex = filteredSlots.findIndex((s) => s.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      arrayMove(filteredSlots, oldIndex, newIndex);
      toast({ title: "Slots reordered", description: `Moved slot to position ${newIndex + 1}` });
    }
  };

  // Add single time slot
  const handleAddSlot = () => {
    if (!date) {
      toast({ title: "Error", description: "Please select a date", variant: "destructive" });
      return;
    }

    const newSlot: TimeSlot = {
      id: `slot-${Date.now()}`,
      date,
      startTime: newSlotStart,
      endTime: newSlotEnd,
      serviceId: selectedServiceId,
      isAvailable: true,
      isRecurring: false,
    };

    const dateKey = format(date, "yyyy-MM-dd");
    if (!mockSlotsByDate[dateKey]) {
      mockSlotsByDate[dateKey] = [];
    }
    mockSlotsByDate[dateKey].push(newSlot);

    toast({
      title: "Slot Added",
      description: `Added slot from ${newSlotStart} to ${newSlotEnd}`,
    });

    setIsAddingSlot(false);
    setNewSlotStart("09:00");
    setNewSlotEnd("10:00");
  };

  // Handle recurring slots generation
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
    const generateUntilDate = endDate || new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year if no end date
    const generatedSlots: TimeSlot[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= generateUntilDate) {
      if (daysOfWeek.includes(currentDate.getDay())) {
        const dateKey = format(currentDate, "yyyy-MM-dd");
        
        const newSlot: TimeSlot = {
          id: `slot-${Date.now()}-${currentDate.getTime()}`,
          date: new Date(currentDate),
          startTime,
          endTime,
          serviceId: selectedServiceId,
          isAvailable: true,
          isRecurring: true,
        };

        if (!mockSlotsByDate[dateKey]) {
          mockSlotsByDate[dateKey] = [];
        }
        mockSlotsByDate[dateKey].push(newSlot);
        generatedSlots.push(newSlot);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    toast({
      title: "Recurring Slots Generated",
      description: `Created ${generatedSlots.length} recurring time slots`,
    });
  };

  // Handle slot deletion
  const handleDeleteSlot = (slotId: string) => {
    const dateKey = format(date || new Date(), "yyyy-MM-dd");
    if (mockSlotsByDate[dateKey]) {
      mockSlotsByDate[dateKey] = mockSlotsByDate[dateKey].filter((s) => s.id !== slotId);
      toast({ title: "Slot Deleted", variant: "destructive" });
    }
  };

  // Handle toggle availability
  const handleToggleAvailability = (slotId: string) => {
    const dateKey = format(date || new Date(), "yyyy-MM-dd");
    if (mockSlotsByDate[dateKey]) {
      const slot = mockSlotsByDate[dateKey].find((s) => s.id === slotId);
      if (slot) {
        slot.isAvailable = !slot.isAvailable;
        toast({
          title: slot.isAvailable ? "Slot Unblocked" : "Slot Blocked",
          description: `${slot.startTime} - ${slot.endTime}`,
        });
      }
    }
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
                        price={selectedService?.price || 0}
                        duration={selectedService?.duration || 0}
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
