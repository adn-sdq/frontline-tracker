import { formatDistanceToNow } from "date-fns"
import { ChevronRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { StatusBadge } from "@/components/StatusControls"
import { useSystems } from "@/hooks/useSystems"
import { SYSTEM_LABELS, type Item, type Profile } from "@/lib/types"

interface Props {
  items: Item[]
  profiles: Record<string, Profile>
  onView: (item: Item) => void
  selectable?: boolean
  selectedIds?: Set<string>
  onToggle?: (id: string) => void
}

export function ItemsCards({
  items,
  profiles,
  onView,
  selectable = false,
  selectedIds,
  onToggle,
}: Props) {
  const { labelFor } = useSystems()

  function who(id: string | null) {
    if (!id) return "—"
    const p = profiles[id]
    return p?.full_name ?? p?.username ?? "Unknown"
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border bg-card py-12 text-center text-sm text-muted-foreground">
        No line items yet.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => (selectable ? onToggle?.(item.id) : onView(item))}
          className={`group w-full rounded-xl border bg-card p-3.5 text-left transition-colors hover:border-primary/40 hover:bg-accent/30 ${
            selectable && selectedIds?.has(item.id)
              ? "border-primary/60 bg-primary/5"
              : ""
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            {selectable && (
              <Checkbox
                checked={selectedIds?.has(item.id) ?? false}
                onCheckedChange={() => onToggle?.(item.id)}
                onClick={(e) => e.stopPropagation()}
                aria-label="Select item"
                className="mt-1"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="font-medium text-xs py-0">
                  {labelFor(item.system) || SYSTEM_LABELS[item.system] || item.system}
                </Badge>
                {item.unique_id && (
                  <span className="font-mono text-xs font-semibold text-primary">
                    {item.unique_id}
                  </span>
                )}
                {item.location && (
                  <span className="font-mono text-xs text-muted-foreground">
                    {item.location}
                  </span>
                )}
              </div>
              <div className="mt-1 font-medium">
                {item.brand}{item.brand && item.model_no ? " · " : ""}{item.model_no}
              </div>
              {item.description && (
                <div className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                  {item.description}
                </div>
              )}
            </div>
            <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>

          {/* Qty summary */}
          <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
            {(
              [
                ["Req", "qty_required"],
                ["Ord", "qty_ordered"],
                ["Dlv", "qty_delivered"],
                ["Ins", "qty_installed"],
              ] as const
            ).map(([label, key]) => (
              <div key={key} className="flex flex-col items-center gap-0.5">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-sm font-semibold tabular-nums">{item[key]}</span>
              </div>
            ))}
          </div>

          {/* Statuses */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <StatusBadge status={item.procurement_status} />
            <StatusBadge status={item.delivery_status} />
            <StatusBadge status={item.installation_status} />
          </div>

          {/* Attribution */}
          <div className="mt-2 text-xs text-muted-foreground">
            {who(item.updated_by)} · {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
          </div>
        </button>
      ))}
    </div>
  )
}
