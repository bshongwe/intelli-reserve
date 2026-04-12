"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Users, TrendingUp, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { analyticsAPI } from "@/lib/api";
import { DashboardLoadingSkeleton } from "@/components/common/DashboardLoadingSkeleton";

export default function HostDashboard() {
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
        {/* Upcoming Bookings */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="text-base sm:text-lg">Upcoming Bookings</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Next 7 days</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-1 text-xs sm:text-sm w-full sm:w-auto">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">View Calendar</span>
                <span className="sm:hidden">Calendar</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Booking data coming soon from API</p>
              </div>
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
