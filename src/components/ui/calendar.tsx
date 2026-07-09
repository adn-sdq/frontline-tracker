import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "relative flex flex-col",
        month: "flex flex-col gap-3",
        // Caption sits centred; nav is absolutely positioned over the same row.
        month_caption: "flex h-8 items-center justify-center",
        caption_label: "text-sm font-medium",
        nav: "absolute inset-x-0 top-0 flex h-8 items-center justify-between",
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "size-7 p-0 text-muted-foreground hover:text-foreground"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "size-7 p-0 text-muted-foreground hover:text-foreground"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "flex size-9 items-center justify-center text-[0.75rem] font-normal text-muted-foreground",
        week: "mt-0.5 flex",
        day: "size-9 p-0 text-center text-sm",
        day_button: cn(
          "inline-flex size-9 items-center justify-center rounded-md p-0 text-sm font-normal transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:hover:bg-primary"
        ),
        range_start: "day-range-start",
        range_end: "day-range-end",
        selected: "rounded-md",
        today:
          "[&:not(:has([aria-selected]))]:font-semibold [&:not(:has([aria-selected]))>button]:ring-1 [&:not(:has([aria-selected]))>button]:ring-inset [&:not(:has([aria-selected]))>button]:ring-border",
        outside: "text-muted-foreground/40",
        disabled: "text-muted-foreground/30 opacity-50",
        range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
