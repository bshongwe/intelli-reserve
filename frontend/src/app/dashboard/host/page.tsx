"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, DollarSign, Users, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

// Mock data – replace with real BFF calls later
const mockRevenueData = [
  { month: "Jan", revenue: 124000 },
  { month: "Feb", revenue: 158000 },
  { month: "Mar", revenue: 132000 },
  { month: "Apr", revenue: 189000 },
  { month: "May", revenue: 214000 },
];

const mockOccupancyData = [
  { day: "Mon", occupancy: 65 },
  { day: "Tue", occupancy: 82 },
  { day: "Wed", occupancy: 78 },
  { day: "Thu", occupancy: 91 },
  { day: "Fri", occupancy: 95 },
  { day: "Sat", occupancy: 88 },
  { day: "Sun", occupancy: 72 },
];

const upcomingBookings = [
  { id: "bk-8921", client: "Sarah Chen", service: "Consultation", time: "2026-04-12 10:00", status: "confirmed", amount: 2500 },
  { id: "bk-8923", client: "Marcus Okoro", service: "Photography Session", time: "2026-04-13 14:30", status: "pending", amount: 4500 },
  { id: "bk-8924", client: "Elena Petrova", service: "Workshop", time: "2026-04-15 09:00", status: "confirmed", amount: 12000 },
];

const recentReleases = [
  { id: "bk-8901", client: "David Kim", amount: 3200, releasedAt: "2026-04-08" },
  { id: "bk-8897", client: "Aisha Patel", amount: 8900, releasedAt: "2026-04-07" },
];

export default function HostDashboard() {
  // Example query to BFF – replace with your real endpoint
  const { data: stats } = useQuery({
    queryKey: ["host-stats"],
    queryFn: async () => {
      return {
        totalBookings: 142,
        totalRevenue: 487500,
        pendingEscrow: 124000,
        occupancyRate: 87,
      };
    },
  });

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
            <div className="text-2xl sm:text-3xl font-bold">{stats?.totalBookings || 142}</div>
            <p className="text-xs text-muted-foreground mt-1">+12 from last month</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Released Revenue</CardTitle>
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold truncate">R{stats?.totalRevenue?.toLocaleString() || "487,500"}</div>
            <p className="text-xs text-muted-foreground mt-1">+18% from last month</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Pending Escrow</CardTitle>
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold truncate">R{stats?.pendingEscrow?.toLocaleString() || "124,000"}</div>
            <p className="text-xs text-muted-foreground mt-1">Held until completion</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Occupancy Rate</CardTitle>
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{stats?.occupancyRate || 87}%</div>
            <p className="text-xs text-muted-foreground mt-1">This week</p>
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
                <LineChart data={mockRevenueData}>
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
                <BarChart data={mockOccupancyData}>
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
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 border-b pb-3 sm:pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-xs">{booking.client.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{booking.client}</p>
                      <p className="text-xs text-muted-foreground truncate">{booking.service}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <p className="text-xs sm:text-sm font-semibold">R{booking.amount}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(booking.time), "MMM dd")}</p>
                    </div>
                    <Badge variant={booking.status === "confirmed" ? "default" : "secondary"} className="text-xs shrink-0">
                      {booking.status}
                    </Badge>
                  </div>
                </div>
              ))}
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
              {recentReleases.map((release) => (
                <div key={release.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 border-b pb-3 sm:pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
                      <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{release.client}</p>
                      <p className="text-xs text-muted-foreground">Booking #{release.id}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 w-full sm:w-auto">
                    <p className="text-sm font-semibold text-emerald-600">+R{release.amount}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(release.releasedAt), "MMM dd")}</p>
                  </div>
                </div>
              ))}
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
