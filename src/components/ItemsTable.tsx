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

export function ItemsTable({
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
      <div className="rounded-xl border bg-card py-16 text-center text-sm text-muted-foreground">
        No line items yet. Use <strong>Add item</strong> or{" "}
        <strong>Import CSV</strong> to get started.
      </div>
    )
  }

  const cols = selectable
    ? "grid-cols-[28px_1fr_auto_auto_24px]"
    : "grid-cols-[1fr_auto_auto_24px]"

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className={`grid ${cols} text-xs font-medium text-muted-foreground bg-muted/40 px-4 py-2 border-b`}>
        {selectable && <span />}
        <span>Item</span>
        <span>Status</span>
        <span className="text-right">R/O/D/I</span>
        <span />
      </div>
      {items.map((item, idx) => (
        <button
          key={item.id}
          type="button"
          onClick={() => (selectable ? onToggle?.(item.id) : onView(item))}
          className={`w-full grid ${cols} items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/40 ${
            idx !== 0 ? "border-t" : ""
          } ${selectable && selectedIds?.has(item.id) ? "bg-primary/5" : ""}`}
        >
          {selectable && (
            <Checkbox
              checked={selectedIds?.has(item.id) ?? false}
              onCheckedChange={() => onToggle?.(item.id)}
              onClick={(e) => e.stopPropagation()}
              aria-label="Select item"
            />
          )}
          {/* Identity */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="shrink-0 font-medium text-xs py-0">
                {labelFor(item.system) || SYSTEM_LABELS[item.system] || item.system}
              </Badge>
              {item.unique_id && (
                <span className="font-mono text-xs font-semibold text-primary shrink-0">
                  {item.unique_id}
                </span>
              )}
              {item.location && (
                <span className="font-mono text-xs text-muted-foreground truncate">
                  {item.location}
                </span>
              )}
            </div>
            <div className="mt-0.5 truncate font-medium text-sm">
              {item.brand}{item.brand && item.model_no ? " · " : ""}{item.model_no}
            </div>
            {item.description && (
              <div className="truncate text-xs text-muted-foreground">{item.description}</div>
            )}
            <div className="mt-1 text-xs text-muted-foreground">
              {who(item.updated_by)} · {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
            </div>
          </div>

          {/* Statuses */}
          <div className="flex flex-wrap gap-1">
            <StatusBadge status={item.procurement_status} />
            <StatusBadge status={item.delivery_status} />
            <StatusBadge status={item.installation_status} />
          </div>

          {/* Quantities */}
          <div className="text-right tabular-nums text-sm text-muted-foreground whitespace-nowrap">
            {item.qty_required}/{item.qty_ordered}/{item.qty_delivered}/{item.qty_installed}
          </div>

          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
      ))}
    </div>
  )
}
