import { useMemo, useState } from "react"
import {
  Download,
  FileText,
  Filter,
  Plus,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Loader2 } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { ItemsTable, ItemsTableSkeleton } from "@/components/ItemsTable"
import { ItemsCards, ItemsCardsSkeleton } from "@/components/ItemsCards"
import { ItemDialog } from "@/components/ItemDialog"
import { ItemDetailSheet } from "@/components/ItemDetailSheet"
import { DeliveryNoteDialog } from "@/components/DeliveryNoteDialog"
import { HistoryDrawer } from "@/components/HistoryDrawer"
import { ImportDialog } from "@/components/ImportDialog"
import {
  useDeleteItem,
  useItems,
  useItemsRealtime,
  useProfiles,
} from "@/hooks/useItems"
import { useSystems } from "@/hooks/useSystems"
import { exportItemsCsv } from "@/lib/csv"
import {
  DELIVERY_STATUSES,
  INSTALLATION_STATUSES,
  PROCUREMENT_STATUSES,
  STATUS_LABELS,
  type DeliveryNoteItem,
  type DnCartEntry,
  type DeliveryStatus,
  type InstallationStatus,
  type Item,
  type ProcurementStatus,
  type System,
} from "@/lib/types"

// ── Status filter state ───────────────────────────────────────────────────────

type StatusFilters = {
  procurement: Set<ProcurementStatus>
  delivery: Set<DeliveryStatus>
  installation: Set<InstallationStatus>
}

function emptyFilters(): StatusFilters {
  return { procurement: new Set(), delivery: new Set(), installation: new Set() }
}

