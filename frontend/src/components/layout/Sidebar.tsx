"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, BarChart3, Users, LogOut, Zap, Settings, Briefcase, User, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const hostNavItems = [
  { href: "/dashboard/host", icon: Home, label: "Dashboard" },
  { href: "/dashboard/host/services", icon: Briefcase, label: "My Services" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/dashboard/profile", icon: User, label: "Profile" },
  { href: "/dashboard/host/settings", icon: Settings, label: "Settings" },
];

const clientNavItems = [
  { href: "/dashboard/client", icon: Home, label: "Dashboard" },
  { href: "/dashboard/book", icon: Search, label: "Book a Service" },
  { href: "/dashboard/client/bookings", icon: Calendar, label: "My Bookings" },
  { href: "/dashboard/profile", icon: User, label: "Profile" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const navItems = user?.userType === "host" ? hostNavItems : clientNavItems;

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="w-64 border-r bg-card p-4 flex flex-col shadow-sm">
      <div className="flex items-center gap-2.5 mb-8 px-2">
        <div className="shrink-0 w-8 h-8 bg-gradient-to-br from-primary to-rose-600 rounded-xl flex items-center justify-center shadow-md shadow-primary/30">
          <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="min-w-0 font-bold text-xl bg-gradient-to-r from-rose-600 to-primary bg-clip-text text-transparent">
          IntelliReserve
        </h1>
      </div>

      {user && (
        <div className="mb-6 px-3 py-2.5 rounded-lg bg-muted/50 border border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">
            {user.userType === "host" ? "Host Account" : "Client Account"}
          </p>
          <p className="text-sm font-medium text-foreground truncate">{user.fullName}</p>
        </div>
      )}

      <nav className="space-y-1 flex-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
                active
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                  : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <Button
        variant="ghost"
        className="justify-start gap-3 text-muted-foreground hover:text-destructive"
        onClick={handleLogout}
      >
        <LogOut className="w-4 h-4" />
        Logout
      </Button>
    </div>
  );
}
