import { useMemo, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { ChevronDown, Eye, Hash, History, Pencil, QrCode, Trash2 } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"

import { Skeleton } from "@/components/ui/skeleton"
import { DataTable, type ColumnMetaExtra } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/StatusControls"
import { SerialSubPanel } from "@/components/SerialSubPanel"
import { AddToDnPopover } from "@/components/AddToDnPopover"
import { useSystems } from "@/hooks/useSystems"
import { useItemSerials } from "@/hooks/useItemSerials"
import { ItemHoverCard } from "@/components/ItemHoverCard"
import {
  DELIVERY_STATUSES,
  INSTALLATION_STATUSES,
  PROCUREMENT_STATUSES,
  SYSTEM_LABELS,
  type DnCartEntry,
  type Item,
  type Profile,
} from "@/lib/types"

interface Props {
  items: Item[]
  profiles: Record<string, Profile>
  onView: (item: Item) => void
  editable?: boolean
  onEdit?: (item: Item) => void
  onHistory?: (item: Item) => void
  onDelete?: (item: Item) => void
  onLabels?: (items: Item[]) => void
  onBulkDelete?: (items: Item[]) => Promise<void>
  cartMap?: Map<string, DnCartEntry>
  onCartChange?: (itemId: string, entry: DnCartEntry | null) => void
  toolbar?: React.ReactNode
  toolbarEnd?: React.ReactNode
  menuItems?: React.ReactNode
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

export function ItemsTableSkeleton() {
  return (
    <div className="divide-y overflow-hidden rounded-xl border bg-card">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="grid grid-cols-[8rem_minmax(0,1fr)_7rem_7rem_8rem_9rem] items-center gap-x-4 px-4 py-3.5">
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

const rank = (list: readonly string[]) => (v: string) => list.indexOf(v)

// ── Table ─────────────────────────────────────────────────────────────────────

export function ItemsTable({
  items,
  profiles,
  onView,
  editable,
  onEdit,
  onHistory,
  onDelete,
  onLabels,
  onBulkDelete,
  cartMap,
  onCartChange,
  toolbar,
  toolbarEnd,
  menuItems,
}: Props) {
  const { labelFor } = useSystems()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const columns = useMemo<ColumnDef<Item, unknown>[]>(() => {
    const who = (id: string | null) => (id ? profiles[id]?.full_name ?? profiles[id]?.username ?? null : null)
    const cols: ColumnDef<Item, unknown>[] = [
      {
        id: "sku",
        accessorFn: (i) => i.sku ?? "",
        header: "SKU",
        meta: { className: "w-36 pl-3", headerClassName: "pl-3" } satisfies ColumnMetaExtra,
        cell: ({ row }) => (
          <div>
            <div className="font-mono text-xs font-bold text-primary">{row.original.sku ?? "—"}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {labelFor(row.original.system) || SYSTEM_LABELS[row.original.system] || row.original.system}
            </div>
          </div>
        ),
      },
      {
        id: "item",
        accessorFn: (i) => [i.brand, i.model_no].filter(Boolean).join(" "),
        header: "Item",
        meta: { className: "w-64 max-w-64" } satisfies ColumnMetaExtra,
        cell: ({ row }) => {
          const i = row.original
          return (
            <ItemHoverCard item={i}>
              <span className="block max-w-full truncate text-sm font-medium underline-offset-4 hover:underline">
                {[i.brand, i.model_no].filter(Boolean).join(" · ") || "—"}
              </span>
            </ItemHoverCard>
          )
        },
      },
      {
        id: "description",
        accessorFn: (i) => i.description ?? "",
        header: "Description",
        meta: { className: "w-full max-w-0" } satisfies ColumnMetaExtra,
        cell: ({ row }) => <span className="block truncate text-xs text-muted-foreground">{row.original.description || "—"}</span>,
      },
      {
        id: "procurement",
        accessorFn: (i) => i.procurement_status,
        sortingFn: (a, b) => rank(PROCUREMENT_STATUSES)(a.original.procurement_status) - rank(PROCUREMENT_STATUSES)(b.original.procurement_status),
        header: "Procurement",
        cell: ({ row }) => <StatusBadge status={row.original.procurement_status} />,
      },
      {
        id: "delivery",
        accessorFn: (i) => i.delivery_status,
        sortingFn: (a, b) => rank(DELIVERY_STATUSES)(a.original.delivery_status) - rank(DELIVERY_STATUSES)(b.original.delivery_status),
        header: "Delivery",
        cell: ({ row }) => <StatusBadge status={row.original.delivery_status} />,
      },
      {
        id: "installation",
        accessorFn: (i) => i.installation_status,
        sortingFn: (a, b) => rank(INSTALLATION_STATUSES)(a.original.installation_status) - rank(INSTALLATION_STATUSES)(b.original.installation_status),
        header: "Installation",
        cell: ({ row }) => <StatusBadge status={row.original.installation_status} />,
      },
      {
        id: "updated",
        accessorFn: (i) => i.updated_at,
        header: "Updated",
        cell: ({ row }) => {
          const by = who(row.original.updated_by)
          return (
            <div className="text-xs">
              <div className="whitespace-nowrap">{formatDistanceToNow(new Date(row.original.updated_at), { addSuffix: true })}</div>
              {by && <div className="mt-0.5 max-w-32 truncate text-muted-foreground">{by}</div>}
            </div>
          )
        },
      },
      {
        id: "serials",
        header: "Serials",
        enableSorting: false,
        meta: { className: "w-16 text-center", headerClassName: "text-center" } satisfies ColumnMetaExtra,
        cell: ({ row }) => {
          const i = row.original
          if (i.tracking === "lot") return <span className="text-[10px] text-muted-foreground">Lot {Math.round(Number(i.qty_required))}</span>
          if (!(Number(i.qty_required) > 0)) return <span className="text-muted-foreground/40">—</span>
          const open = expandedId === i.id
          return <SerialToggle itemId={i.id} qty={Number(i.qty_required)} expanded={open} onToggle={() => setExpandedId(open ? null : i.id)} />
        },
      },
    ]
    if (onCartChange) {
      cols.push({
        id: "delivery_note",
        header: "DN",
        enableSorting: false,
        enableHiding: false,
        meta: { className: "w-14 p-0" } satisfies ColumnMetaExtra,
        cell: ({ row }) => (
          <div className="flex h-full justify-center" onClick={(e) => e.stopPropagation()}>
            <AddToDnPopover
              item={row.original}
              entry={cartMap?.get(row.original.id)}
              onSave={(e) => onCartChange(row.original.id, e)}
              onRemove={() => onCartChange(row.original.id, null)}
            />
          </div>
        ),
      })
    }
    return cols
  }, [labelFor, profiles, expandedId, cartMap, onCartChange])

  return (
    <DataTable
      tableId="tracker-items-v2"
      toolbar={toolbar}
      toolbarEnd={toolbarEnd}
      menuItems={menuItems}
      defaultHidden={["description", "updated"]}
      columns={columns}
      data={items}
      getRowId={(i) => i.id}
      noun="item"
      pageSize={100}
      onRowClick={onView}
      emptyMessage="No items match the current filters."
      expandedId={expandedId}
      renderExpanded={(i) => <SerialSubPanel item={i} />}
      selection={editable ? { selected, onChange: setSelected } : undefined}
      onBulkDelete={editable ? onBulkDelete : undefined}
      bulkActions={(rows) =>
        onLabels ? (
          <button
            type="button"
            onClick={() => onLabels(rows)}
            className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-sm hover:bg-accent"
          >
            <QrCode className="size-4" /> Labels
          </button>
        ) : null
      }
      rowActions={(i) => [
        { label: "View", icon: Eye, onClick: () => onView(i) },
        { label: "Edit", icon: Pencil, onClick: () => onEdit?.(i), hidden: !editable || !onEdit },
        { label: "History", icon: History, onClick: () => onHistory?.(i), hidden: !onHistory },
        { label: "QR labels", icon: QrCode, onClick: () => onLabels?.([i]), hidden: !onLabels || !i.sku },
        { label: "Delete", icon: Trash2, onClick: () => onDelete?.(i), destructive: true, separator: true, hidden: !editable || !onDelete },
      ]}
    />
  )
}

// ── Serial expand toggle ─────────────────────────────────────────────────────

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
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      title={expanded ? "Hide serial numbers" : "Show serial numbers"}
      className={[
        "inline-flex flex-col items-center gap-0.5 rounded-md px-2 py-1 transition-colors",
        expanded ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
