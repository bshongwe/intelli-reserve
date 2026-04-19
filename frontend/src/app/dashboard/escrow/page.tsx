"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingDown, Clock, CheckCircle2, AlertCircle, DownloadCloud } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { getAllHolds } from "@/lib/escrow-api";
import { cn } from "@/lib/utils";

// ============================================================================
// CONSTANTS
// ============================================================================

const PAGE_TITLE = 'Escrow Holds Dashboard';
const PAGE_DESCRIPTION = 'System-wide view of all escrow holds and payments';

const STATUS_FILTERS = ["all", "held", "released", "refunded"] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string; bgColor: string }> = {
  held: { 
    label: "Held", 
    icon: Clock, 
    className: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/40"
  },
  released: { 
    label: "Released", 
    icon: CheckCircle2, 
    className: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/40"
  },
  refunded: { 
    label: "Refunded", 
    icon: TrendingDown, 
    className: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/40"
  },
};

export default function EscrowDashboardPage() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ["all-holds", filter, page],
    queryFn: () => getAllHolds(pageSize, page * pageSize, filter === "all" ? "" : filter),
    staleTime: 60 * 1000,
  });

  const holds = data?.holds || [];
  const totalCount = data?.total_count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Calculate statistics
  const totalHeldCents = holds
    .filter((h: any) => h.status === "held")
    .reduce((sum: number, h: any) => sum + (h.grossAmountCents || 0), 0);
  
  const totalReleasedCents = holds
    .filter((h: any) => h.status === "released")
    .reduce((sum: number, h: any) => sum + (h.grossAmountCents || 0), 0);
  
  const totalRefundedCents = holds
    .filter((h: any) => h.status === "refunded")
    .reduce((sum: number, h: any) => sum + (h.grossAmountCents || 0), 0);

  const formatCurrency = (cents: number) => {
    return `R${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 py-6 px-3 sm:px-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{PAGE_TITLE}</h1>
        <p className="text-sm sm:text-base text-muted-foreground">{PAGE_DESCRIPTION}</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">In Escrow</p>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold">{formatCurrency(totalHeldCents)}</p>
              <p className="text-xs text-muted-foreground">
                {holds.filter((h: any) => h.status === "held").length} holds
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Released</p>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold">{formatCurrency(totalReleasedCents)}</p>
              <p className="text-xs text-muted-foreground">
                {holds.filter((h: any) => h.status === "released").length} released
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Refunded</p>
                <TrendingDown className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold">{formatCurrency(totalRefundedCents)}</p>
              <p className="text-xs text-muted-foreground">
                {holds.filter((h: any) => h.status === "refunded").length} refunded
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setFilter(s);
              setPage(0);
            }}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize",
              filter === s
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <Alert className="border-destructive/50 bg-destructive/5">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            Failed to load escrow holds. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      {/* Holds Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {filter === "all" ? "All Holds" : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Holds`}
            <span className="ml-2 text-sm font-normal text-muted-foreground">({totalCount} total)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="text-center py-12 text-sm text-muted-foreground">Loading holds...</div>
          )}

          {!isLoading && holds.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No {filter === "all" ? "" : filter} holds found.
              </p>
            </div>
          )}

          {!isLoading && holds.length > 0 && (
            <div className="space-y-0 border rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="hidden md:grid md:grid-cols-6 gap-4 p-4 bg-muted/50 font-semibold text-xs">
                <div>Hold ID</div>
                <div>Client</div>
                <div>Amount</div>
                <div>Status</div>
                <div>Created</div>
                <div>Action</div>
              </div>

              {/* Table Rows */}
              <div className="divide-y">
                {holds.map((hold: any) => {
                  const config = statusConfig[hold.status] || statusConfig.held;
                  const StatusIcon = config.icon;

                  return (
                    <div
                      key={hold.id}
                      className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 hover:bg-muted/50 transition-colors items-center"
                    >
                      {/* Hold ID (Mobile label + value) */}
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground md:hidden">Hold ID</p>
                        <p className="text-sm font-mono truncate">{hold.id.substring(0, 8)}...</p>
                      </div>

                      {/* Client ID (Mobile label + value) */}
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground md:hidden">Client</p>
                        <p className="text-sm font-mono truncate">{hold.clientId.substring(0, 8)}...</p>
                      </div>

                      {/* Amount (Mobile label + value) */}
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground md:hidden">Amount</p>
                        <p className="text-sm font-semibold">{formatCurrency(hold.grossAmountCents)}</p>
                      </div>

                      {/* Status (Mobile label + value) */}
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground md:hidden">Status</p>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
                            config.bgColor,
                            config.className
                          )}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </div>

                      {/* Created Date (Mobile label + value) */}
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground md:hidden">Created</p>
                        <p className="text-xs text-muted-foreground">{formatDate(hold.createdAt)}</p>
                      </div>

                      {/* Action */}
                      <div className="flex justify-start md:justify-end">
                        <Link href={`/dashboard/escrow/${hold.id}`}>
                          <Button size="sm" variant="outline" className="gap-1.5">
                            <DownloadCloud className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Details</span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Page {page + 1} of {totalPages} • Showing {holds.length} of {totalCount} holds
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