function activeFilterCount(f: StatusFilters) {
  return f.procurement.size + f.delivery.size + f.installation.size
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TrackerPage() {
  useItemsRealtime()
  const { data: items = [], isLoading } = useItems()
  const { data: profiles = {} } = useProfiles()
  const { activeSystems } = useSystems()
  const del = useDeleteItem()

  const [system, setSystem] = useState<System | "ALL">("ALL")
  const [search, setSearch] = useState("")
  const [statusFilters, setStatusFilters] = useState<StatusFilters>(emptyFilters())
  const [brandFilter, setBrandFilter] = useState("ALL")
  const [modelFilter, setModelFilter] = useState("ALL")

  const [viewItem, setViewItem] = useState<Item | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<Item | null>(null)
  const [historyItem, setHistoryItem] = useState<Item | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [deleteItem, setDeleteItem] = useState<Item | null>(null)

  // Delivery-note cart
  const [cart, setCart] = useState<Map<string, DnCartEntry>>(new Map())
  const [dnOpen, setDnOpen] = useState(false)

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

  function toggleStatusFilter<K extends keyof StatusFilters>(
    category: K,
    value: StatusFilters[K] extends Set<infer V> ? V : never
  ) {
    setStatusFilters((prev) => {
      const next = new Set(prev[category]) as StatusFilters[K]
      // @ts-expect-error — value is the correct element type
      next.has(value) ? next.delete(value) : next.add(value)
      return { ...prev, [category]: next }
    })
  }

  function clearFilters() {
    setStatusFilters(emptyFilters())
    setBrandFilter("ALL")
    setModelFilter("ALL")
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
    const fc = activeFilterCount(statusFilters)
    return items.filter((i) => {
      if (system !== "ALL" && i.system !== system) return false
      if (brandFilter !== "ALL" && i.brand !== brandFilter) return false
      if (modelFilter !== "ALL" && i.model_no !== modelFilter) return false
      if (q && ![i.brand, i.model_no, i.description, i.location, i.supplier, i.unique_id]
        .filter(Boolean).some((v) => (v as string).toLowerCase().includes(q))) return false
      if (fc > 0) {
        const p = statusFilters.procurement
        const d = statusFilters.delivery
        const ins = statusFilters.installation
        if (p.size > 0 && !p.has(i.procurement_status)) return false
        if (d.size > 0 && !d.has(i.delivery_status)) return false
        if (ins.size > 0 && !ins.has(i.installation_status)) return false
      }
      return true
    })
  }, [items, system, search, statusFilters, brandFilter, modelFilter])

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

  function openEdit(item: Item) {
    setEditItem(item)
    setDialogOpen(true)
  }

  async function confirmDelete() {
    if (!deleteItem) return
    try {
      await del.mutateAsync(deleteItem.id)
      toast.success("Item deleted")
    } catch (e) {
      toast.error("Could not delete", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    } finally {
      setDeleteItem(null)
    }
  }

  const filterCount = activeFilterCount(statusFilters) + (brandFilter !== "ALL" ? 1 : 0) + (modelFilter !== "ALL" ? 1 : 0)
  // CSV label: show count so users know what they're exporting
  const exportLabel = items.length === filtered.length
    ? `Export (${filtered.length})`
    : `Export (${filtered.length} of ${items.length})`

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header ── */}
      <PageHeader
        eyebrow="Procurement"
        title="Procurement Tracker"
        subtitle="Line-by-line delivery & installation status."
      >
        {/* Desktop actions */}
        <div className="hidden flex-wrap items-center gap-2 sm:flex">
          <Button
            variant={cart.size > 0 ? "default" : "outline"}
            size="sm"
            disabled={cart.size === 0}
            onClick={() => setDnOpen(true)}
          >
            <Truck className="size-4" />
            Delivery note{cart.size > 0 ? ` (${cart.size})` : ""}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="size-4" /> Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportItemsCsv(filtered)}
            disabled={filtered.length === 0}
            title={exportLabel}
          >
            <Download className="size-4" />
            <span className="hidden lg:inline">{exportLabel}</span>
            <span className="lg:hidden">Export</span>
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus className="size-4" /> Add item
          </Button>
        </div>
        {/* Mobile: just Add + overflow menu */}
        <div className="flex items-center gap-2 sm:hidden">
          <Button size="sm" onClick={openAdd}>
            <Plus className="size-4" /> Add
          </Button>
        </div>
      </PageHeader>

      {/* ── Cart banner (mobile) — shown when cart has items ── */}
      {cart.size > 0 && (
        <div className="sticky top-2 z-10 flex items-center justify-between gap-3 rounded-xl border bg-primary/5 px-4 py-2.5 shadow-sm sm:hidden">
          <div className="text-sm">
            <strong>{cart.size}</strong> item{cart.size !== 1 ? "s" : ""} in delivery
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCart(new Map())}>
              <X className="size-4" /> Clear
            </Button>
            <Button size="sm" onClick={() => setDnOpen(true)}>
              <Truck className="size-4" /> Generate
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

        {/* Search + filter row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search brand, model, room, UID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Brand filter */}
          {brands.length > 0 && (
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="hidden w-36 sm:flex">
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All brands</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Model filter */}
          {models.length > 0 && (
            <Select value={modelFilter} onValueChange={setModelFilter}>
              <SelectTrigger className="hidden w-40 sm:flex">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All models</SelectItem>
                {models.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Status filter dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={filterCount > 0 ? "default" : "outline"}
                    size="icon"
                    className="shrink-0"
                  >
                    <Filter className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>{filterCount > 0 ? `${filterCount} filter${filterCount > 1 ? "s" : ""} active` : "Filter by status"}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="flex items-center justify-between">
                Filter by status
                {filterCount > 0 && (
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={clearFilters}
                  >
                    Clear all
                  </button>
                )}
              </DropdownMenuLabel>

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Procurement
              </DropdownMenuLabel>
              {PROCUREMENT_STATUSES.map((s) => (
                <DropdownMenuCheckboxItem
                  key={s}
                  checked={statusFilters.procurement.has(s)}
                  onCheckedChange={() => toggleStatusFilter("procurement", s)}
                >
                  {STATUS_LABELS[s]}
                </DropdownMenuCheckboxItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Delivery
              </DropdownMenuLabel>
              {DELIVERY_STATUSES.map((s) => (
                <DropdownMenuCheckboxItem
                  key={s}
                  checked={statusFilters.delivery.has(s)}
                  onCheckedChange={() => toggleStatusFilter("delivery", s)}
                >
                  {STATUS_LABELS[s]}
                </DropdownMenuCheckboxItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Installation
              </DropdownMenuLabel>
              {INSTALLATION_STATUSES.map((s) => (
                <DropdownMenuCheckboxItem
                  key={s}
                  checked={statusFilters.installation.has(s)}
                  onCheckedChange={() => toggleStatusFilter("installation", s)}
                >
                  {STATUS_LABELS[s]}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile-only extra actions */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0 sm:hidden">
                    <FileText className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>More actions</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={false}
                onCheckedChange={() => setImportOpen(true)}
              >
                <Upload className="size-4" /> Import CSV
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={false}
                onCheckedChange={() => exportItemsCsv(filtered)}
              >
                <Download className="size-4" /> {exportLabel}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Active filter chips */}
        {filterCount > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {(["procurement", "delivery", "installation"] as const).map((cat) =>
              [...statusFilters[cat]].map((s) => (
                <Badge
                  key={`${cat}-${s}`}
                  variant="secondary"
                  className="gap-1 pr-1 cursor-pointer"
                  onClick={() => toggleStatusFilter(cat, s as never)}
                >
                  {STATUS_LABELS[s]}
                  <X className="size-3" />
                </Badge>
              ))
            )}
            <button
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              onClick={clearFilters}
            >
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
              cartMap={cart}
              onCartChange={handleCartChange}
            />
          </div>
          <div className="md:hidden">
            <ItemsCards
              items={filtered}
              profiles={profiles}
              onView={setViewItem}
              onAdd={openAdd}
              cartMap={cart}
              onCartChange={handleCartChange}
            />
          </div>
        </>
      )}

      {/* ── Dialogs / sheets ── */}
      <ItemDetailSheet
        item={viewItem}
        profiles={profiles}
        onEdit={(item) => { setViewItem(null); openEdit(item) }}
        onHistory={(item) => { setViewItem(null); setHistoryItem(item) }}
        onDelete={(item) => { setViewItem(null); setDeleteItem(item) }}
        onClose={() => setViewItem(null)}
      />
      <ItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editItem}
        defaultSystem={system === "ALL" ? activeSystems[0]?.key ?? "AV" : system}
      />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <DeliveryNoteDialog
        open={dnOpen}
        onOpenChange={setDnOpen}
        initialLines={cartLines}
        onSaved={() => setCart(new Map())}
      />
      <HistoryDrawer
        item={historyItem}
        profiles={profiles}
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
