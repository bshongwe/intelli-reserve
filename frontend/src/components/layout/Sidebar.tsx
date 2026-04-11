"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, BarChart3, Users, LogOut, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard/book", icon: Calendar, label: "Book Now" },
  { href: "/dashboard/host", icon: Users, label: "Host Dashboard" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
];

export function Sidebar() {
  const pathname = usePathname();

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
              <Icon className="w-4.5 h-4.5" strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <Button variant="ghost" className="justify-start gap-3 text-muted-foreground hover:text-destructive">
        <LogOut className="w-4 h-4" />
        Logout
      </Button>
    </div>
  );
}
