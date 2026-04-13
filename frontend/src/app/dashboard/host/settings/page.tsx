"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, CreditCard, Trash2 } from "lucide-react";

export default function HostSettingsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 py-4 sm:py-6 px-3 sm:px-4 md:px-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-2">Manage your business preferences and platform settings.</p>
      </div>

      <div className="grid gap-4 sm:gap-6">
        {/* Payout & Banking */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              Payout Settings
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Configure how and when you receive funds from escrow releases.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6 pb-4 sm:pb-6">
            <div>
              <label className="text-xs sm:text-sm font-medium">Payout Method</label>
              <Select defaultValue="stripe">
                <SelectTrigger className="mt-2 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stripe">Stripe Connect (Recommended)</SelectItem>
                  <SelectItem value="bank">Direct Bank Transfer</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="text-xs sm:text-sm font-medium">Minimum Payout Threshold</label>
                <Select defaultValue="100">
                  <SelectTrigger className="mt-2 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">R50</SelectItem>
                    <SelectItem value="100">R100</SelectItem>
                    <SelectItem value="250">R250</SelectItem>
                    <SelectItem value="500">R500</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium">Payout Schedule</label>
                <Select defaultValue="weekly">
                  <SelectTrigger className="mt-2 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly (Every Monday)</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Alert className="text-xs sm:text-sm">
              <AlertDescription>
                Funds are automatically released from escrow 24 hours after booking completion (or per your cancellation policy).
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Business Rules */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Booking & Cancellation Rules</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Define how customers can book and cancel with you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6 pb-4 sm:pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Allow Same-Day Bookings</p>
                <p className="text-xs text-muted-foreground">Customers can book slots on the same day</p>
              </div>
              <Switch defaultChecked className="shrink-0" />
            </div>
            <Separator />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Cancellation Window</p>
                <p className="text-xs text-muted-foreground">Free cancellation up to</p>
              </div>
              <Select defaultValue="24">
                <SelectTrigger className="w-full sm:w-40 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="12">12 hours</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="48">48 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Auto-Confirm Bookings</p>
                <p className="text-xs text-muted-foreground">Automatically confirm bookings under R300</p>
              </div>
              <Switch defaultChecked className="shrink-0" />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-4 sm:pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <p className="text-xs sm:text-sm font-medium">New Booking Requests</p>
              <Switch defaultChecked className="shrink-0" />
            </div>
            <Separator />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <p className="text-xs sm:text-sm font-medium">Escrow Release Confirmed</p>
              <Switch defaultChecked className="shrink-0" />
            </div>
            <Separator />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <p className="text-xs sm:text-sm font-medium">Upcoming Bookings (24h reminder)</p>
              <Switch defaultChecked className="shrink-0" />
            </div>
            <Separator />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <p className="text-xs sm:text-sm font-medium">Refund Requests</p>
              <Switch className="shrink-0" />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive overflow-hidden">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-destructive text-lg sm:text-xl">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Deactivate My Account</p>
                <p className="text-xs text-muted-foreground">
                  This will hide your services and prevent new bookings.
                </p>
              </div>
              <Button variant="destructive" size="sm" className="gap-2 text-xs sm:text-sm w-full sm:w-auto shrink-0">
                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Deactivate
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
