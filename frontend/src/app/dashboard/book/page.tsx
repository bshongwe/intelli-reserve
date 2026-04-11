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
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">Book a Service</h1>
        <p className="text-muted-foreground mt-2">Select a date and enter your inventory ID to proceed with payment</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 hover:border-blue-400 transition-colors">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-t-lg">
            <CardTitle className="flex items-center gap-3">
              <CalendarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
              <span>Select Date & Time</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md"
              />
            </div>
            <div className="mt-6 space-y-3">
              <Label className="text-base font-semibold">Inventory ID</Label>
              <Input
                placeholder="e.g., service-456"
                value={inventoryId}
                onChange={(e) => setInventoryId(e.target.value)}
                className="border-2 border-slate-300 dark:border-slate-600 hover:border-blue-400 focus:border-blue-500 transition-colors h-10 text-base"
              />
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                {inventoryId.length > 0 
                  ? <>
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" strokeWidth={2.5} />
                      <span>{inventoryId} ready for booking</span>
                    </>
                  : <>
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
                      <span>Enter the service inventory ID</span>
                    </>
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 transition-all ${isFormValid ? 'border-green-400 bg-green-50 dark:bg-green-950' : 'border-slate-200 dark:border-slate-700'}`}>
          <CardHeader className={`rounded-t-lg ${isFormValid ? 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900' : 'bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800'}`}>
            <CardTitle className="flex items-center gap-3">
              {isFormValid 
                ? <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" strokeWidth={2.5} />
                : <CreditCard className="w-6 h-6 text-slate-600 dark:text-slate-400" strokeWidth={2.5} />
              }
              <span>Booking Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Selected Date</p>
              <p className={`font-bold text-lg mt-1 ${selectedDate ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "No date selected"}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Inventory ID</p>
              <p className={`font-bold text-lg mt-1 ${inventoryId ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                {inventoryId || "Not provided"}
              </p>
            </div>
            <Button 
              onClick={handleBook} 
              disabled={bookingMutation.isPending || !isFormValid}
              size="lg"
              className="w-full mt-4 transition-all duration-300"
            >
              {bookingMutation.isPending ? (
                <>
                  <div className="animate-spin">
                    <CreditCard className="w-5 h-5" strokeWidth={2.5} />
                  </div>
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" strokeWidth={2.5} />
                  Confirm & Pay into Escrow
                </>
              )}
            </Button>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-900 dark:text-blue-200 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                Funds will be held securely in escrow until service completion.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
