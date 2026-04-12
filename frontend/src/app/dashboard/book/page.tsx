"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Calendar as CalendarIcon, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { bookingsAPI } from "@/lib/api";
import { format } from "date-fns";

export default function BookPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [inventoryId, setInventoryId] = useState("");
  const { toast } = useToast();

  const bookingMutation = useMutation({
    mutationFn: async (data: any) => {
      return await bookingsAPI.createBooking(data);
    },
    onSuccess: (data) => {
      toast({ 
        title: "Booking Initiated!", 
        description: `Booking ID: ${data.id}` 
      });
      setInventoryId("");
      setSelectedDate(new Date());
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to start booking";
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
    },
  });

  const handleBook = () => {
    if (!selectedDate || !inventoryId) return;
    bookingMutation.mutate({
      serviceId: inventoryId,  // Use inventoryId as serviceId
      timeSlotId: "620825a4-4db2-4c7c-a291-40351d593a65",  // Fixed valid time slot ID
      hostId: "host-001",  // Fixed host ID for test service
      clientName: "Client User",  // Placeholder clientName
      clientEmail: "client@example.com",  // Placeholder clientEmail
      clientPhone: "+1234567890",  // Placeholder clientPhone
      numberOfParticipants: 1,
      notes: `Booking for ${selectedDate?.toDateString()}`,
    });
  };

  const isFormValid = selectedDate && inventoryId.trim().length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 py-4 sm:py-6 px-3 sm:px-4 md:px-6">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-rose-600 to-primary bg-clip-text text-transparent">Book a Service</h1>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-2">Select a date and enter your inventory ID to proceed with payment</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Left card — inputs */}
        <Card className="border-2 hover:border-primary/50 transition-colors overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-secondary to-secondary/50 dark:from-secondary/40 dark:to-secondary/20 rounded-t-lg pb-4 sm:pb-6">
            <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg">
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" strokeWidth={2.5} />
              <span>Select Date & Time</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="overflow-x-auto">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md text-xs sm:text-sm"
              />
            </div>
            <div className="mt-4 sm:mt-6 space-y-2">
              <Label className="text-xs sm:text-sm font-semibold">Inventory ID</Label>
              <Input
                placeholder="e.g., 550e8400-e29b-41d4-a716-446655440001"
                value={inventoryId}
                onChange={(e) => setInventoryId(e.target.value)}
                className="border-2 hover:border-primary/50 focus:border-primary transition-colors text-sm"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                {inventoryId.length > 0
                  ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={2.5} /><span className="text-emerald-600 dark:text-emerald-400 font-medium">{inventoryId} ready</span></>
                  : <><AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" strokeWidth={2.5} /><span>Enter the service inventory ID</span></>
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Right card — summary */}
        <Card className={`border-2 transition-all duration-300 overflow-hidden ${
          isFormValid
            ? "border-emerald-400 dark:border-emerald-600"
            : "border-border"
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
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Date</p>
                <p className={`font-semibold text-sm ${
                  selectedDate ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {selectedDate ? format(selectedDate, "EEE, MMM d, yyyy") : "No date selected"}
                </p>
              </div>
              <div className="px-3 sm:px-4 py-2.5 sm:py-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Inventory ID</p>
                <p className={`font-semibold font-mono text-xs sm:text-sm truncate ${
                  inventoryId ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {inventoryId || "—"}
                </p>
              </div>
            </div>

            <Button
              onClick={handleBook}
              disabled={bookingMutation.isPending || !isFormValid}
              size="lg"
              variant="success"
              className="w-full text-xs sm:text-sm h-10 sm:h-11"
            >
              {bookingMutation.isPending ? (
                <span className="flex items-center gap-2 sm:gap-3">
                  <span className="relative flex h-4 w-4">
                    {[0, 1, 2, 3].map((i) => {
                      let topValue: string | number = "50%";
                      if (i === 0) topValue = 0;
                      else if (i === 2) topValue = "auto";

                      let bottomValue: string | number = "auto";
                      if (i === 2) bottomValue = 0;

                      let leftValue: string | number = "50%";
                      if (i === 3) leftValue = 0;
                      else if (i === 1) leftValue = "auto";

                      let rightValue: string | number = "auto";
                      if (i === 1) rightValue = 0;

                      return (
                        <span
                          key={i}
                          className="absolute w-1.5 h-1.5 rounded-full bg-white"
                          style={{
                            top: topValue,
                            bottom: bottomValue,
                            left: leftValue,
                            right: rightValue,
                            transform: "translate(-50%, -50%)",
                            animation: `orbit 1.2s ease-in-out ${i * 0.3}s infinite`,
                          }}
                        />
                      );
                    })}
                    <style>{`
                      @keyframes orbit {
                        0%, 100% { opacity: 0.25; transform: translate(-50%, -50%) scale(0.75); }
                        50% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                      }
                    `}</style>
                  </span>
                  <span className="hidden sm:inline">Processing...</span>
                  <span className="sm:hidden">Loading...</span>
                </span>
              ) : (
                <><CreditCard className="w-4 h-4 shrink-0" /><span className="hidden sm:inline">Confirm & Pay into Escrow</span><span className="sm:hidden">Confirm & Pay</span></>
              )}
            </Button>

            <div className="flex items-start gap-2 sm:gap-2.5 rounded-xl bg-secondary/60 border border-primary/20 px-3 sm:px-4 py-2.5 sm:py-3">
              <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={2} />
              <p className="text-xs sm:text-sm text-secondary-foreground">
                Funds are held securely in escrow until service completion.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
