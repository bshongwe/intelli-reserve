"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CreditCard, Clock, CheckCircle2, Search, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { bookingsAPI } from "@/lib/api";

export default function ClientDashboard() {
  const { user } = useAuth();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["client-bookings", user?.email],
    queryFn: () => bookingsAPI.getClientBookings(user?.email ?? ""),
    enabled: !!user?.email,
    staleTime: 60 * 1000,
  });

  const upcoming = bookings.filter((b: any) => b.status === "confirmed");
  const pending = bookings.filter((b: any) => b.status === "pending");
  const completed = bookings.filter((b: any) => b.status === "completed");

  return (
    <div className="space-y-8 py-6 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Welcome back, {user?.fullName?.split(" ")[0]}!
        </h1>
        <p className="text-sm text-muted-foreground">Here's an overview of your bookings and activity.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{upcoming.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Confirmed bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pending.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completed.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Services received</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Bookings</CardTitle>
              <CardDescription className="text-xs">Your latest booking activity</CardDescription>
            </div>
            <Link href="/dashboard/client/bookings">
              <Button variant="outline" size="sm" className="text-xs gap-1.5">
                View All <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-sm text-muted-foreground">Loading...</div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <p className="text-sm text-muted-foreground">No bookings yet.</p>
                <Link href="/dashboard/book">
                  <Button size="sm" className="gap-2">
                    <Search className="w-4 h-4" /> Book a Service
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 5).map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{booking.serviceId}</p>
                      <p className="text-xs text-muted-foreground">{new Date(booking.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      booking.status === "confirmed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" :
                      booking.status === "pending" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" :
                      booking.status === "completed" ? "bg-secondary text-secondary-foreground" :
                      "bg-destructive/10 text-destructive"
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Escrow Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Escrow Protection</CardTitle>
            <CardDescription className="text-xs">Your payment security status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/60 border border-primary/20">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Funds Protected</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  All payments are held in escrow and only released to the host after you confirm service completion.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border">
              <CreditCard className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Escrow Balance</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Detailed escrow tracking coming soon.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Link href="/dashboard/book" className="contents">
            <Button className="h-16 flex-col gap-2 text-xs" variant="outline">
              <Search className="h-5 w-5" />
              Book a Service
            </Button>
          </Link>
          <Link href="/dashboard/client/bookings" className="contents">
            <Button className="h-16 flex-col gap-2 text-xs" variant="outline">
              <Calendar className="h-5 w-5" />
              My Bookings
            </Button>
          </Link>
          <Link href="/dashboard/profile" className="contents">
            <Button className="h-16 flex-col gap-2 text-xs" variant="outline">
              <ShieldCheck className="h-5 w-5" />
              My Profile
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
