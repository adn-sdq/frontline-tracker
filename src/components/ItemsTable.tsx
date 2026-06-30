import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { ChevronDown, ChevronRight, Hash, MapPin } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/StatusControls"
import { SerialSubPanel } from "@/components/SerialSubPanel"
import { AddToDnPopover } from "@/components/AddToDnPopover"
import { useSystems } from "@/hooks/useSystems"
import { useItemSerials } from "@/hooks/useItemSerials"
import { SYSTEM_LABELS, type DnCartEntry, type Item, type Profile } from "@/lib/types"

interface Props {
  items: Item[]
  profiles: Record<string, Profile>
  onView: (item: Item) => void
  selectable?: boolean
  selectedIds?: Set<string>
  onToggle?: (id: string) => void
  cartMap?: Map<string, DnCartEntry>
  onCartChange?: (itemId: string, entry: DnCartEntry | null) => void
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

export function ItemsTableSkeleton() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden divide-y">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-24 ml-1" />
              </div>
              <Skeleton className="h-4 w-52" />
            </div>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="size-4 rounded shrink-0" />
        </div>
      ))}
    </div>
  )
}

// ── Table ─────────────────────────────────────────────────────────────────────

export function ItemsTable({
  items,
  profiles,
  onView,
  selectable = false,
  selectedIds,
  onToggle,
  cartMap,
  onCartChange,
}: Props) {
  const { labelFor } = useSystems()

  function who(id: string | null) {
    if (!id) return null
    const p = profiles[id]
    return p?.full_name ?? p?.username ?? null
  }

  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (items.length === 0) {
    return (
      <div className="rounded-xl border bg-card py-16 text-center text-sm text-muted-foreground">
        No items match the current filters.
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden divide-y">
      {items.map((item) => {
        const selected = selectedIds?.has(item.id) ?? false
        const title = [item.brand, item.model_no].filter(Boolean).join(" · ")
        const updatedBy = who(item.updated_by)
        const expanded = expandedId === item.id
        const hasSerials = Number(item.qty_required) > 0

        return (
          <div key={item.id}>
            <div
              className={[
                "group flex items-stretch transition-colors",
                selected ? "bg-primary/5" : expanded ? "bg-muted/30" : "hover:bg-accent/30",
              ].join(" ")}
            >
              {/* ── Main clickable area ── */}
              <button
                type="button"
                onClick={() => (selectable ? onToggle?.(item.id) : onView(item))}
                className="flex min-w-0 flex-1 items-center gap-4 px-4 py-3.5 text-left"
              >
                {selectable && (
                  <Checkbox
                    checked={selected}
                    onCheckedChange={() => onToggle?.(item.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Select item"
                    className="shrink-0"
                  />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <Badge variant="outline" className="shrink-0 py-0 text-xs font-semibold">
                      {labelFor(item.system) || SYSTEM_LABELS[item.system] || item.system}
                    </Badge>
                    {item.unique_id && (
                      <span className="font-mono text-xs font-bold text-primary shrink-0">
                        {item.unique_id}
                      </span>
                    )}
                    {item.location && (
                      <span className="flex items-center gap-0.5 text-xs text-muted-foreground min-w-0">
                        <MapPin className="size-3 shrink-0" />
                        <span className="truncate max-w-45">{item.location}</span>
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm font-medium">
                    {title || <span className="text-muted-foreground">—</span>}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {updatedBy
                      ? `${updatedBy} · ${formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}`
                      : formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
                  </p>
                </div>

                <div className="hidden shrink-0 items-center gap-1.5 lg:flex">
                  <StatusBadge status={item.procurement_status} />
                  <span className="text-xs text-muted-foreground/40">·</span>
                  <StatusBadge status={item.delivery_status} />
                  <span className="text-xs text-muted-foreground/40">·</span>
                  <StatusBadge status={item.installation_status} />
                </div>
                <div className="shrink-0 lg:hidden">
                  <StatusBadge status={item.delivery_status} />
                </div>

                <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
              </button>

              {/* ── Serial expand toggle ── */}
              {hasSerials && (
                <SerialToggle
                  itemId={item.id}
                  qty={Number(item.qty_required)}
                  expanded={expanded}
                  onToggle={() => setExpandedId(expanded ? null : item.id)}
                />
              )}

              {/* ── Add to DN ── */}
              {onCartChange && (
                <AddToDnPopover
                  item={item}
                  entry={cartMap?.get(item.id)}
                  onSave={(e) => onCartChange(item.id, e)}
                  onRemove={() => onCartChange(item.id, null)}
                />
              )}
            </div>

            {/* ── Serial sub-panel ── */}
            {expanded && hasSerials && (
              <SerialSubPanel itemId={item.id} qty={Number(item.qty_required)} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Serial expand toggle button (right edge of a table row) ──────────────────

function SerialToggle({
  itemId,
  qty,
  expanded,
  onToggle,
}: {
  itemId: string
  qty: number
  expanded: boolean
  onToggle: () => void
}) {
  const { data: serials = [] } = useItemSerials(itemId)
  const filled = serials.filter((s) => s.serial_number).length

  return (
    <button
      type="button"
      onClick={onToggle}
      title={expanded ? "Hide serial numbers" : "Show serial numbers"}
      className={[
        "flex shrink-0 flex-col items-center justify-center gap-0.5 border-l px-3 transition-colors",
        expanded
          ? "bg-primary/5 text-primary"
          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
      ].join(" ")}
    >
      <Hash className="size-3.5" />
      <span className="text-[10px] tabular-nums leading-none">
        {filled}/{qty}
      </span>
      <ChevronDown
        className={[
          "size-2.5 transition-transform",
          expanded ? "rotate-180" : "",
        ].join(" ")}
      />
    </button>
  )
}
