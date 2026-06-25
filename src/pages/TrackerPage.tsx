import { useMemo, useState } from "react"
import {
  Download,
  FileText,
  Filter,
  Plus,
  Search,
  Upload,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

  const [viewItem, setViewItem] = useState<Item | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<Item | null>(null)
  const [historyItem, setHistoryItem] = useState<Item | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [deleteItem, setDeleteItem] = useState<Item | null>(null)

  // Delivery-note selection mode
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [dnOpen, setDnOpen] = useState(false)

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function exitSelect() {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

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
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const fc = activeFilterCount(statusFilters)
    return items.filter((i) => {
      if (system !== "ALL" && i.system !== system) return false
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
  }, [items, system, search, statusFilters])

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: items.length }
    for (const s of activeSystems) c[s.key] = 0
    for (const i of items) c[i.system] = (c[i.system] ?? 0) + 1
    return c
  }, [items, activeSystems])

  const selectedItems = useMemo(
    () => items.filter((i) => selectedIds.has(i.id)),
    [items, selectedIds]
  )

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

  const filterCount = activeFilterCount(statusFilters)
  // CSV label: show count so users know what they're exporting
  const exportLabel = items.length === filtered.length
    ? `Export (${filtered.length})`
    : `Export (${filtered.length} of ${items.length})`

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Procurement tracker
          </h1>
          <p className="text-sm text-muted-foreground">
            Line-by-line delivery &amp; installation status.
          </p>
        </div>
        {/* Desktop actions */}
        <div className="hidden flex-wrap items-center gap-2 sm:flex">
          <Button
            variant={selectMode ? "secondary" : "outline"}
            size="sm"
            onClick={() => (selectMode ? exitSelect() : setSelectMode(true))}
          >
            <FileText className="size-4" /> Delivery note
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
      </div>

      {/* ── Selection mode banner ── */}
      {selectMode && (
        <div className="sticky top-2 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-primary/5 px-4 py-2.5 shadow-sm">
          <div className="text-sm">
            <strong>{selectedIds.size}</strong> selected
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={exitSelect}>
              <X className="size-4" /> Cancel
            </Button>
            <Button
              size="sm"
              disabled={selectedIds.size === 0}
              onClick={() => setDnOpen(true)}
            >
              <FileText className="size-4" /> Generate ({selectedIds.size})
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
                checked={selectMode}
                onCheckedChange={(v) => (v ? setSelectMode(true) : exitSelect())}
              >
                <FileText className="size-4" /> Delivery note
              </DropdownMenuCheckboxItem>
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
              selectable={selectMode}
              selectedIds={selectedIds}
              onToggle={toggleSelect}
            />
          </div>
          <div className="md:hidden">
            <ItemsCards
              items={filtered}
              profiles={profiles}
              onView={setViewItem}
              onAdd={openAdd}
              selectable={selectMode}
              selectedIds={selectedIds}
              onToggle={toggleSelect}
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
        onOpenChange={(o) => { setDnOpen(o); if (!o) exitSelect() }}
        items={selectedItems}
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
