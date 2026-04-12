"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Clock } from "lucide-react";

const services = [
  { id: "svc-001", name: "Portrait Photography Session", duration: 90, price: 2500 },
  { id: "svc-002", name: "Business Consulting Call", duration: 60, price: 1800 },
  { id: "svc-003", name: "Group Workshop: Digital Marketing", duration: 180, price: 850 },
];

export default function AvailabilityCalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedServiceId, setSelectedServiceId] = useState(services[0].id);

  const selectedService = services.find((s) => s.id === selectedServiceId);

  // Mock available slots for the selected date
  const availableSlots = ["09:00", "10:30", "13:00", "14:30", "16:00"];

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-4 sm:py-6 px-3 sm:px-4 md:px-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Availability Calendar</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Manage time slots for your services</p>
        </div>
        <Button className="w-full sm:w-auto text-xs sm:text-sm">
          Add Custom Block / Unavailability
        </Button>
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
                  {date ? format(date, "MMMM dd, yyyy") : "Select a date"}
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
          <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableSlots.map((time) => (
                <div
                  key={time}
                  className="border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xl font-semibold">{time}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Available
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedService?.duration} min • R{selectedService?.price}
                  </p>
                  <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="outline" className="text-xs flex-1">
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" className="text-xs flex-1">
                      Block
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {availableSlots.length === 0 && (
              <div className="text-center py-12 text-xs sm:text-sm text-muted-foreground">
                No available slots for this date. Add new slots manually.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Quick Slot Management</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button className="flex-1 text-xs sm:text-sm">Generate Recurring Slots (Weekly)</Button>
          <Button variant="outline" className="flex-1 text-xs sm:text-sm">
            Import from Google Calendar
          </Button>
          <Button variant="outline" className="flex-1 text-xs sm:text-sm">
            Set Recurring Unavailability
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
