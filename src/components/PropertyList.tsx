import type { ComponentType, ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * PropertyList / Property — Databricks-style label→value rows for detail
 * rails ("Job details" pattern). Labels sit in a fixed column so values
 * always align, which is what makes the panel fast to scan.
 */
export function PropertyList({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <dl
      className={cn(
        "grid grid-cols-[minmax(96px,7rem)_1fr] items-start gap-x-4 gap-y-3 text-sm",
        className
      )}
    >
      {children}
    </dl>
  )
}

export function Property({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-foreground">
        {children != null && children !== "" ? children : <span className="text-muted-foreground/50">—</span>}
      </dd>
    </>
  )
}

/**
 * DetailSection — a titled block inside a detail view (like the "Git" /
 * "Schedules & Triggers" sections in Databricks' right rail).
 */
export function DetailSection({
  title,
  icon: Icon,
  action,
  className,
  children,
}: {
  title: string
  icon?: ComponentType<{ className?: string }>
  action?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="size-4 text-muted-foreground" />}
        <h3 className="text-sm font-semibold">{title}</h3>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {children}
    </section>
  )
}
