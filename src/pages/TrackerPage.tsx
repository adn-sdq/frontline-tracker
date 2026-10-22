import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useOpenOnNew } from "@/hooks/useOpenOnNew"
import { errorMessage } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import {
  Download,
  MoreHorizontal,
  Plus,
  QrCode,
  Search,
  Truck,
  Upload,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Loader2 } from "lucide-react"
import { FilterMenu, type FilterGroup } from "@/components/FilterMenu"
import { PageHeader } from "@/components/PageHeader"
import { ItemsTable, ItemsTableSkeleton } from "@/components/ItemsTable"
import { ItemsCards, ItemsCardsSkeleton } from "@/components/ItemsCards"
import { ItemDialog } from "@/components/ItemDialog"
import { ItemLabelsDialog } from "@/components/ItemLabelsDialog"
import { DeliveryNoteDialog } from "@/components/DeliveryNoteDialog"
import { HistoryDrawer } from "@/components/HistoryDrawer"
import { ImportDialog } from "@/components/ImportDialog"
import {
  useDeleteItem,
  useItems,
  useItemsRealtime,
  useProfiles,
} from "@/hooks/useItems"
import { useProject } from "@/contexts/ProjectContext"
import { useSystems } from "@/hooks/useSystems"
import { exportItemsCsv } from "@/lib/csv"
import {
  DELIVERY_STATUSES,
  INSTALLATION_STATUSES,
  PROCUREMENT_STATUSES,
  STATUS_LABELS,
  type DeliveryNoteItem,
  type DnCartEntry,
  type Item,
  type System,
} from "@/lib/types"

// ── Filters: one map of multi-select groups ───────────────────────────────────

type FilterKey = "procurement" | "delivery" | "installation" | "brand" | "model"
type Filters = Record<FilterKey, Set<string>>

