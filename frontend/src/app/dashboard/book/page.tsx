"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, CreditCard, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { bookingsAPI, servicesAPI, timeSlotsAPI, type Service, type TimeSlot } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { format } from "date-fns";

export default function BookPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<{ id: string; service: Service; date: Date; slot: TimeSlot } | null>(null);

  // Fetch all active services
  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["browse-services"],
    queryFn: () => servicesAPI.getAllServices(),
  });

  // Fetch time slots when service + date are both selected
  const dateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const { data: timeSlots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ["time-slots", selectedService?.id, dateKey],
    queryFn: () => timeSlotsAPI.getTimeSlots(selectedService!.id, dateKey),
    enabled: !!selectedService && !!dateKey,
  });

  const availableSlots = timeSlots.filter((s) => s.isAvailable);

  const bookingMutation = useMutation({
    mutationFn: () =>
      bookingsAPI.createBooking({
        serviceId: selectedService!.id,
        timeSlotId: selectedSlot!.id,
        hostId: selectedService!.hostId,
        clientName: user?.fullName ?? "Guest",
        clientEmail: user?.email ?? "",
        numberOfParticipants: 1,
      }),
    onSuccess: (data) => {
      setConfirmedBooking({ id: data.id, service: selectedService!, date: selectedDate!, slot: selectedSlot! });
      setSelectedService(null);
      setSelectedDate(new Date());
      setSelectedSlot(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to create booking", variant: "destructive" });
    },
  });

  const isFormValid = !!selectedService && !!selectedDate && !!selectedSlot;

  if (confirmedBooking) {
    return (
      <div className="max-w-lg mx-auto space-y-6 py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Booking Submitted!</h1>
          <p className="text-sm text-muted-foreground">Your booking is awaiting confirmation from the host.</p>
        </div>
        <div className="rounded-xl border bg-muted/40 divide-y divide-border text-left overflow-hidden">
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Service</p>
            <p className="text-sm font-semibold">{confirmedBooking.service.name}</p>
            <p className="text-xs text-muted-foreground">{confirmedBooking.service.category} · {confirmedBooking.service.durationMinutes}min</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Date & Time</p>
            <p className="text-sm font-semibold">{format(confirmedBooking.date, "EEE, MMM d, yyyy")}</p>
            <p className="text-xs text-muted-foreground">{confirmedBooking.slot.startTime.slice(0, 5)} – {confirmedBooking.slot.endTime.slice(0, 5)}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Amount</p>
            <p className="text-sm font-semibold">R{confirmedBooking.service.basePrice.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Payment will be collected once the host confirms</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Booking ID</p>
            <p className="text-xs font-mono text-muted-foreground">{confirmedBooking.id}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setConfirmedBooking(null)}>
            Book Another
          </Button>
          <Link href={`/dashboard/client/bookings/${confirmedBooking.id}/payment`} className="flex-1">
            <Button className="w-full">Proceed to Payment</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 py-4 sm:py-6 px-3 sm:px-4 md:px-6">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-rose-600 to-primary bg-clip-text text-transparent">
          Book a Service
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-2">
          Choose a service, pick a date, and select an available time slot
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Left card — selection */}
        <Card className="border-2 hover:border-primary/50 transition-colors overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-secondary to-secondary/50 dark:from-secondary/40 dark:to-secondary/20 rounded-t-lg pb-4 sm:pb-6">
            <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg">
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" strokeWidth={2.5} />
              <span>Select Service & Time</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6 space-y-5">

            {/* Step 1 — Service */}
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm font-semibold">1. Choose a Service</Label>
              {servicesLoading ? (
                <p className="text-xs text-muted-foreground">Loading services...</p>
              ) : services.length === 0 ? (
                <p className="text-xs text-muted-foreground">No services available at the moment.</p>
              ) : (
                <Select
                  value={selectedService?.id ?? ""}
                  onValueChange={(id) => {
                    const svc = services.find((s) => s.id === id) ?? null;
                    setSelectedService(svc);
                    setSelectedSlot(null);
                  }}
                >
                  <SelectTrigger className="text-xs sm:text-sm">
                    <SelectValue placeholder="Select a service..." />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <span className="font-medium">{s.name}</span>
                        <span className="ml-2 text-muted-foreground">
                          R{s.basePrice.toLocaleString()} · {s.durationMinutes}min
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Step 2 — Date */}
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm font-semibold">2. Pick a Date</Label>
              <div className="overflow-x-auto">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => { setSelectedDate(d); setSelectedSlot(null); }}
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="rounded-md text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Step 3 — Time slot */}
            {selectedService && selectedDate && (
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-semibold">3. Choose a Time Slot</Label>
                {slotsLoading ? (
                  <p className="text-xs text-muted-foreground">Loading available slots...</p>
                ) : availableSlots.length === 0 ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    No available slots on this date.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          selectedSlot?.id === slot.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50 text-foreground"
                        }`}
                      >
                        <Clock className="w-3 h-3 shrink-0" />
                        {slot.startTime.slice(0, 5)} – {slot.endTime.slice(0, 5)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right card — summary */}
        <Card className={`border-2 transition-all duration-300 overflow-hidden ${
          isFormValid ? "border-emerald-400 dark:border-emerald-600" : "border-border"
        }`}>
          <CardHeader className={`rounded-t-lg transition-all duration-300 pb-4 sm:pb-6 px-3 sm:px-6 ${
            isFormValid
              ? "bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-950/60 dark:to-emerald-900/30"
              : "bg-gradient-to-r from-muted/60 to-muted/30"
          }`}>
            <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg">
              {isFormValid
                ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0" strokeWidth={2.5} />
                : <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" strokeWidth={2} />
              }
              <span>Booking Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="rounded-xl border bg-muted/40 divide-y divide-border overflow-hidden text-sm">
              <div className="px-3 sm:px-4 py-2.5 sm:py-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Service</p>
                <p className={`font-semibold text-sm ${selectedService ? "text-foreground" : "text-muted-foreground"}`}>
                  {selectedService ? selectedService.name : "—"}
                </p>
                {selectedService && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedService.category} · {selectedService.durationMinutes}min
                  </p>
                )}
              </div>
              <div className="px-3 sm:px-4 py-2.5 sm:py-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Date</p>
                <p className={`font-semibold text-sm ${selectedDate ? "text-foreground" : "text-muted-foreground"}`}>
                  {selectedDate ? format(selectedDate, "EEE, MMM d, yyyy") : "—"}
                </p>
              </div>
              <div className="px-3 sm:px-4 py-2.5 sm:py-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Time</p>
                <p className={`font-semibold text-sm ${selectedSlot ? "text-foreground" : "text-muted-foreground"}`}>
                  {selectedSlot ? `${selectedSlot.startTime.slice(0, 5)} – ${selectedSlot.endTime.slice(0, 5)}` : "—"}
                </p>
              </div>
              <div className="px-3 sm:px-4 py-2.5 sm:py-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Price</p>
                <p className={`font-semibold text-sm ${selectedService ? "text-foreground" : "text-muted-foreground"}`}>
                  {selectedService ? `R${selectedService.basePrice.toLocaleString()}` : "—"}
                </p>
              </div>
            </div>

            <Button
              onClick={() => bookingMutation.mutate()}
              disabled={bookingMutation.isPending || !isFormValid}
              size="lg"
              className="w-full text-xs sm:text-sm h-10 sm:h-11"
            >
              {bookingMutation.isPending ? "Processing..." : (
                <><CreditCard className="w-4 h-4 shrink-0 mr-2" />Request Booking</>
              )}
            </Button>

            <div className="flex items-start gap-2 sm:gap-2.5 rounded-xl bg-secondary/60 border border-primary/20 px-3 sm:px-4 py-2.5 sm:py-3">
              <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={2} />
              <p className="text-xs sm:text-sm text-secondary-foreground">
                Your booking will be sent to the host for confirmation. Payment is collected after confirmation.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
