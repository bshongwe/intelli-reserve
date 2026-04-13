"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, CreditCard, Trash2 } from "lucide-react";

export default function ClientSettingsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 py-4 sm:py-6 px-3 sm:px-4 md:px-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-2">Manage your payment preferences and account settings.</p>
      </div>

      <div className="grid gap-4 sm:gap-6">
        {/* Payment Preferences */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              Payment Preferences
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Configure how you pay for bookings held in escrow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6 pb-4 sm:pb-6">
            <div>
              <label className="text-xs sm:text-sm font-medium">Preferred Payment Method</label>
              <Select defaultValue="card">
                <SelectTrigger className="mt-2 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Credit / Debit Card</SelectItem>
                  <SelectItem value="eft">EFT / Bank Transfer</SelectItem>
                  <SelectItem value="instant">Instant EFT (SnapScan, Ozow)</SelectItem>
                  <SelectItem value="wallet">Digital Wallet (Apple Pay, Google Pay)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Alert className="text-xs sm:text-sm">
              <AlertDescription>
                All payments are held securely in escrow and only released to the host after you confirm service completion.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Booking Preferences */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Booking Preferences</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Control how bookings behave for you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6 pb-4 sm:pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Auto-Release Funds on Completion</p>
                <p className="text-xs text-muted-foreground">Automatically release escrow funds 24h after service date</p>
              </div>
              <Switch defaultChecked className="shrink-0" />
            </div>
            <Separator />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Cancellation Reminder</p>
                <p className="text-xs text-muted-foreground">Remind me before the free cancellation window closes</p>
              </div>
              <Select defaultValue="24">
                <SelectTrigger className="w-full sm:w-40 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 hours before</SelectItem>
                  <SelectItem value="12">12 hours before</SelectItem>
                  <SelectItem value="24">24 hours before</SelectItem>
                  <SelectItem value="48">48 hours before</SelectItem>
                </SelectContent>
              </Select>
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
              <p className="text-xs sm:text-sm font-medium">Booking Confirmed by Host</p>
              <Switch defaultChecked className="shrink-0" />
            </div>
            <Separator />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <p className="text-xs sm:text-sm font-medium">Booking Reminder (24h before)</p>
              <Switch defaultChecked className="shrink-0" />
            </div>
            <Separator />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <p className="text-xs sm:text-sm font-medium">Escrow Release Processed</p>
              <Switch defaultChecked className="shrink-0" />
            </div>
            <Separator />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <p className="text-xs sm:text-sm font-medium">Booking Cancelled or Rejected</p>
              <Switch defaultChecked className="shrink-0" />
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
                <p className="text-sm font-medium">Delete My Account</p>
                <p className="text-xs text-muted-foreground">
                  Permanently removes your account and all booking history.
                </p>
              </div>
              <Button variant="destructive" size="sm" className="gap-2 text-xs sm:text-sm w-full sm:w-auto shrink-0">
                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
