import { Eye, Pencil } from "lucide-react"

import { cn } from "@/lib/utils"
import { PAGE_ACCESS_LABELS, PAGE_ACCESS_LEVELS, type PageAccess } from "@/lib/types"

const STYLES: Record<PageAccess, string> = {
  none: "text-muted-foreground/50",
  view: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  edit: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
}

/** Compact None / View / Edit indicator. */
export function PageAccessBadge({ level, className }: { level: PageAccess; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium", STYLES[level], className)}>
      {level === "edit" && <Pencil className="size-3" />}
      {level === "view" && <Eye className="size-3" />}
      {level === "none" ? "—" : level === "edit" ? "Edit" : "View"}
    </span>
  )
}

/** Segmented None / View / Edit control. */
export function PageAccessPicker({
  value,
  onChange,
  disabled,
}: {
  value: PageAccess
  onChange: (v: PageAccess) => void
  disabled?: boolean
}) {
  return (
    <div className="inline-flex rounded-sm border p-0.5" role="radiogroup">
      {PAGE_ACCESS_LEVELS.map((lvl) => (
        <button
          key={lvl}
          type="button"
          role="radio"
          aria-checked={value === lvl}
          title={PAGE_ACCESS_LABELS[lvl]}
          disabled={disabled}
          onClick={() => onChange(lvl)}
          className={cn(
            "rounded-[2px] px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed",
            value === lvl
              ? lvl === "none"
                ? "bg-muted text-foreground"
                : lvl === "view"
                  ? "bg-sky-600 text-white"
                  : "bg-emerald-600 text-white"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {lvl === "none" ? "None" : lvl === "view" ? "View" : "Edit"}
        </button>
      ))}
    </div>
  )
}
