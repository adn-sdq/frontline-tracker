import * as React from "react"
import { format, isValid, parseISO } from "date-fns"
import { CalendarIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import {
  Popover,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  clearable?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  clearable = true,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const date = value ? parseISO(value) : undefined
  const valid = date !== undefined && isValid(date)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !valid && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 size-4 shrink-0" />
          <span className="flex-1 truncate">
            {valid ? format(date!, "d MMM yyyy") : placeholder}
          </span>
          {valid && clearable && (
            <span
              role="button"
              aria-label="Clear date"
              className="ml-1 rounded-sm opacity-70 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation()
                onChange("")
              }}
            >
              <X className="size-3.5" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      {/* No Portal — keeps the calendar inside the Dialog DOM tree so the
          Dialog focus trap doesn't block interaction with the calendar. */}
      <PopoverPrimitive.Content
        className="z-50 w-auto rounded-md border bg-popover p-0 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        align="start"
        sideOffset={4}
      >
        <Calendar
          mode="single"
          selected={valid ? date : undefined}
          onSelect={(d) => {
            onChange(d ? format(d, "yyyy-MM-dd") : "")
            setOpen(false)
          }}
          autoFocus
        />
      </PopoverPrimitive.Content>
    </Popover>
  )
}
