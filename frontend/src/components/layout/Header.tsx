"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, Settings, CheckCircle2, Clock, XCircle, CalendarClock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useNotifications, type NotificationKind } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

export function Header() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { notifications, count } = useNotifications();

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
            {count > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-0.5 bg-primary text-primary-foreground rounded-full text-[10px] font-bold flex items-center justify-center">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-card border rounded-lg shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <p className="text-sm font-semibold">Notifications</p>
                {count > 0 && (
                  <span className="text-xs text-muted-foreground">{count} new</span>
                )}
              </div>
              {count === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No new notifications</p>
                </div>
              ) : (
                <ul className="divide-y max-h-80 overflow-y-auto">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <Link
                        href={n.href}
                        onClick={() => setShowNotifications(false)}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                      >
                        <NotificationIcon kind={n.kind} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold leading-snug">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.description}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
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

function NotificationIcon({ kind }: { kind: NotificationKind }) {
  const base = "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5";
  switch (kind) {
    case "booking_confirmed":
      return <span className={cn(base, "bg-emerald-100 dark:bg-emerald-900/40")}><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /></span>;
    case "booking_cancelled":
      return <span className={cn(base, "bg-destructive/10")}><XCircle className="w-3.5 h-3.5 text-destructive" /></span>;
    case "host_pending_action":
      return <span className={cn(base, "bg-amber-100 dark:bg-amber-900/40")}><CalendarClock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /></span>;
    default:
      return <span className={cn(base, "bg-primary/10")}><Clock className="w-3.5 h-3.5 text-primary" /></span>;
  }
}
