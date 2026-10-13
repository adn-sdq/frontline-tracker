import { useState } from "react"

import { cn } from "@/lib/utils"

const PALETTE = [
  "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
]

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? words[0]?.[1] ?? "")).toUpperCase() || "?"
}

/**
 * A project's logo, or its initials on a stable colour when it has none.
 * `src` overrides the stored logo (e.g. a local preview before upload).
 */
export function ProjectLogo({
  project,
  src,
  size = 36,
  className,
}: {
  project: { id?: string; name: string; logo_url?: string | null }
  src?: string | null
  size?: number
  className?: string
}) {
  const [broken, setBroken] = useState<string | null>(null)
  const url = src !== undefined ? src : project.logo_url
  const seed = [...(project.id ?? project.name)].reduce((a, c) => a + c.charCodeAt(0), 0)
  const style = { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.36)) }

  if (url && broken !== url) {
    return (
      <span
        className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white", className)}
        style={style}
      >
        <img src={url} alt="" className="size-full object-contain p-[8%]" onError={() => setBroken(url)} />
      </span>
    )
  }
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-lg font-semibold", PALETTE[seed % PALETTE.length], className)}
      style={style}
      aria-hidden
    >
      {initials(project.name)}
    </span>
  )
}
