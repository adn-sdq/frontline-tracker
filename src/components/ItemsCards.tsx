import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { ChevronDown, ChevronRight, Hash, MapPin, PackagePlus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/StatusControls"
import { SerialSubPanel } from "@/components/SerialSubPanel"
import { AddToDnPopover } from "@/components/AddToDnPopover"
import { useItemSerials } from "@/hooks/useItemSerials"
import { useSystems } from "@/hooks/useSystems"
import { SYSTEM_LABELS, type DnCartEntry, type Item, type Profile } from "@/lib/types"

interface Props {
  items: Item[]
  profiles: Record<string, Profile>
  onView: (item: Item) => void
  onAdd?: () => void
  selectable?: boolean
  selectedIds?: Set<string>
  onToggle?: (id: string) => void
  cartMap?: Map<string, DnCartEntry>
  onCartChange?: (itemId: string, entry: DnCartEntry | null) => void
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

export function ItemsCardsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-36" />
          <div className="grid grid-cols-3 gap-2 pt-3 border-t">
            {[0, 1, 2].map((j) => (
              <div key={j} className="space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card py-16 px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <PackagePlus className="size-7 text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold">No items yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your first procurement item to get started.
        </p>
      </div>
      {onAdd && (
        <Button onClick={onAdd} className="mt-1">
          Add item
        </Button>
      )}
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────

function ItemCard({
  item,
  profiles,
  systemLabel,
  selectable,
  selected,
  onToggle,
  onView,
  cartEntry,
  onCartChange,
}: {
  item: Item
  profiles: Record<string, Profile>
  systemLabel: string
  selectable: boolean
  selected: boolean
  onToggle?: (id: string) => void
  onView: (item: Item) => void
  cartEntry?: DnCartEntry
  onCartChange?: (itemId: string, entry: DnCartEntry | null) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const { data: serials = [] } = useItemSerials(expanded || false ? item.id : null)
  const filledSerials = serials.filter((s) => s.serial_number).length
  const hasSerials = Number(item.qty_required) > 0

  function who(id: string | null) {
    if (!id) return null
    const p = profiles[id]
    return p?.full_name ?? p?.username ?? null
  }

  const title = [item.brand, item.model_no].filter(Boolean).join(" · ")
  const updatedBy = who(item.updated_by)

  return (
    <div
      className={[
        "group w-full overflow-hidden rounded-2xl border bg-card transition-all",
        selected
          ? "border-primary/60 bg-primary/5 shadow-sm"
          : "hover:border-border/80 hover:shadow-sm",
      ].join(" ")}
    >
      {/* ── Main tappable area ── */}
      <button
        type="button"
        onClick={() => (selectable ? onToggle?.(item.id) : onView(item))}
        className="w-full text-left active:scale-[0.99] transition-transform"
      >
        {/* Top section */}
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              {selectable && (
                <Checkbox
                  checked={selected}
                  onCheckedChange={() => onToggle?.(item.id)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Select item"
                  className="shrink-0"
                />
              )}
              <Badge variant="outline" className="shrink-0 text-xs font-semibold">
                {systemLabel}
              </Badge>
              {item.unique_id && (
                <span className="font-mono text-xs font-bold text-primary">
                  {item.unique_id}
                </span>
              )}
            </div>
            <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
          </div>

          <p className="mt-2.5 text-base font-semibold leading-snug">
            {title || <span className="text-muted-foreground">—</span>}
          </p>

          {item.location && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{item.location}</span>
            </div>
          )}
        </div>

        {/* Status grid */}
        <div className="grid grid-cols-3 gap-px border-t bg-border">
          <StatusCell label="Procurement" status={item.procurement_status} />
          <StatusCell label="Delivery" status={item.delivery_status} />
          <StatusCell label="Installation" status={item.installation_status} />
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5">
          <p className="text-xs text-muted-foreground">
            {updatedBy ? (
              <>
                Updated by{" "}
                <span className="font-medium text-foreground/80">{updatedBy}</span>
                {" · "}
              </>
            ) : null}
            {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
          </p>
        </div>
      </button>

      {/* ── Serial expand toggle ── */}
      {hasSerials && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={[
              "flex w-full items-center gap-2 border-t px-4 py-2 text-xs transition-colors",
              expanded
                ? "bg-primary/5 text-primary"
                : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
            ].join(" ")}
          >
            <Hash className="size-3 shrink-0" />
            <span className="font-medium">Serial Numbers</span>
            {filledSerials > 0 || expanded ? (
              <Badge variant={expanded ? "default" : "secondary"} className="text-xs">
                {filledSerials} / {item.qty_required}
              </Badge>
            ) : (
              <span className="text-muted-foreground/60">
                {item.qty_required} slot{Number(item.qty_required) !== 1 ? "s" : ""}
              </span>
            )}
            <ChevronDown
              className={[
                "ml-auto size-3.5 transition-transform",
                expanded ? "rotate-180" : "",
              ].join(" ")}
            />
          </button>

          {expanded && (
            <SerialSubPanel itemId={item.id} qty={Number(item.qty_required)} />
          )}
        </>
      )}

      {/* ── Add to DN ── */}
      {onCartChange && (
        <div className="border-t">
          <AddToDnPopover
            item={item}
            entry={cartEntry}
            onSave={(e) => onCartChange(item.id, e)}
            onRemove={() => onCartChange(item.id, null)}
            variant="card"
          />
        </div>
      )}
    </div>
  )
}

function StatusCell({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex flex-col gap-1.5 bg-card px-3 py-2.5">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <StatusBadge status={status} />
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function ItemsCards({
  items,
  profiles,
  onView,
  onAdd,
  selectable = false,
  selectedIds,
  onToggle,
  cartMap,
  onCartChange,
}: Props) {
  const { labelFor } = useSystems()

  if (items.length === 0) return <EmptyState onAdd={onAdd} />

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          profiles={profiles}
          systemLabel={labelFor(item.system) || SYSTEM_LABELS[item.system] || item.system}
          selectable={selectable}
          selected={selectedIds?.has(item.id) ?? false}
          onToggle={onToggle}
          onView={onView}
          cartEntry={cartMap?.get(item.id)}
          onCartChange={onCartChange}
        />
      ))}
    </div>
  )
}
