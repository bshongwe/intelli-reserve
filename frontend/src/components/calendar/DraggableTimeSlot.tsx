import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TimeSlot } from "@/schemas/serviceSchema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Trash2, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DraggableTimeSlotProps {
  readonly slot: TimeSlot;
  readonly price: number;
  readonly duration: number;
  readonly onDelete: (id: string) => void;
  readonly onToggleAvailability: (id: string) => void;
}

export function DraggableTimeSlot({
  slot,
  price,
  duration,
  onDelete,
  onToggleAvailability,
}: DraggableTimeSlotProps) {
  const [isHovering, setIsHovering] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      ref={setNodeRef}
      style={style}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={cn(
        "border rounded-lg p-4 transition-all cursor-grab active:cursor-grabbing select-none",
        isDragging && "ring-2 ring-primary bg-primary/5",
        !slot.isAvailable && "bg-muted opacity-60",
        isHovering && !isDragging && "border-primary shadow-md"
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <span className="text-lg font-semibold">{slot.startTime}</span>
        </div>
        <Badge
          variant={slot.isAvailable ? "default" : "secondary"}
          className="text-xs"
        >
          {slot.isAvailable ? "Available" : "Blocked"}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground mb-3">
        {duration} min • R{price}
      </p>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="text-xs flex-1"
          onClick={() => onToggleAvailability(slot.id)}
        >
          {slot.isAvailable ? (
            <>
              <Lock className="h-3 w-3 mr-1" />
              Block
            </>
          ) : (
            <>
              <Unlock className="h-3 w-3 mr-1" />
              Unblock
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="text-xs flex-1"
          onClick={() => onDelete(slot.id)}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );
}
