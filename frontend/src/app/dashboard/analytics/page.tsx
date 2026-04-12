"use client";

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie } from "recharts";
import { Users, Calendar, TrendingUp, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MetricCard } from "@/components/analytics/MetricCard";
import { StatBadge } from "@/components/analytics/StatBadge";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsAPI } from "@/lib/api";
import { DashboardLoadingSkeleton } from "@/components/common/DashboardLoadingSkeleton";

export default function AnalyticsDashboardPage() {
  const [timeRange, setTimeRange] = useState<"1m" | "3m" | "6m" | "1y">("6m");
  
  // Get host ID from auth context (TODO: implement auth)
  const hostId = "host-001"; // Placeholder - should come from auth context

  // Fetch analytics data with optimized caching
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["analytics", hostId, timeRange],
    queryFn: () => analyticsAPI.getAnalytics(hostId, timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes - keep data fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - cache period
    refetchInterval: 60 * 1000, // Refetch every minute if window is focused
    refetchIntervalInBackground: false, // Don't refetch in background
  });

  const revenueData = analyticsData?.revenueData || [];
  const bookingStatusData = analyticsData?.bookingStatusData || [];
  const topServices = analyticsData?.topServices || [];
  const topCustomers = analyticsData?.topCustomers || [];
  const metrics = analyticsData?.metrics || {
    totalRevenue: "R0",
    totalBookings: 0,
    activeCustomers: 0,
    avgRating: 0,
  };

  if (isLoading) {
    return <DashboardLoadingSkeleton kpiCount={4} showCharts label="Loading analytics..." />;
  }

  return (
    <div className="space-y-6 sm:space-y-8 py-3 sm:py-4 md:py-6 px-3 sm:px-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Track your performance and insights</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-full sm:w-auto md:w-40 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Last Month</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="text-xs sm:text-sm w-full sm:w-auto">
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Total Revenue"
          value={metrics.totalRevenue}
          icon={TrendingUp}
          trend={{ value: 12, isPositive: true }}
          variant="success"
        />
        <MetricCard
          label="Total Bookings"
          value={metrics.totalBookings.toString()}
          icon={Calendar}
          trend={{ value: 8, isPositive: true }}
          variant="default"
        />
        <MetricCard
          label="Active Customers"
          value={metrics.activeCustomers.toString()}
          icon={Users}
          trend={{ value: 5, isPositive: true }}
          variant="default"
        />
        <MetricCard
          label="Avg Rating"
          value={metrics.avgRating.toFixed(1)}
          icon={Star}
          trend={{ value: 2, isPositive: true }}
          variant="success"
        />
      </div>

      {/* Revenue & Bookings Trend */}
      <Card className="w-full overflow-hidden">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg md:text-xl">Revenue & Bookings Trend</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Monthly performance over time</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--analytics-primary))"
                name="Revenue (R)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="bookings"
                stroke="hsl(var(--analytics-secondary))"
                name="Bookings"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Booking Status Distribution */}
        <Card className="w-full overflow-hidden">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg md:text-xl">Booking Status</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Distribution of booking statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={bookingStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  dataKey="value"
                  label
                >
                  {bookingStatusData.map((entry) => (
                    <Pie key={entry.name} dataKey="value" fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {bookingStatusData.map((item) => (
                <div key={item.name} className="text-center">
                  <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: item.color }} />
                  <p className="text-xs text-muted-foreground">{item.name}</p>
                  <p className="font-semibold text-sm">{item.value}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Revenue Bar Chart */}
        <Card className="w-full overflow-hidden">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg md:text-xl">Monthly Revenue</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Revenue breakdown by month</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="revenue" fill="hsl(var(--analytics-primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Services */}
        <Card className="w-full overflow-hidden">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg md:text-xl">Top Services</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Best performing services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {topServices.map((service, index) => (
                <div
                  key={service.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 pb-3 sm:pb-4 border-b last:border-0"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium truncate">{service.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {service.bookings} bookings
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs sm:text-sm font-semibold">R{service.revenue.toLocaleString()}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {Math.round((service.bookings / 57) * 100)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card className="w-full overflow-hidden">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg md:text-xl">Top Customers</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Most valuable customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {topCustomers.map((customer, index) => (
                <div
                  key={customer.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 pb-3 sm:pb-4 border-b last:border-0"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium truncate">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {customer.bookings} bookings
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs sm:text-sm font-semibold">R{customer.totalSpent.toLocaleString()}</p>
                    <StatBadge
                      label="Value"
                      value={`${Math.round((customer.totalSpent / 6000) * 100)}%`}
                      variant="outline"
                      className="text-xs mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card className="w-full overflow-hidden">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg md:text-xl">System Health</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Platform performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2 gap-2">
                <p className="text-xs sm:text-sm font-medium">Platform Uptime</p>
                <Badge className="bg-red-100 text-red-800 text-xs">Good</Badge>
              </div>
              <p className="text-xl sm:text-2xl font-bold">99.9%</p>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
            </div>
            <div className="p-3 sm:p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2 gap-2">
                <p className="text-xs sm:text-sm font-medium">Avg Response Time</p>
                <Badge className="bg-red-100 text-red-800 text-xs">Good</Badge>
              </div>
              <p className="text-xl sm:text-2xl font-bold">245ms</p>
              <p className="text-xs text-muted-foreground mt-1">API calls</p>
            </div>
            <div className="p-3 sm:p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2 gap-2">
                <p className="text-xs sm:text-sm font-medium">Error Rate</p>
                <Badge className="bg-orange-100 text-orange-800 text-xs">Watch</Badge>
              </div>
              <p className="text-xl sm:text-2xl font-bold">0.12%</p>
              <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
            </div>
            <div className="p-3 sm:p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2 gap-2">
                <p className="text-xs sm:text-sm font-medium">Data Storage</p>
                <Badge className="bg-red-100 text-red-800 text-xs">Good</Badge>
              </div>
              <p className="text-xl sm:text-2xl font-bold">45%</p>
              <p className="text-xs text-muted-foreground mt-1">Of quota used</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
