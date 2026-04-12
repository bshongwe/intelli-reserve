/**
 * Dashboard Loading Skeleton
 * 
 * Shows a smooth loading state while dashboard data is being fetched.
 * Includes animated skeleton cards that match the dashboard layout.
 * 
 * Usage:
 * if (isLoading) return <DashboardLoadingSkeleton />;
 */

import React from "react";
import { LoadingAnimation } from "./LoadingAnimation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export interface DashboardLoadingSkeletonProps {
  /** Number of KPI cards to show (default: 4) */
  readonly kpiCount?: number;
  /** Show chart skeletons (default: true) */
  readonly showCharts?: boolean;
  /** Loading label */
  readonly label?: string;
}

function KPISkeletonCard({ cardId }: { readonly cardId: string }) {
  return (
    <Card key={cardId} className="overflow-hidden opacity-75">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 bg-gradient-to-r from-muted to-muted-foreground/20 rounded animate-pulse w-24" />
        <div className="h-5 w-5 bg-gradient-to-r from-muted to-muted-foreground/20 rounded-full animate-pulse" />
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="h-8 bg-gradient-to-r from-muted to-muted-foreground/20 rounded animate-pulse w-32" />
        <div className="h-3 bg-gradient-to-r from-muted to-muted-foreground/20 rounded animate-pulse w-24" />
      </CardContent>
    </Card>
  );
}

export function DashboardLoadingSkeleton({
  kpiCount = 4,
  showCharts = true,
  label,
}: Readonly<DashboardLoadingSkeletonProps>) {
  const kpiCards: string[] = [];
  for (let i = 0; i < kpiCount; i += 1) {
    kpiCards.push(`kpi-card-${i}`);
  }

  return (
    <div className="space-y-6 sm:space-y-8 py-6 px-3 sm:px-4 md:px-6 lg:px-8">
      {/* Header Skeleton */}
      <div className="space-y-3">
        <div className="h-8 sm:h-10 bg-gradient-to-r from-muted to-muted-foreground/20 rounded-lg animate-pulse w-48" />
        <div className="h-4 bg-gradient-to-r from-muted to-muted-foreground/20 rounded animate-pulse w-64" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((cardId) => (
          <KPISkeletonCard key={cardId} cardId={cardId} />
        ))}
      </div>

      {/* Charts Skeleton */}
      {showCharts && (
        <div className="grid gap-6 lg:grid-cols-7">
          {/* Main Chart */}
          <Card className="lg:col-span-4 overflow-hidden opacity-75">
            <CardHeader className="space-y-2">
              <div className="h-5 bg-gradient-to-r from-muted to-muted-foreground/20 rounded animate-pulse w-32" />
              <div className="h-3 bg-gradient-to-r from-muted to-muted-foreground/20 rounded animate-pulse w-64" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-64 bg-gradient-to-r from-muted to-muted-foreground/20 rounded animate-pulse" />
            </CardContent>
          </Card>

          {/* Side Chart */}
          <Card className="lg:col-span-3 overflow-hidden opacity-75">
            <CardHeader className="space-y-2">
              <div className="h-5 bg-gradient-to-r from-muted to-muted-foreground/20 rounded animate-pulse w-28" />
              <div className="h-3 bg-gradient-to-r from-muted to-muted-foreground/20 rounded animate-pulse w-56" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gradient-to-r from-muted to-muted-foreground/20 rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Centered Loading Animation */}
      <div className="flex justify-center pt-4">
        <LoadingAnimation size="md" label={label || "Loading dashboard data..."} />
      </div>
    </div>
  );
}
