import * as React from "react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <div className={cn("p-3", className)}>
      <style>{`
        thead {
          display: none !important;
        }
        table {
          display: contents !important;
        }
        tbody {
          display: contents !important;
        }
        tr {
          display: contents !important;
        }
        td {
          display: contents !important;
        }
      `}</style>
      
      {/* Unified grid for headers and all dates */}
      <div className="grid grid-cols-7 gap-1">
        {/* Manual weekday headers */}
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-foreground font-semibold text-xs py-2 text-center"
          >
            {day}
          </div>
        ))}
        
        {/* Calendar picker - all cells become direct grid children */}
        <DayPicker
          showOutsideDays={showOutsideDays}
          className="contents"
          classNames={{
            months: "contents",
            month: "contents",
            caption: "hidden",
            caption_label: "text-sm font-semibold",
            nav: "space-x-1 flex items-center",
            nav_button: cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "contents",
            head_row: "contents",
            head_cell: "contents",
            row: "contents",
            cell: "text-center text-sm p-0 relative",
            day: cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 w-9"
            ),
            day_range_end: "day-range-end",
            day_selected:
              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground font-semibold",
            day_outside: "text-muted-foreground opacity-50",
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle: "bg-accent text-accent-foreground",
            day_hidden: "invisible",
            ...classNames,
          }}
          {...props}
        />
      </div>
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
