"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

export function Header() {
  return (
    <header className="border-b bg-card/80 backdrop-blur-sm px-6 py-3.5 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
        </Button>
        <Button variant="outline" className="gap-2">
          <span className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white text-xs font-bold">U</span>
          Profile
        </Button>
      </div>
    </header>
  );
}
