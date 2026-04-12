import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  readonly label: string;
  readonly value: string | number;
  readonly icon?: LucideIcon;
  readonly trend?: {
    readonly value: number;
    readonly isPositive: boolean;
  };
  readonly variant?: "default" | "success" | "warning" | "destructive";
  readonly className?: string;
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: MetricCardProps) {
  const variantStyles = {
    default: "border-primary/10 bg-gradient-to-br from-primary/5 to-transparent",
    success: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-transparent",
    warning: "border-amber-200 bg-gradient-to-br from-amber-50 to-transparent",
    destructive: "border-red-200 bg-gradient-to-br from-red-50 to-transparent",
  };

  return (
    <Card className={cn("overflow-hidden", variantStyles[variant], className)}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              {label}
            </p>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight">
              {value}
            </p>
            {trend && (
              <p
                className={cn(
                  "text-xs sm:text-sm font-medium",
                  trend.isPositive ? "text-emerald-600" : "text-red-600"
                )}
              >
                {trend.isPositive ? "+" : "-"}
                {Math.abs(trend.value)}% from last month
              </p>
            )}
          </div>
          {Icon && (
            <div className="p-2 sm:p-3 rounded-lg bg-primary/10">
              <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