function emptyFilters(): Filters {
  return { procurement: new Set(), delivery: new Set(), installation: new Set(), brand: new Set(), model: new Set() }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TrackerPage() {
  const editable = useAuth().canEdit("tracker")
  useItemsRealtime()
  const { data: items = [], isLoading } = useItems()
  const { data: profiles = {} } = useProfiles()
  const { currentProjectId } = useProject()
  const { activeSystems } = useSystems(currentProjectId)
  const del = useDeleteItem()

  const [system, setSystem] = useState<System | "ALL">("ALL")
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<Filters>(emptyFilters())

  const navigate = useNavigate()
  const setViewItem = (item: Item) => navigate(`/item/${item.id}`)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<Item | null>(null)
  const [historyItem, setHistoryItem] = useState<Item | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [deleteItem, setDeleteItem] = useState<Item | null>(null)
  const [labelItems, setLabelItems] = useState<Item[]>([])

  // Delivery-note cart + mode
  const [dnMode, setDnMode] = useState(false)
  const [cart, setCart] = useState<Map<string, DnCartEntry>>(new Map())
  const [dnOpen, setDnOpen] = useState(false)

  function enterDnMode() { setDnMode(true) }
  function exitDnMode() { setDnMode(false); setCart(new Map()) }

  function handleCartChange(itemId: string, entry: DnCartEntry | null) {
    setCart((prev) => {
      const next = new Map(prev)
      entry === null ? next.delete(itemId) : next.set(itemId, entry)
      return next
    })
  }

  const cartLines: DeliveryNoteItem[] = [...cart.values()].map((e) => ({
    description:
      [e.item.brand, e.item.model_no, e.item.description]
        .filter(Boolean)
        .join("\n") || e.item.unique_id || "",
    qty: e.qty,
    serial: e.serials.join(" / "),
  }))

  function toggleFilter(group: string, value: string) {
    setFilters((prev) => {
      const next = new Set(prev[group as FilterKey])
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return { ...prev, [group]: next }
    })
  }

  function clearFilters() {
    setFilters(emptyFilters())
  }

  const brands = useMemo(() => {
    const seen = new Set<string>()
    for (const i of items) if (i.brand) seen.add(i.brand)
    return [...seen].sort()
  }, [items])

  const models = useMemo(() => {
    const seen = new Set<string>()
    for (const i of items) if (i.model_no) seen.add(i.model_no)
    return [...seen].sort()
  }, [items])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const pass = (set: Set<string>, v: string | null) => set.size === 0 || (v != null && set.has(v))
    return items.filter((i) => {
      if (system !== "ALL" && i.system !== system) return false
      if (!pass(filters.brand, i.brand) || !pass(filters.model, i.model_no)) return false
      if (!pass(filters.procurement, i.procurement_status)) return false
      if (!pass(filters.delivery, i.delivery_status)) return false
      if (!pass(filters.installation, i.installation_status)) return false
      if (q && ![i.brand, i.model_no, i.description, i.location, i.supplier, i.unique_id, i.sku]
        .filter(Boolean).some((v) => (v as string).toLowerCase().includes(q))) return false
      return true
    })
  }, [items, system, search, filters])

  const filterGroups: FilterGroup[] = [
    { key: "procurement", label: "Procurement", options: PROCUREMENT_STATUSES.map((v) => ({ value: v, label: STATUS_LABELS[v] })) },
    { key: "delivery", label: "Delivery", options: DELIVERY_STATUSES.map((v) => ({ value: v, label: STATUS_LABELS[v] })) },
    { key: "installation", label: "Installation", options: INSTALLATION_STATUSES.map((v) => ({ value: v, label: STATUS_LABELS[v] })) },
    { key: "brand", label: "Brand", options: brands.map((v) => ({ value: v, label: v })) },
    { key: "model", label: "Model", options: models.map((v) => ({ value: v, label: v })) },
  ]
  const chipLabel = (group: FilterKey, v: string) =>
    group === "brand" || group === "model" ? v : STATUS_LABELS[v] ?? v

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: items.length }
    for (const s of activeSystems) c[s.key] = 0
    for (const i of items) c[i.system] = (c[i.system] ?? 0) + 1
    return c
  }, [items, activeSystems])

  function openAdd() {
    setEditItem(null)
    setDialogOpen(true)
  }

  useOpenOnNew(() => editable && openAdd())

  // Editing happens on the item's own page — no second layer.
  function openEdit(item: Item) {
    navigate(`/item/${item.id}?edit=1`)
  }

  async function confirmDelete() {
    if (!deleteItem) return
    try {
      await del.mutateAsync(deleteItem.id)
      toast.success("Item deleted")
    } catch (e) {
      toast.error("Could not delete", {
        description: errorMessage(e),
      })
    } finally {
      setDeleteItem(null)
    }
  }

  const filterCount = Object.values(filters).reduce((n, set) => n + set.size, 0)
  // CSV label: show count so users know what they're exporting
  const exportLabel = items.length === filtered.length
    ? `Export (${filtered.length})`
    : `Export (${filtered.length} of ${items.length})`

  const controls = (
    <>
      <div className="relative min-w-40 flex-1 md:max-w-sm">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search SKU, brand, model…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-8" />
      </div>
      <FilterMenu groups={filterGroups} selected={filters} onToggle={toggleFilter} onClear={clearFilters} />
    </>
  )

  const endActions = editable ? (
    <>
      <Button
        variant={dnMode ? "secondary" : "outline"}
        size="sm"
        className="h-9"
        onClick={() => (dnMode ? exitDnMode() : enterDnMode())}
        title={dnMode ? "Cancel delivery note" : "Pick items for a delivery note"}
      >
        <Truck className="size-4" /> <span className="hidden lg:inline">{dnMode ? "Cancel delivery" : "Delivery note"}</span>
      </Button>
      <Button size="sm" className="h-9" onClick={openAdd}>
        <Plus className="size-4" /> <span className="hidden sm:inline">Add item</span>
      </Button>
    </>
  ) : null

  const moreItems = (
    <>
      <DropdownMenuItem onClick={() => setImportOpen(true)} disabled={!editable}>
        <Upload className="size-4" /> Import CSV
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => exportItemsCsv(filtered)} disabled={filtered.length === 0}>
        <Download className="size-4" /> {exportLabel}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setLabelItems(filtered)} disabled={filtered.length === 0}>
        <QrCode className="size-4" /> QR labels ({filtered.length})
      </DropdownMenuItem>
    </>
  )

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header ── */}
      <PageHeader
        title="Procurement"
        subtitle="Line-by-line delivery & installation status."
      />

      {/* ── DN mode sticky banner (desktop + mobile) ── */}
      {dnMode && (
        <div className="sticky top-2 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-primary/5 px-4 py-2.5 shadow-sm">
          <div className="text-sm">
            {cart.size === 0
              ? <span className="text-muted-foreground">Tap <strong>+</strong> on any item to add it to the delivery</span>
              : <><strong>{cart.size}</strong> item{cart.size !== 1 ? "s" : ""} selected</>
            }
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={exitDnMode}>
              <X className="size-4" /> Cancel
            </Button>
            <Button
              size="sm"
              disabled={cart.size === 0}
              onClick={() => setDnOpen(true)}
            >
              <Truck className="size-4" /> Generate ({cart.size})
            </Button>
          </div>
        </div>
      )}

      {/* ── System tabs + search + filters ── */}
      <div className="flex flex-col gap-3">
        {/* System tabs — scrollable on mobile */}
        <div className="overflow-x-auto pb-0.5 -mx-4 px-4 sm:mx-0 sm:px-0">
          <Tabs value={system} onValueChange={(v) => setSystem(v as System | "ALL")}>
            <TabsList className="flex w-max gap-0.5">
              <TabsTrigger value="ALL" className="shrink-0">
                All · {counts.ALL ?? 0}
              </TabsTrigger>
              {activeSystems.map((s) => (
                <TabsTrigger key={s.key} value={s.key} className="shrink-0">
                  {s.label} · {counts[s.key] ?? 0}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Mobile toolbar (the desktop one lives in the table's own toolbar row) */}
        <div className="flex items-center gap-2 md:hidden">
          {controls}
          {endActions}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="size-9 shrink-0" aria-label="More options">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">{moreItems}</DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Active filter chips */}
        {filterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {(Object.keys(filters) as FilterKey[]).map((g) =>
              [...filters[g]].map((v) => (
                <Badge
                  key={`${g}-${v}`}
                  variant="secondary"
                  className="cursor-pointer gap-1 pr-1"
                  onClick={() => toggleFilter(g, v)}
                >
                  <span className="text-muted-foreground">{filterGroups.find((x) => x.key === g)?.label}:</span>
                  <span className="max-w-40 truncate">{chipLabel(g, v)}</span>
                  <X className="size-3" />
                </Badge>
              ))
            )}
            <button className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground" onClick={clearFilters}>
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── List ── */}
      {isLoading ? (
        <>
          <div className="hidden md:block">
            <ItemsTableSkeleton />
          </div>
          <div className="md:hidden">
            <ItemsCardsSkeleton />
          </div>
        </>
      ) : (
        <>
          <div className="hidden md:block">
            <ItemsTable
              items={filtered}
              profiles={profiles}
              onView={setViewItem}
              editable={editable}
              onEdit={openEdit}
              onHistory={setHistoryItem}
              onDelete={setDeleteItem}
              onLabels={setLabelItems}
              onBulkDelete={async (rows) => {
                try {
                  await Promise.all(rows.map((i) => del.mutateAsync(i.id)))
                  toast.success(`Deleted ${rows.length} item${rows.length > 1 ? "s" : ""}`)
                } catch (e) {
                  toast.error("Could not delete some items", { description: errorMessage(e) })
                }
              }}
              cartMap={dnMode ? cart : undefined}
              onCartChange={dnMode ? handleCartChange : undefined}
              toolbar={controls}
              toolbarEnd={endActions}
              menuItems={moreItems}
            />
          </div>
          <div className="md:hidden">
            <ItemsCards
              items={filtered}
              profiles={profiles}
              onView={setViewItem}
              onAdd={openAdd}
              cartMap={dnMode ? cart : undefined}
              onCartChange={dnMode ? handleCartChange : undefined}
            />
          </div>
        </>
      )}

      {/* ── Dialogs / sheets ── */}
      <ItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editItem}
        defaultSystem={system === "ALL" ? activeSystems[0]?.key ?? "AV" : system}
      />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <ItemLabelsDialog items={labelItems} onClose={() => setLabelItems([])} />
      <DeliveryNoteDialog
        open={dnOpen}
        onOpenChange={setDnOpen}
        initialLines={cartLines}
        onSaved={exitDnMode}
      />
      <HistoryDrawer
        item={historyItem}
        onClose={() => setHistoryItem(null)}
      />
      <Dialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this item?</DialogTitle>
            <DialogDescription>
              {deleteItem
                ? `${deleteItem.brand ?? ""} ${deleteItem.model_no ?? ""}`.trim() || "This line item"
                : ""}{" "}
              will be removed. History is preserved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={del.isPending}>
              {del.isPending && <Loader2 className="size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
