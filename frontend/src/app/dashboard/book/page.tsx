"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Calendar as CalendarIcon, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

export default function BookPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [inventoryId, setInventoryId] = useState("");
  const { toast } = useToast();

  const bookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await axios.post("/api/bff/bookings", data);
      return res.data;
    },
    onSuccess: (data) => {
      toast({ 
        title: "Booking Initiated!", 
        description: `Booking ID: ${data.bookingId}` 
      });
      setInventoryId("");
      setSelectedDate(new Date());
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to start booking", 
        variant: "destructive" 
      });
    },
  });

  const handleBook = () => {
    if (!selectedDate || !inventoryId) return;
    bookingMutation.mutate({
      inventoryId,
      slotStart: selectedDate.toISOString(),
      userId: "user_123",
      tenantId: "tenant_1",
    });
  };

  const isFormValid = selectedDate && inventoryId.trim().length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-500 to-primary bg-clip-text text-transparent">Book a Service</h1>
        <p className="text-muted-foreground mt-2">Select a date and enter your inventory ID to proceed with payment</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left card — inputs */}
        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="bg-gradient-to-r from-secondary to-secondary/50 dark:from-secondary/40 dark:to-secondary/20 rounded-t-lg">
            <CardTitle className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-primary" strokeWidth={2.5} />
              <span>Select Date & Time</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md"
            />
            <div className="mt-6 space-y-2">
              <Label className="text-sm font-semibold">Inventory ID</Label>
              <Input
                placeholder="e.g., service-456"
                value={inventoryId}
                onChange={(e) => setInventoryId(e.target.value)}
                className="border-2 hover:border-primary/50 focus:border-primary transition-colors"
              />
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                {inventoryId.length > 0
                  ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2.5} /><span className="text-emerald-600 dark:text-emerald-400 font-medium">{inventoryId} ready</span></>
                  : <><AlertCircle className="w-3.5 h-3.5 text-amber-500" strokeWidth={2.5} /><span>Enter the service inventory ID</span></>
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Right card — summary */}
        <Card className={`border-2 transition-all duration-300 ${
          isFormValid
            ? "border-emerald-400 dark:border-emerald-600"
            : "border-border"
        }`}>
          <CardHeader className={`rounded-t-lg transition-all duration-300 ${
            isFormValid
              ? "bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-950/60 dark:to-emerald-900/30"
              : "bg-gradient-to-r from-muted/60 to-muted/30"
          }`}>
            <CardTitle className="flex items-center gap-3">
              {isFormValid
                ? <CheckCircle2 className="w-5 h-5 text-emerald-500" strokeWidth={2.5} />
                : <CreditCard className="w-5 h-5 text-muted-foreground" strokeWidth={2} />
              }
              <span>Booking Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="rounded-xl border bg-muted/40 divide-y divide-border overflow-hidden">
              <div className="px-4 py-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">Date</p>
                <p className={`font-semibold ${
                  selectedDate ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "No date selected"}
                </p>
              </div>
              <div className="px-4 py-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">Inventory ID</p>
                <p className={`font-semibold font-mono ${
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
              className="w-full"
            >
              {bookingMutation.isPending ? (
                <><div className="animate-spin"><CreditCard className="w-4 h-4" /></div>Processing...</>
              ) : (
                <><CreditCard className="w-4 h-4" />Confirm & Pay into Escrow</>
              )}
            </Button>

            <div className="flex items-start gap-2.5 rounded-xl bg-secondary/60 border border-primary/20 px-4 py-3">
              <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={2} />
              <p className="text-sm text-secondary-foreground">
                Funds are held securely in escrow until service completion.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
