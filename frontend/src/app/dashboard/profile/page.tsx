"use client";

import { useAuth } from "@/lib/auth-context";
import { useRequireAuth } from "@/lib/auth-hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Copy } from "lucide-react";
import { useState } from "react";

export default function ProfilePage() {
  const { isLoading } = useRequireAuth();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your account information
        </p>
      </div>

      {/* User Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your personal and account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white text-2xl font-bold">
              {user?.fullName
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user?.fullName}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <hr />

          {/* User Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Full Name
              </span>
              <p className="text-lg font-medium mt-1">{user?.fullName}</p>
            </div>

            {/* Email */}
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Email Address
              </span>
              <p className="text-lg font-medium mt-1">{user?.email}</p>
            </div>

            {/* User Type */}
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Account Type
              </span>
              <div className="mt-1">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium">
                  {user?.userType === "host" ? (
                    <>
                      <span className="text-lg">🏠</span>
                      <span>Host</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg">👤</span>
                      <span>Client</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* User ID */}
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                User ID
              </span>
              <div className="mt-1 flex items-center gap-2">
                <code className="text-sm bg-muted px-3 py-1 rounded font-mono flex-1 overflow-hidden">
                  {user?.id}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(user?.id || "")}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Account Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription>
              Your account is active and in good standing.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Security Card */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your password is securely hashed and never stored in plain text.
            </AlertDescription>
          </Alert>
          <div className="pt-2">
            <Button variant="outline">Change Password</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
