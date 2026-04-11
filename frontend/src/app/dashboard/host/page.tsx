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
    <div className="space-y-8 py-8 px-4 md:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Host Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome back! Here's what's happening with your services.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalBookings || 142}</div>
            <p className="text-xs text-muted-foreground">+12 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Released Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R{stats?.totalRevenue?.toLocaleString() || "487,500"}</div>
            <p className="text-xs text-muted-foreground">+18% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Escrow</CardTitle>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R{stats?.pendingEscrow?.toLocaleString() || "124,000"}</div>
            <p className="text-xs text-muted-foreground">Held until completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.occupancyRate || 87}%</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Revenue Trend */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly released funds from completed bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={mockRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`R${value}`, "Revenue"]} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Occupancy */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Weekly Occupancy</CardTitle>
            <CardDescription>Booking utilization by day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={mockOccupancyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}%`, "Occupancy"]} />
                <Bar dataKey="occupancy" fill="#10b981" radius={8} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Bookings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upcoming Bookings</CardTitle>
                <CardDescription>Next 7 days</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar className="h-4 w-4" />
                View Calendar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback>{booking.client.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{booking.client}</p>
                      <p className="text-sm text-muted-foreground truncate">{booking.service}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <div className="text-right">
                      <p className="text-sm font-semibold">R{booking.amount}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(booking.time), "MMM dd")}</p>
                    </div>
                    <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                      {booking.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Escrow Releases */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Escrow Releases</CardTitle>
                <CardDescription>Funds released to you</CardDescription>
              </div>
              <Button variant="outline" size="sm">View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentReleases.map((release) => (
                <div key={release.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
                      <DollarSign className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{release.client}</p>
                      <p className="text-sm text-muted-foreground">Booking #{release.id}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="font-semibold text-emerald-600">+R{release.amount}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(release.releasedAt), "MMM dd")}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button className="h-20 flex-col gap-2" variant="outline">
            <Calendar className="h-6 w-6" />
            <span className="text-xs">Add New Slot</span>
          </Button>
          <Button className="h-20 flex-col gap-2" variant="outline">
            <TrendingUp className="h-6 w-6" />
            <span className="text-xs">Adjust Pricing</span>
          </Button>
          <Button className="h-20 flex-col gap-2" variant="outline">
            <AlertCircle className="h-6 w-6" />
            <span className="text-xs">View Refunds</span>
          </Button>
          <Button className="h-20 flex-col gap-2" variant="outline">
            <Users className="h-6 w-6" />
            <span className="text-xs">Manage Clients</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
