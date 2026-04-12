import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { recurringSlotSchema, RecurringSlotData } from "@/schemas/serviceSchema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { RepeatIcon } from "lucide-react";

interface RecurringSlotGeneratorProps {
  readonly onGenerateSlots: (config: RecurringSlotData) => void;
  readonly isLoading?: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

// Helper function to convert Date to yyyy-MM-dd format for date input
const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function RecurringSlotGenerator({
  onGenerateSlots,
  isLoading = false,
}: RecurringSlotGeneratorProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Default: Mon-Fri

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RecurringSlotData>({
    resolver: zodResolver(recurringSlotSchema),
    defaultValues: {
      startTime: "09:00",
      endTime: "17:00",
      daysOfWeek: selectedDays,
      startDate: formatDateForInput(new Date()),
    },
  });

  const onSubmit = (data: RecurringSlotData) => {
    if (selectedDays.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one day of the week",
        variant: "destructive",
      });
      return;
    }

    onGenerateSlots({
      ...data,
      daysOfWeek: selectedDays,
    });

    setIsOpen(false);
    reset();
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 text-xs sm:text-sm w-full sm:w-auto">
          <RepeatIcon className="h-4 w-4" />
          Generate Recurring Slots
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Recurring Slots</DialogTitle>
          <DialogDescription>
            Automatically create recurring time slots for selected days
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Time Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Time Range</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-xs">
                  Start Time
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  {...register("startTime")}
                  className="text-xs"
                />
                {errors.startTime && (
                  <p className="text-xs text-destructive">
                    {errors.startTime.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-xs">
                  End Time
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  {...register("endTime")}
                  className="text-xs"
                />
                {errors.endTime && (
                  <p className="text-xs text-destructive">
                    {errors.endTime.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Days Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Days of Week</Label>
            <div className="grid grid-cols-2 gap-3">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={selectedDays.includes(day.value)}
                    onCheckedChange={() => toggleDay(day.value)}
                  />
                  <Label htmlFor={`day-${day.value}`} className="text-xs font-normal">
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
            {errors.daysOfWeek && (
              <p className="text-xs text-destructive">{errors.daysOfWeek.message}</p>
            )}
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Date Range</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-xs">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register("startDate")}
                  className="text-xs"
                />
                {errors.startDate && (
                  <p className="text-xs text-destructive">
                    {errors.startDate.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-xs">
                  End Date (Optional)
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register("endDate")}
                  className="text-xs"
                />
                {errors.endDate && (
                  <p className="text-xs text-destructive">
                    {errors.endDate.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
              className="text-xs sm:text-sm flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="text-xs sm:text-sm flex-1"
            >
              {isLoading ? "Generating..." : "Generate"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
