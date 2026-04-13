"use client";

import { Zap } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="shrink-0 w-8 h-8 bg-gradient-to-br from-primary to-rose-600 rounded-xl flex items-center justify-center shadow-md shadow-primary/30">
        <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
      </div>
      <span className="font-bold text-xl bg-gradient-to-r from-rose-600 to-primary bg-clip-text text-transparent">
        IntelliReserve
      </span>
    </div>
  );
}
