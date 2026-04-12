"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Users, TrendingUp, AlertCircle, Check, X } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { analyticsAPI, bookingsAPI } from "@/lib/api";
import { DashboardLoadingSkeleton } from "@/components/common/DashboardLoadingSkeleton";
import { useToast } from "@/components/ui/use-toast";

export default function HostDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get host ID from auth context (TODO: implement auth)
  const hostId = "host-001"; // Placeholder - should come from auth context

  // Fetch dashboard metrics with optimized caching
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboard-metrics", hostId],
    queryFn: () => analyticsAPI.getDashboardMetrics(hostId),
    staleTime: 5 * 60 * 1000, // 5 minutes - keep data fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - cache period
    refetchInterval: 30 * 1000, // Refetch every 30 seconds if window is focused
    refetchIntervalInBackground: false, // Don't refetch in background
  });

  // Fetch pending bookings
  const { data: pendingBookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["pending-bookings", hostId],
    queryFn: () => bookingsAPI.getHostBookings(hostId, 'pending'),
    staleTime: 1 * 60 * 1000, // 1 minute - keep fresh
    refetchInterval: 15 * 1000, // Refetch every 15 seconds
  });

  // Confirm booking mutation
  const confirmBookingMutation = useMutation({
    mutationFn: (bookingId: string) => bookingsAPI.updateBookingStatus(bookingId, 'confirmed'),
    onSuccess: () => {
      toast({
        title: "Booking Confirmed",
        description: "The booking has been confirmed.",
      });
      queryClient.invalidateQueries({ queryKey: ["pending-bookings", hostId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics", hostId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to confirm booking",
        variant: "destructive",
      });
    },
  });

  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: (bookingId: string) => bookingsAPI.cancelBooking(bookingId, "Cancelled by host"),
    onSuccess: () => {
      toast({
        title: "Booking Cancelled",
        description: "The booking has been cancelled.",
      });
      queryClient.invalidateQueries({ queryKey: ["pending-bookings", hostId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics", hostId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to cancel booking",
        variant: "destructive",
      });
    },
  });

  const revenueData = dashboardData?.revenueData || [];
  const occupancyData = dashboardData?.occupancyData || [];

  if (isLoading) {
    return <DashboardLoadingSkeleton kpiCount={4} showCharts label="Loading dashboard..." />;
  }

  return (
    <div className="space-y-8 py-6 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Host Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Welcome back! Here's what's happening with your services.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Bookings</CardTitle>
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{dashboardData?.upcomingBookings || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Upcoming services</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Released Revenue</CardTitle>
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold truncate">{dashboardData?.totalRevenue || "R0"}</div>
            <p className="text-xs text-muted-foreground mt-1">This period</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Avg Occupancy</CardTitle>
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{dashboardData?.avgOccupancy || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">Week average</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Response Rate</CardTitle>
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{dashboardData?.responseRate || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">Very responsive</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Revenue Trend */}
        <Card className="lg:col-span-4 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Revenue Trend</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Monthly released funds from completed bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <ResponsiveContainer width="100%" height={280} minWidth={250}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [`R${value}`, "Revenue"]} />
                  <Line type="monotone" dataKey="revenue" stroke="var(--chart-revenue)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Occupancy */}
        <Card className="lg:col-span-3 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Weekly Occupancy</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Booking utilization by day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <ResponsiveContainer width="100%" height={280} minWidth={250}>
                <BarChart data={occupancyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [`${value}%`, "Occupancy"]} />
                  <Bar dataKey="occupancy" fill="var(--chart-occupancy)" radius={8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Bookings - Confirmation Required */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="text-base sm:text-lg">Pending Confirmation</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Awaiting your confirmation</CardDescription>
              </div>
              {pendingBookings.length > 0 && (
                <div className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  {pendingBookings.length} pending
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {bookingsLoading ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Loading bookings...</p>
                </div>
              ) : pendingBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No pending bookings</p>
                </div>
              ) : (
                pendingBookings.map((booking: any) => (
                  <div key={booking.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                        <p className="font-medium text-sm line-clamp-1">{booking.serviceId}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(booking.createdAt).toLocaleDateString()} at {new Date(booking.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                      </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 sm:flex-none gap-1.5 text-xs h-8"
                        onClick={() => confirmBookingMutation.mutate(booking.id)}
                        disabled={confirmBookingMutation.isPending || cancelBookingMutation.isPending}
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Confirm</span>
                        <span className="sm:hidden">Approve</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 sm:flex-none gap-1.5 text-xs h-8 text-destructive hover:text-destructive"
                        onClick={() => cancelBookingMutation.mutate(booking.id)}
                        disabled={confirmBookingMutation.isPending || cancelBookingMutation.isPending}
                      >
                        <X className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Reject</span>
                        <span className="sm:hidden">Deny</span>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Escrow Releases */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="text-base sm:text-lg">Recent Escrow Releases</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Funds released to you</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm w-full sm:w-auto">View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Escrow data coming soon from API</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <Button className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 text-xs sm:text-sm" variant="outline">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
            <span>Add Slot</span>
          </Button>
          <Button className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 text-xs sm:text-sm" variant="outline">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
            <span>Pricing</span>
          </Button>
          <Button className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 text-xs sm:text-sm" variant="outline">
            <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" />
            <span>Refunds</span>
          </Button>
          <Button className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 text-xs sm:text-sm" variant="outline">
            <Users className="h-5 w-5 sm:h-6 sm:w-6" />
            <span>Clients</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
