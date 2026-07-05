import type { ReactNode } from "react"

/**
 * PageHeader — the shared page title used across the app.
 * Enterprise density: compact sans-serif title with an optional muted
 * eyebrow, a subtitle, and an actions slot on the right.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string
  title: string
  subtitle?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-0.5 text-sm text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="text-xl font-semibold text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      )}
    </div>
  )
}
