import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { ChevronDown, Hash } from "lucide-react"

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

// One shared column template so the header and every row line up exactly.
const COLS = "lg:grid-cols-[8rem_minmax(0,1fr)_7rem_7rem_8rem_9rem]"
const COLS_SELECTABLE = "lg:grid-cols-[1.5rem_8rem_minmax(0,1fr)_7rem_7rem_8rem_9rem]"

// ── Skeleton ──────────────────────────────────────────────────────────────────

export function ItemsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card divide-y">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`grid items-center gap-x-4 px-4 py-3.5 ${COLS}`}>
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-4 w-52 max-w-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-3.5 w-24" />
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
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const cols = selectable ? COLS_SELECTABLE : COLS

  function who(id: string | null) {
    if (!id) return null
    const p = profiles[id]
    return p?.full_name ?? p?.username ?? null
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border bg-card py-16 text-center text-sm text-muted-foreground">
        No items match the current filters.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {/* ── Column headers ── */}
      <div className="hidden items-stretch border-b bg-muted/40 text-[11px] font-medium tracking-wide text-muted-foreground uppercase lg:flex">
        <div className={`grid min-w-0 flex-1 items-center gap-x-4 px-4 py-2 ${cols}`}>
          {selectable && <span />}
          <span>SKU</span>
          <span>Item</span>
          <span>Procurement</span>
          <span>Delivery</span>
          <span>Installation</span>
          <span>Updated</span>
        </div>
        <div className="flex w-14 shrink-0 items-center justify-center border-l">Serials</div>
        {onCartChange && <div className="w-14 shrink-0 border-l" />}
      </div>

      <div className="divide-y">
        {items.map((item) => {
          const selected = selectedIds?.has(item.id) ?? false
          const title = [item.brand, item.model_no].filter(Boolean).join(" · ")
          const updatedBy = who(item.updated_by)
          const expanded = expandedId === item.id
          const hasSerials = Number(item.qty_required) > 0 && item.tracking !== "lot"
          const system = labelFor(item.system) || SYSTEM_LABELS[item.system] || item.system

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
                  className={`grid min-w-0 flex-1 items-center gap-x-4 gap-y-2 px-4 py-3 text-left ${cols}`}
                >
                  {selectable && (
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => onToggle?.(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Select item"
                    />
                  )}

                  {/* SKU + system */}
                  <div className="flex items-baseline gap-2 lg:block">
                    <div className="font-mono text-xs font-bold text-primary">{item.sku ?? "—"}</div>
                    <div className="truncate text-xs text-muted-foreground lg:mt-0.5">{system}</div>
                  </div>

                  {/* Item */}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {title || <span className="text-muted-foreground">—</span>}
                    </p>
                    {item.description && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.description}</p>
                    )}
                  </div>

                  {/* Statuses — one column each on desktop, a single row on small screens */}
                  <div className="flex flex-wrap items-center gap-1.5 lg:contents">
                    <div className="min-w-0"><StatusBadge status={item.procurement_status} /></div>
                    <div className="min-w-0"><StatusBadge status={item.delivery_status} /></div>
                    <div className="min-w-0"><StatusBadge status={item.installation_status} /></div>
                  </div>

                  {/* Updated */}
                  <div className="hidden min-w-0 text-xs lg:block">
                    <div className="truncate">{formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}</div>
                    {updatedBy && <div className="mt-0.5 truncate text-muted-foreground">{updatedBy}</div>}
                  </div>
                </button>

                {/* ── Serial expand toggle ── */}
                {hasSerials ? (
                  <SerialToggle
                    itemId={item.id}
                    qty={Number(item.qty_required)}
                    expanded={expanded}
                    onToggle={() => setExpandedId(expanded ? null : item.id)}
                  />
                ) : (
                  <div
                    className="flex w-14 shrink-0 items-center justify-center border-l text-[10px] text-muted-foreground/60"
                    title={item.tracking === "lot" ? "Tracked as one lot" : undefined}
                  >
                    {item.tracking === "lot" ? `Lot ${Math.round(Number(item.qty_required))}` : "—"}
                  </div>
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
              {expanded && hasSerials && <SerialSubPanel item={item} />}
            </div>
          )
        })}
      </div>
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
        "flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 border-l transition-colors",
        expanded ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
      ].join(" ")}
    >
      <Hash className="size-3.5" />
      <span className="text-[10px] leading-none tabular-nums">
        {filled}/{qty}
      </span>
      <ChevronDown className={["size-2.5 transition-transform", expanded ? "rotate-180" : ""].join(" ")} />
    </button>
  )
}
