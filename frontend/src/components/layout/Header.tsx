"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export function Header() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setShowProfile(false);
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <header className="border-b bg-card/80 backdrop-blur-sm px-6 py-3.5 flex items-center justify-between sticky top-0 z-10">
        <div className="animate-pulse">Loading...</div>
      </header>
    );
  }

  // Get user initials for avatar
  const initials = user?.fullName
    ?.trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <header className="border-b bg-card/80 backdrop-blur-sm px-6 py-3.5 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live</span>
        </span>
      </div>
      <div className="flex items-center gap-3 relative">
        <ThemeToggle />
        
        {/* Notifications Bell */}
        <div className="relative">
          <Button
            variant="outline"
            size="icon"
            className="relative hover:bg-secondary transition-colors"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
          </Button>
          
          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-card border rounded-lg shadow-lg z-50">
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-semibold">Notifications</p>
              </div>
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">No new notifications</p>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <Button
            variant="outline"
            className="gap-2 hover:bg-secondary transition-colors"
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
          >
            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </span>
            <span className="hidden sm:inline text-sm">{user?.fullName || "Profile"}</span>
          </Button>

          {/* Profile Dropdown Menu */}
          {showProfile && (
            <div className="absolute right-0 mt-2 w-56 bg-card border rounded-lg shadow-lg z-50">
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-semibold">{user?.fullName || "User"}</p>
                <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {user?.userType === "host" ? "🏠 Host" : "👤 Client"}
                </p>
              </div>
              <div className="py-1">
                <Link
                  href="/dashboard/profile"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
                  onClick={() => setShowProfile(false)}
                >
                  <span className="text-lg">👤</span>
                  <span>View Profile</span>
                </Link>
                <Link
                  href="/dashboard/host/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
                  onClick={() => setShowProfile(false)}
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>Settings</span>
                </Link>
              </div>
              <div className="border-t">
                <button
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-secondary w-full transition-colors disabled:opacity-50"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <LogOut className="h-4 w-4" />
                  <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
