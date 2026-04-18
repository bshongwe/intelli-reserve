"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle2, XCircle, Search, CreditCard } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { bookingsAPI, servicesAPI } from "@/lib/api";
import { checkPaymentStatus } from "@/lib/escrow-api";
import { cn } from "@/lib/utils";

// ============================================================================
// CONSTANTS
// ============================================================================

const BTN_PAY_NOW = 'Pay Now';

const STATUS_FILTERS = ["all", "pending", "confirmed", "completed", "cancelled"] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  confirmed: { label: "Confirmed", icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" },
  pending:   { label: "Pending",   icon: Clock,         className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
  completed: { label: "Completed", icon: CheckCircle2,  className: "bg-secondary text-secondary-foreground" },
  cancelled: { label: "Cancelled", icon: XCircle,       className: "bg-destructive/10 text-destructive" },
};

export default function ClientBookingsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const paymentSuccess = searchParams?.get("payment_success") === "true";

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["client-bookings", user?.email],
    queryFn: () => bookingsAPI.getClientBookings(user?.email ?? ""),
    enabled: !!user?.email,
    staleTime: 60 * 1000,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["browse-services"],
    queryFn: () => servicesAPI.getAllServices(),
    staleTime: 5 * 60 * 1000,
  });

  const serviceMap = Object.fromEntries(services.map((s) => [s.id, s]));

  const filtered = filter === "all" ? bookings : bookings.filter((b: any) => b.status === filter);

  return (
    <div className="space-y-6 py-6 px-3 sm:px-4 md:px-6 lg:px-8">
      {/* Payment Success Alert */}
      {paymentSuccess && (
        <Alert className="border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <AlertDescription className="text-emerald-800 dark:text-emerald-200">
            ✓ Payment successful! Your funds have been held in escrow. Your booking will be processed once the service is completed.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Bookings</h1>
          <p className="text-sm text-muted-foreground mt-1">All your booking history in one place.</p>
        </div>
        <Link href="/dashboard/book">
          <Button className="gap-2 text-sm">
            <Search className="w-4 h-4" /> Book New
          </Button>
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize",
              filter === s
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {filter === "all" ? "All Bookings" : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Bookings`}
            <span className="ml-2 text-sm font-normal text-muted-foreground">({filtered.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="text-center py-12 text-sm text-muted-foreground">Loading bookings...</div>
          )}
          
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-12 space-y-3">
              <Calendar className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">No {filter === "all" ? "" : filter} bookings found.</p>
              <Link href="/dashboard/book">
                <Button size="sm" variant="outline" className="gap-2">
                  <Search className="w-4 h-4" /> Find a Service
                </Button>
              </Link>
            </div>
          )}
          
          {!isLoading && filtered.length > 0 && (
            <div className="space-y-3">
              {filtered.map((booking: any) => {
                const config = statusConfig[booking.status] ?? statusConfig.pending;
                const StatusIcon = config.icon;
                
                // eslint-disable-next-line react-hooks/rules-of-hooks
                const { data: hasPaid = false } = useQuery({
                  queryKey: ["payment-status", booking.id],
                  queryFn: () => checkPaymentStatus(booking.id),
                  enabled: booking.status === "confirmed",
                  staleTime: 60 * 1000,
                });

                return (
                  <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border hover:bg-muted/50 transition-colors gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{serviceMap[booking.serviceId]?.name ?? "Service Booking"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {serviceMap[booking.serviceId]?.category && (
                            <span className="mr-1.5">{serviceMap[booking.serviceId].category} ·</span>
                          )}
                          Booked {new Date(booking.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground truncate">ID: {booking.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full", config.className)}>
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                      {booking.status === 'confirmed' && !hasPaid && (
                        <Link href={`/dashboard/client/bookings/${booking.id}/payment`}>
                          <Button size="sm" className="gap-1.5">
                            <CreditCard className="w-3.5 h-3.5" />
                            {BTN_PAY_NOW}
                          </Button>
                        </Link>
                      )}
                      {booking.status === 'confirmed' && hasPaid && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          Paid
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
