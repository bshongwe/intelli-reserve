import { Button } from "@/components/ui/button";

interface BulkActionsBarProps {
  readonly selectedCount: number;
  readonly onActivate: () => void;
  readonly onDeactivate: () => void;
  readonly onDelete: () => void;
  readonly onClearSelection: () => void;
  readonly isLoading?: boolean;
}

export function BulkActionsBar({
  selectedCount,
  onActivate,
  onDeactivate,
  onDelete,
  onClearSelection,
  isLoading = false,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-muted p-4 rounded-lg flex flex-col sm:flex-row sm:items-center gap-4">
      <span className="font-medium text-sm sm:text-base">{selectedCount} selected</span>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onActivate}
          disabled={isLoading}
          className="text-xs sm:text-sm"
        >
          Activate
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDeactivate}
          disabled={isLoading}
          className="text-xs sm:text-sm"
        >
          Deactivate
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={isLoading}
          className="text-xs sm:text-sm"
        >
          Delete Selected
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          disabled={isLoading}
          className="text-xs sm:text-sm"
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
