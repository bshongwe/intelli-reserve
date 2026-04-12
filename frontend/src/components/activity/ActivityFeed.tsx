import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ActivityItem {
  readonly id: string;
  readonly type: "booking" | "service" | "payment" | "review" | "message";
  readonly title: string;
  readonly description: string;
  readonly timestamp: Date;
  readonly icon?: LucideIcon;
  readonly status?: "pending" | "completed" | "failed";
}

interface ActivityFeedProps {
  readonly items: ActivityItem[];
  readonly loading?: boolean;
}

export function ActivityFeed({ items, loading }: ActivityFeedProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "completed":
        return "bg-emerald-100 text-emerald-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "booking":
        return "bg-blue-100";
      case "service":
        return "bg-purple-100";
      case "payment":
        return "bg-emerald-100";
      case "review":
        return "bg-amber-100";
      case "message":
        return "bg-pink-100";
      default:
        return "bg-gray-100";
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${Math.round(diffInHours)}h ago`;
    const diffInDays = Math.round(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    const skeletonIds = ["sk-1", "sk-2", "sk-3"] as const;
    return (
      <div className="space-y-4">
        {skeletonIds.map((id) => (
          <div key={id} className="animate-pulse flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted w-1/3 rounded" />
              <div className="h-3 bg-muted w-2/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No activities yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            className="flex gap-4 p-4 rounded-lg border hover:border-primary/50 transition-colors"
          >
            {Icon && (
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", getTypeColor(item.type))}>
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                </div>
                {item.status && (
                  <Badge className={cn("text-xs flex-shrink-0", getStatusColor(item.status))}>
                    {item.status}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">{formatTime(item.timestamp)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
