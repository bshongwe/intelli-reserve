import * as React from "react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { CALENDAR_THEME } from "@/lib/calendar-theme"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  /** Optional theme override for accessibility or custom branding */
  theme?: typeof CALENDAR_THEME
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  theme = CALENDAR_THEME,
  ...props
}: CalendarProps) {
  return (
    <div className={cn("p-3 space-y-4", className)}>
      <style>{`
        thead {
          display: none !important;
        }
        table {
          display: grid !important;
          grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
          gap: 0.25rem !important;
          border-collapse: collapse !important;
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

      {/* Month selector - displayed by DayPicker caption */}
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className={cn(
              "text-center font-bold text-sm py-3 rounded-md border",
              theme.weekdayHeader.light,
              theme.weekdayHeader.dark
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar dates */}
      <DayPicker
        showOutsideDays={showOutsideDays}
        className="w-full"
        classNames={{
          months: "flex flex-col space-y-4",
          month: "space-y-4",
          caption: cn(
            "flex justify-center items-center gap-4 rounded-md border mb-4",
            theme.caption.container
          ),
          caption_label: theme.caption.label,
          nav: "flex gap-2",
          nav_button: cn(
            "inline-flex items-center justify-center rounded-md text-sm font-semibold h-8 w-8 p-0 transition-all hover:shadow-md active:scale-95",
            theme.navigation.button
          ),
          nav_button_previous: "",
          nav_button_next: "",
          table: "w-full grid grid-cols-7 gap-1",
          head_row: "hidden",
          head_cell: "hidden",
          tbody: "contents",
          row: "contents",
          cell: "text-center text-sm p-0",
          day: cn(
            "inline-flex items-center justify-center rounded-lg text-sm font-semibold h-10 w-10 transition-all cursor-pointer",
            theme.dayCell.base,
            theme.dayCell.interactive,
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          ),
          day_selected: cn(
            theme.selected.background,
            theme.selected.text,
            theme.selected.border,
            theme.selected.shadow,
            theme.selected.interactive
          ),
          day_today: cn(
            theme.today.background,
            theme.today.text,
            theme.today.border,
            theme.today.ring,
            theme.today.interactive
          ),
          day_outside: cn("cursor-default", theme.dayCell.outside),
          day_disabled: cn("cursor-not-allowed", theme.dayCell.disabled),
          day_hidden: "invisible",
          ...classNames,
        }}
        {...props}
      />
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
