"use client";

import { useAuth } from "@/lib/auth-context";
import { useRequireAuth } from "@/lib/auth-hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Copy, Zap, Calendar } from "lucide-react";
import { useState, useEffect } from "react";

interface SubscriptionInfo {
  planName: string;
  displayName: string;
  status: string;
  monthlyPrice: number;
  maxBookings: number;
  isTrialUsed: boolean;
  trialEndsAt?: string;
  nextBillingDate?: string;
  hasDynamicPricing: boolean;
  hasPrioritySupport: boolean;
}

export default function ProfilePage() {
  const { isLoading } = useRequireAuth();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  // Fetch subscription info
  useEffect(() => {
    if (user?.id) {
      fetchSubscription();
    }
  }, [user?.id]);

  const fetchSubscription = async () => {
    try {
      setSubscriptionLoading(true);
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/subscription/user/${user?.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription({
          planName: data.plan?.name || "starter",
          displayName: data.plan?.displayName || "Starter",
          status: data.subscriptionStatus || "active",
          monthlyPrice: (data.plan?.monthlyPriceCents || 0) / 100,
          maxBookings: data.plan?.maxBookingsPerMonth || 10,
          isTrialUsed: data.isTrialUsed || false,
          trialEndsAt: data.trialExpiresAt,
          nextBillingDate: data.nextBillingDate,
          hasDynamicPricing: data.plan?.hasDynamicPricing || false,
          hasPrioritySupport: data.plan?.hasPrioritySupport || false,
        });
      }
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
          View and manage your account information
        </p>
      </div>

      {/* Subscription Card */}
      <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-violet-500/5">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Zap className="h-5 w-5 text-primary flex-shrink-0" />
            <span>Current Subscription</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Your active plan and subscription details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptionLoading ? (
            <div className="flex items-center justify-center py-6 sm:py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : subscription ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Plan Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                  <h3 className="text-xl sm:text-2xl font-bold truncate">{subscription.displayName}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {subscription.status === "trial"
                      ? "Free Trial Active"
                      : subscription.status === "starter"
                      ? "Free Plan"
                      : "Paid Plan"}
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs sm:text-sm font-semibold capitalize whitespace-nowrap">
                  {subscription.status}
                </span>
              </div>

              <hr />

              {/* Plan Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Monthly Price */}
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground block">
                    Monthly Price
                  </span>
                  <p className="text-base sm:text-lg font-semibold mt-1 truncate">
                    {subscription.monthlyPrice === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      <>R{subscription.monthlyPrice.toFixed(2)}</>
                    )}
                  </p>
                </div>

                {/* Bookings Per Month */}
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground block">
                    Bookings Per Month
                  </span>
                  <p className="text-base sm:text-lg font-semibold mt-1">
                    {subscription.maxBookings === 0 ? (
                      <span className="text-primary">Unlimited</span>
                    ) : (
                      <>
                        {subscription.maxBookings}
                        <span className="text-muted-foreground text-xs sm:text-sm ml-1">
                          bookings
                        </span>
                      </>
                    )}
                  </p>
                </div>

                {/* Features */}
                {subscription.hasPrioritySupport && (
                  <div>
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground block">
                      Support
                    </span>
                    <p className="text-base sm:text-lg font-semibold mt-1">Priority ⭐</p>
                  </div>
                )}

                {subscription.hasDynamicPricing && (
                  <div>
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground block">
                      Pricing
                    </span>
                    <p className="text-base sm:text-lg font-semibold mt-1">Dynamic Pricing</p>
                  </div>
                )}
              </div>

              {/* Trial Info */}
              {subscription.status === "trial" && subscription.trialEndsAt && (
                <>
                  <hr />
                  <Alert className="border-amber-200 bg-amber-50">
                    <Calendar className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <AlertDescription className="text-xs sm:text-sm text-amber-800 ml-2 sm:ml-0">
                      Your trial ends on{" "}
                      <strong>
                        {new Date(subscription.trialEndsAt).toLocaleDateString()}
                      </strong>
                      . Upgrade now to continue enjoying premium features.
                    </AlertDescription>
                  </Alert>
                </>
              )}

              {/* Billing Date */}
              {subscription.nextBillingDate && subscription.monthlyPrice > 0 && (
                <div className="pt-2 sm:pt-4 border-t">
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground block">
                    Next Billing Date
                  </span>
                  <p className="text-xs sm:text-sm mt-1">
                    {new Date(subscription.nextBillingDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                {subscription.status === "starter" && (
                  <Button variant="default" className="w-full sm:w-auto text-sm">Upgrade Plan</Button>
                )}
                {subscription.status !== "trial" && subscription.monthlyPrice > 0 && (
                  <Button variant="outline" className="w-full sm:w-auto text-sm">Manage Billing</Button>
                )}
                {subscription.status === "trial" && (
                  <Button variant="default" className="w-full sm:w-auto text-sm">Upgrade Now</Button>
                )}
                <Button variant="outline" className="w-full sm:w-auto text-sm">View All Plans</Button>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs sm:text-sm">
                Failed to load subscription information. Please try again later.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* User Information Card */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Account Information</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Your personal and account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Avatar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white text-lg sm:text-2xl font-bold flex-shrink-0">
              {user?.fullName
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold truncate">{user?.fullName}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>

          <hr />

          {/* User Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Full Name */}
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground block">
                Full Name
              </span>
              <p className="text-sm sm:text-lg font-medium mt-1 truncate">{user?.fullName}</p>
            </div>

            {/* Email */}
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground block">
                Email Address
              </span>
              <p className="text-sm sm:text-lg font-medium mt-1 truncate">{user?.email}</p>
            </div>

            {/* User Type */}
            <div>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground block">
                Account Type
              </span>
              <div className="mt-1">
                <span className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs sm:text-sm font-medium">
                  {user?.userType === "host" ? (
                    <>
                      <span className="text-base sm:text-lg">🏠</span>
                      <span>Host</span>
                    </>
                  ) : (
                    <>
                      <span className="text-base sm:text-lg">👤</span>
                      <span>Client</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* User ID */}
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground block">
                User ID
              </span>
              <div className="mt-1 flex flex-col sm:flex-row gap-2 sm:items-center">
                <code className="text-xs sm:text-sm bg-muted px-2 sm:px-3 py-1.5 rounded font-mono min-w-0 break-all sm:break-normal overflow-hidden">
                  {user?.id}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(user?.id || "")}
                  className="gap-2 w-full sm:w-auto text-xs sm:text-sm"
                >
                  <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Status Card */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span>Account Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="text-xs sm:text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            <AlertDescription className="ml-2 sm:ml-0">
              Your account is active and in good standing.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Security Card */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Security</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <Alert className="text-xs sm:text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <AlertDescription className="ml-2 sm:ml-0">
              Your password is securely hashed and never stored in plain text.
            </AlertDescription>
          </Alert>
          <div className="pt-2">
            <Button variant="outline" className="w-full sm:w-auto text-sm">Change Password</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
