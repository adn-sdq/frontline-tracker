import type { ComponentType, ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * Compact KPI tile: label, a big number, optional hint. `tone` colours the
 * value only when it needs attention — neutral by default.
 */
export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  onClick,
  active,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: ComponentType<{ className?: string }>
  tone?: "default" | "danger" | "warning" | "success"
  onClick?: () => void
  active?: boolean
}) {
  const Comp = onClick ? "button" : "div"
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex min-w-0 flex-col gap-1 rounded-lg border bg-card p-3 text-left",
        onClick && "transition-colors hover:border-primary/40",
        active && "border-primary ring-1 ring-primary/30"
      )}
    >
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {Icon && <Icon className="size-3.5" />}
        {label}
      </span>
      <span
        className={cn(
          "text-2xl font-semibold tabular-nums",
          tone === "danger" && "text-destructive",
          tone === "warning" && "text-amber-600 dark:text-amber-400",
          tone === "success" && "text-emerald-600 dark:text-emerald-400"
        )}
      >
        {value}
      </span>
      {hint && <span className="truncate text-xs text-muted-foreground">{hint}</span>}
    </Comp>
  )
}
