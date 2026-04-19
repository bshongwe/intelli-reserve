'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, TrendingDown, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface Hold {
  id: string;
  bookingId: string;
  hostId: string;
  clientId: string;
  status: 'held' | 'released' | 'refunded';
  grossAmountCents: number;
  platformFeeCents: number;
  hostAmountCents: number;
  releasedAt?: string;
  refundedAt?: string;
  paymentReference?: string;
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string; bgColor: string }> = {
  held: {
    label: 'Held',
    icon: Clock,
    className: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/40',
  },
  released: {
    label: 'Released',
    icon: CheckCircle2,
    className: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
  },
  refunded: {
    label: 'Refunded',
    icon: TrendingDown,
    className: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/40',
  },
};

interface HostHoldsTableProps {
  readonly hostId: string;
  readonly pageSize?: number;
}

export function HostHoldsTable({ hostId, pageSize = 10 }: HostHoldsTableProps) {
  const [page, setPage] = useState(0);

  // Note: We need to create a getHostHolds function in the API
  // For now, using a placeholder that would fetch holds for this host
  const { data, isLoading, error } = useQuery({
    queryKey: ['host-holds', hostId, page],
    queryFn: async () => {
      // This would call a new endpoint we need to create
      // GET /api/escrow/holds/host/:hostId
      const response = await fetch(
        `${process.env.REACT_APP_BFF_URL || 'http://localhost:3001'}/api/escrow/holds/host/${hostId}?limit=${pageSize}&offset=${page * pageSize}`
      );
      if (!response.ok) throw new Error('Failed to fetch holds');
      const json = await response.json();
      return json;
    },
    enabled: !!hostId,
    staleTime: 60 * 1000,
  });

  const holds = data?.holds || [];
  const totalCount = data?.total_count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const formatCurrency = (cents: number) => `R${(cents / 100).toFixed(2)}`;
  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Escrow Holds
          {' '}
          <span className="ml-2 text-sm font-normal text-muted-foreground">({totalCount} total)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert className="border-destructive/50 bg-destructive/5">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">Failed to load escrow holds.</AlertDescription>
          </Alert>
        )}

        {isLoading && <div className="text-center py-8 text-sm text-muted-foreground">Loading holds...</div>}

        {!isLoading && holds.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">No escrow holds found.</div>
        )}

        {!isLoading && holds.length > 0 && (
          <div className="space-y-0 border rounded-lg overflow-hidden">
            {/* Desktop Table Header */}
            <div className="hidden md:grid md:grid-cols-6 gap-4 p-4 bg-muted/50 font-semibold text-xs sticky top-0">
              <div>Hold ID</div>
              <div>Booking</div>
              <div>Amount</div>
              <div>Status</div>
              <div>Created</div>
              <div>Released</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y">
              {holds.map((hold: Hold) => {
                const config = statusConfig[hold.status] || statusConfig.held;
                const StatusIcon = config.icon;

                return (
                  <div
                    key={hold.id}
                    className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 hover:bg-muted/50 transition-colors items-center"
                  >
                    {/* Hold ID */}
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground md:hidden">Hold ID</p>
                      <p className="text-sm font-mono truncate">{hold.id.substring(0, 8)}...</p>
                    </div>

                    {/* Booking ID */}
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground md:hidden">Booking</p>
                      <p className="text-sm font-mono truncate">{hold.bookingId.substring(0, 8)}...</p>
                    </div>

                    {/* Amount */}
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground md:hidden">Amount</p>
                      <p className="text-sm font-semibold">{formatCurrency(hold.grossAmountCents)}</p>
                    </div>

                    {/* Status */}
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground md:hidden">Status</p>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
                          config.bgColor,
                          config.className
                        )}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </div>

                    {/* Created Date */}
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground md:hidden">Created</p>
                      <p className="text-xs text-muted-foreground">{formatDate(hold.createdAt)}</p>
                    </div>

                    {/* Released Date */}
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground md:hidden">Released</p>
                      <p className="text-xs text-muted-foreground">{formatDate(hold.releasedAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>
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
  );
}
