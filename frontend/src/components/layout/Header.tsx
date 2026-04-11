"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="border-b bg-card px-6 py-4 flex items-center justify-between">
      <h2 className="text-xl font-semibold">Dashboard</h2>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Button variant="outline">Profile</Button>
      </div>
    </header>
  );
}
