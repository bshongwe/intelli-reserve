"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, Upload, User, Bell, CreditCard, Shield, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  businessName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  bio: z.string().max(500),
  location: z.string(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function HostSettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "Alex Rivera",
      businessName: "Rivera Photography Studio",
      email: "alex@riverastudio.com",
      phone: "+1 (555) 123-4567",
      bio: "Professional photographer specializing in corporate events and portraits. 8+ years experience.",
      location: "San Francisco, CA",
    },
  });

  const onSubmit = async (_data: ProfileFormValues) => {
    setIsSaving(true);
    // Simulate API call to BFF
    await new Promise(resolve => setTimeout(resolve, 800));
    
    toast({
      title: "Profile Updated",
      description: "Your changes have been saved successfully.",
    });
    setIsSaving(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 py-4 sm:py-6 px-3 sm:px-4 md:px-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Host Settings</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-2">Manage your profile, business details, and platform preferences.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="profile" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Profile</span>
            <span className="sm:hidden">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Settings</span>
            <span className="sm:hidden">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* ====================== PROFILE TAB ====================== */}
        <TabsContent value="profile" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          <Card className="overflow-hidden">
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">Public Profile</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                This information will be visible to customers when they browse your services.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 sm:space-y-8 px-3 sm:px-6 pb-4 sm:pb-6">
              {/* Avatar Section */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 shrink-0">
                  <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d" />
                  <AvatarFallback>AR</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Button variant="outline" size="sm" className="gap-2 text-xs sm:text-sm w-full sm:w-auto">
                    <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Change Photo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Recommended: Square image, at least 400×400px
                  </p>
                </div>
              </div>

              <Separator />

              {/* Form */}
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-xs sm:text-sm">Full Name</Label>
                    <Input id="fullName" className="text-sm" {...form.register("fullName")} />
                    {form.formState.errors.fullName && (
                      <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="text-xs sm:text-sm">Business Name</Label>
                    <Input id="businessName" className="text-sm" {...form.register("businessName")} />
                    {form.formState.errors.businessName && (
                      <p className="text-xs text-destructive">{form.formState.errors.businessName.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs sm:text-sm">Email Address</Label>
                    <Input id="email" type="email" className="text-sm" {...form.register("email")} />
                    {form.formState.errors.email && (
                      <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs sm:text-sm">Phone Number</Label>
                    <Input id="phone" className="text-sm" {...form.register("phone")} />
                    {form.formState.errors.phone && (
                      <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-xs sm:text-sm">Location</Label>
                  <Input id="location" placeholder="City, Country" className="text-sm" {...form.register("location")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-xs sm:text-sm">Bio / About</Label>
                  <Textarea 
                    id="bio" 
                    rows={5}
                    placeholder="Tell customers about yourself and your services..."
                    className="text-sm resize-none"
                    {...form.register("bio")} 
                  />
                  <p className="text-xs text-muted-foreground">
                    {form.watch("bio")?.length || 0}/500 characters
                  </p>
                </div>

                <Button type="submit" disabled={isSaving} size="sm" className="gap-2 text-xs sm:text-sm w-full sm:w-auto">
                  <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {isSaving ? "Saving..." : "Save Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====================== SETTINGS TAB ====================== */}
        <TabsContent value="settings" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
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
                  <Label className="text-xs sm:text-sm">Payout Method</Label>
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
                    <Label className="text-xs sm:text-sm">Minimum Payout Threshold</Label>
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
                    <Label className="text-xs sm:text-sm">Payout Schedule</Label>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
