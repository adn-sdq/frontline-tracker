import { cn } from "@/lib/utils"
import { PAGE_ACCESS_LABELS, PAGE_ACCESS_LEVELS, type PageAccess } from "@/lib/types"

const DOT: Record<PageAccess, string> = {
  none: "bg-muted-foreground/30",
  view: "bg-sky-500",
  edit: "bg-emerald-500",
}

/** Read-only None / View / Edit label — plain text with a status dot, not button-like. */
export function PageAccessBadge({ level, className }: { level: PageAccess; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs", level === "none" ? "text-muted-foreground/60" : "text-foreground", className)}>
      <span className={cn("size-1.5 shrink-0 rounded-full", DOT[level])} aria-hidden />
      {PAGE_ACCESS_LABELS[level]}
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
