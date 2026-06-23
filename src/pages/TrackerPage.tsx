import { useMemo, useState } from "react"
import { Download, Loader2, Plus, Search, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import { DashboardCards } from "@/components/DashboardCards"
import { ItemsTable } from "@/components/ItemsTable"
import { ItemDialog } from "@/components/ItemDialog"
import { HistoryDrawer } from "@/components/HistoryDrawer"
import { ImportDialog } from "@/components/ImportDialog"
import {
  useDeleteItem,
  useItems,
  useItemsRealtime,
  useProfiles,
} from "@/hooks/useItems"
import { exportItemsCsv } from "@/lib/csv"
import {
  SYSTEMS,
  SYSTEM_LABELS,
  type Item,
  type System,
} from "@/lib/types"

export default function TrackerPage() {
  useItemsRealtime()
  const { data: items = [], isLoading } = useItems()
  const { data: profiles = {} } = useProfiles()
  const del = useDeleteItem()

  const [system, setSystem] = useState<System | "ALL">("ALL")
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<Item | null>(null)
  const [historyItem, setHistoryItem] = useState<Item | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [deleteItem, setDeleteItem] = useState<Item | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((i) => {
      if (system !== "ALL" && i.system !== system) return false
      if (!q) return true
      return [i.brand, i.model_no, i.description, i.location, i.supplier]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q))
    })
  }, [items, system, search])

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: items.length }
    for (const s of SYSTEMS) c[s] = 0
    for (const i of items) c[i.system] = (c[i.system] ?? 0) + 1
    return c
  }, [items])

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

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Procurement tracker</h1>
          <p className="text-sm text-muted-foreground">
            Line-by-line delivery & on-site installation status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="size-4" /> Import CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportItemsCsv(filtered)}
            disabled={filtered.length === 0}
          >
            <Download className="size-4" /> Export
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus className="size-4" /> Add item
          </Button>
        </div>
      </div>

      <DashboardCards items={filtered} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={system} onValueChange={(v) => setSystem(v as System | "ALL")}>
          <TabsList>
            <TabsTrigger value="ALL">All · {counts.ALL ?? 0}</TabsTrigger>
            {SYSTEMS.map((s) => (
              <TabsTrigger key={s} value={s}>
                {SYSTEM_LABELS[s]} · {counts[s] ?? 0}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-64">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search brand, model, room…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ItemsTable
          items={filtered}
          profiles={profiles}
          onEdit={openEdit}
          onHistory={setHistoryItem}
          onDelete={setDeleteItem}
        />
      )}

      <ItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editItem}
        defaultSystem={system === "ALL" ? "AV" : system}
      />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
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
                ? `${deleteItem.brand ?? ""} ${deleteItem.model_no ?? ""}`.trim() ||
                  "This line item"
                : ""}{" "}
              will be removed. It stays recoverable in the edit history.
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
