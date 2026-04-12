import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatBadgeProps {
  readonly icon?: LucideIcon;
  readonly label: string;
  readonly value: string | number;
  readonly variant?: "default" | "outline" | "secondary";
  readonly className?: string;
}

export function StatBadge({
  icon: Icon,
  label,
  value,
  variant = "default",
  className,
}: StatBadgeProps) {
  const variantStyles = {
    default: "bg-primary/10 text-primary border-primary/20",
    outline: "border border-muted-foreground/20 text-muted-foreground",
    secondary: "bg-secondary text-secondary-foreground",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium",
        variantStyles[variant],
        className
      )}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span>{label}:</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
