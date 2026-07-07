import type { ComponentType } from "react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * Compact icon-only action button used in the top-bar action slot.
 * Label is surfaced via tooltip so the top bar stays clean and consistent
 * across pages. Use `primary` for the main CTA (filled) and `active` for
 * a toggled mode.
 */
export function ActionButton({
  icon: Icon,
  label,
  onClick,
  primary,
  active,
  disabled,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  primary?: boolean
  active?: boolean
  disabled?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant={active ? "secondary" : primary ? "default" : "outline"}
          className="size-9"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
        >
          <Icon className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  )
}
