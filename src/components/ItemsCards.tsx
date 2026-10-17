import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { ChevronDown, ChevronRight, Hash, PackagePlus, QrCode } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { StageTrack } from "@/components/StageTrack"
import { SerialSubPanel } from "@/components/SerialSubPanel"
import { ItemLabelsDialog } from "@/components/ItemLabelsDialog"
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
  const [labelsOpen, setLabelsOpen] = useState(false)
  const { data: serials = [] } = useItemSerials(expanded ? item.id : null)
  const filledSerials = serials.filter((s) => s.serial_number).length
  const qty = Math.round(Number(item.qty_required))
  const hasSerials = qty > 0 && item.tracking !== "lot"

  const title = [item.brand, item.model_no].filter(Boolean).join(" · ")
  const updatedBy = profiles[item.updated_by ?? ""]?.full_name ?? profiles[item.updated_by ?? ""]?.username ?? null
  const updated = formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })

  return (
    <div
      className={[
        "group w-full overflow-hidden rounded-2xl border bg-card transition-all",
        selected ? "border-primary/60 bg-primary/5 shadow-sm" : "hover:border-border/80 hover:shadow-sm",
      ].join(" ")}
    >
      {/* ── Main tappable area: what it is, and where it stands ── */}
      <button
        type="button"
        onClick={() => (selectable ? onToggle?.(item.id) : onView(item))}
        className="w-full p-4 text-left transition-transform active:scale-[0.99]"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {selectable && (
              <Checkbox
                checked={selected}
                onCheckedChange={() => onToggle?.(item.id)}
                onClick={(e) => e.stopPropagation()}
                aria-label="Select item"
                className="shrink-0"
              />
            )}
            <span className="truncate font-mono text-xs font-bold text-primary">{item.sku ?? "—"}</span>
            <span className="text-muted-foreground/50">·</span>
            <span className="truncate text-xs text-muted-foreground">{systemLabel}</span>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
        </div>

        <p className="mt-2 text-base leading-snug font-semibold">
          {title || <span className="text-muted-foreground">—</span>}
        </p>
        {item.description && <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{item.description}</p>}

        <StageTrack item={item} className="mt-4" />
      </button>

      {/* ── One quiet footer: serials, QR, last update ── */}
      <div className="flex items-center gap-1 border-t px-2 py-1">
        {hasSerials ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className={[
              "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors",
              expanded ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            ].join(" ")}
          >
            <Hash className="size-3 shrink-0" />
            <span className="font-medium">Serials</span>
            <Badge variant={expanded ? "default" : "secondary"} className="px-1.5 py-0 text-[10px]">
              {expanded ? `${filledSerials} / ${qty}` : qty}
            </Badge>
            <ChevronDown className={["size-3.5 transition-transform", expanded ? "rotate-180" : ""].join(" ")} />
          </button>
        ) : item.tracking === "lot" ? (
          <span className="px-2 text-xs text-muted-foreground">Bulk · one tag</span>
        ) : null}

        <button
          type="button"
          onClick={() => setLabelsOpen(true)}
          disabled={!item.sku}
          aria-label="QR labels"
          title="QR labels"
          className="ml-1 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-40"
        >
          <QrCode className="size-4" />
        </button>

        <span className="ml-auto truncate px-2 text-[11px] text-muted-foreground" title={updatedBy ? `Updated by ${updatedBy}` : undefined}>
          {updated}
        </span>
      </div>

      {expanded && hasSerials && <SerialSubPanel item={item} />}

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

      <ItemLabelsDialog items={labelsOpen ? [item] : []} onClose={() => setLabelsOpen(false)} />
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

  if (items.length === 0)
    return (
      <EmptyState
        icon={PackagePlus}
        title="No items yet"
        description="Add your first procurement item to get started."
        action={onAdd && <Button onClick={onAdd}>Add item</Button>}
      />
    )

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
