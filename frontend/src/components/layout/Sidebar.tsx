"use client";

import Link from "next/link";
import { Calendar, BarChart3, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  return (
    <div className="w-64 border-r bg-card p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="w-8 h-8 bg-primary rounded-xl" />
        <h1 className="font-bold text-xl">IntelliReserve</h1>
      </div>

      <nav className="space-y-1 flex-1">
        <Link href="/dashboard/book" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
          <Calendar className="w-5 h-5" />
          <span>Book Now</span>
        </Link>
        <Link href="/dashboard/host" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
          <Users className="w-5 h-5" />
          <span>Host Dashboard</span>
        </Link>
        <Link href="/dashboard/analytics" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
          <BarChart3 className="w-5 h-5" />
          <span>Analytics</span>
        </Link>
      </nav>

      <Button variant="ghost" className="justify-start gap-3">
        <LogOut className="w-5 h-5" />
        Logout
      </Button>
    </div>
  );
}
