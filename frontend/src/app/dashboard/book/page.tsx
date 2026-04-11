"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Book a Service</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Date & Time</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
            <div className="mt-4">
              <Label>Inventory ID</Label>
              <Input
                placeholder="e.g., service-456"
                value={inventoryId}
                onChange={(e) => setInventoryId(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Selected Date</p>
              <p className="font-semibold">{selectedDate ? format(selectedDate, "PPP") : "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Inventory ID</p>
              <p className="font-semibold">{inventoryId || "—"}</p>
            </div>
            <Button 
              onClick={handleBook} 
              disabled={bookingMutation.isPending || !inventoryId}
              className="w-full"
            >
              {bookingMutation.isPending ? "Starting Saga..." : "Confirm & Pay into Escrow"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Funds will be held securely in escrow until service completion.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
