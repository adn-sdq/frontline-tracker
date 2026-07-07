import type { ComponentType, ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * Consistent empty-state block used across list/table views when there is
 * no data yet. Provide an `icon`, a short `title`, an optional `description`
 * and an optional `action` (usually a Button).
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: ComponentType<{ className?: string }>
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
  /** Tighter padding for use inside cards / narrow panels. */
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-2xl border border-dashed bg-card text-center",
        compact ? "px-4 py-10" : "px-6 py-16",
        className
      )}
    >
      {Icon && (
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <Icon className="size-7 text-muted-foreground" />
        </div>
      )}
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
