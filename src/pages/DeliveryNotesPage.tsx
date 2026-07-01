import { useMemo, useState } from "react"
import { format, parseISO } from "date-fns"
import { FileText, Plus, Printer, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DatePicker } from "@/components/DatePicker"
import { PageHeader } from "@/components/PageHeader"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useProject } from "@/contexts/ProjectContext"
import {
  useDeliveryNotes,
  useDeleteDeliveryNote,
} from "@/hooks/useDeliveryNotes"
import { useProfiles } from "@/hooks/useItems"
import { printDeliveryNote } from "@/lib/deliveryNotePdf"
import { DeliveryNoteDialog } from "@/components/DeliveryNoteDialog"
import type { DeliveryNote } from "@/lib/types"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DNSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DeliveryNotesPage() {
  const { currentProject } = useProject()
  const { data: notes = [], isLoading } = useDeliveryNotes()
  const { data: profiles = {} } = useProfiles()
  const deleteNote = useDeleteDeliveryNote()

  const [search, setSearch] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DeliveryNote | null>(null)

  function who(id: string | null) {
    if (!id) return "—"
    const p = profiles[id]
    return p?.full_name ?? p?.username ?? "Unknown"
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return notes.filter((n) => {
      if (q && ![n.dn_number, n.deliver_to, n.location, n.po, n.customer_po]
        .filter(Boolean).some((v) => (v as string).toLowerCase().includes(q))) return false
      if (fromDate && n.dn_date < fromDate) return false
      if (toDate && n.dn_date > toDate) return false
      return true
    })
  }, [notes, search, fromDate, toDate])

  function reprint(note: DeliveryNote) {
    printDeliveryNote({
      dnNumber: note.dn_number,
      date: note.dn_date,
      projectName: currentProject?.name ?? "",
      po: note.po ?? "",
      customerPo: note.customer_po ?? "",
      deliverTo: note.deliver_to ?? "",
      location: note.location ?? "",
      contact: note.contact ?? "",
      items: note.items,
    })
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await deleteNote.mutateAsync(deleteTarget.id)
      toast.success("Delivery note deleted")
    } catch (e) {
      toast.error("Could not delete", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    } finally {
      setDeleteTarget(null)
    }
  }

  const activeFilters = !!(search || fromDate || toDate)

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <PageHeader
          eyebrow="Logistics"
          title="Delivery Notes"
          subtitle={`${notes.length} note${notes.length !== 1 ? "s" : ""} for ${currentProject?.name ?? "this project"}`}
        />
        <Button className="shrink-0 mt-1" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> New delivery note
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search DN number, recipient, location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="grid gap-1 flex-1 sm:flex-none">
            <Label className="text-xs text-muted-foreground sr-only">From</Label>
            <DatePicker
              value={fromDate}
              onChange={setFromDate}
              placeholder="From date"
              className="w-full sm:w-36"
            />
          </div>
          <div className="grid gap-1 flex-1 sm:flex-none">
            <Label className="text-xs text-muted-foreground sr-only">To</Label>
            <DatePicker
              value={toDate}
              onChange={setToDate}
              placeholder="To date"
              className="w-full sm:w-36"
            />
          </div>
          {activeFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(""); setFromDate(""); setToDate("") }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Results count when filtered */}
      {activeFilters && !isLoading && (
        <p className="text-sm text-muted-foreground">
          Showing {filtered.length} of {notes.length} notes
        </p>
      )}

      {/* List */}
      {isLoading ? (
        <DNSkeleton />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border bg-card py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <FileText className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">
              {notes.length === 0 ? "No delivery notes yet" : "No results"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {notes.length === 0
                ? "Create one manually or generate from the Procurement page."
                : "Try adjusting your search or date range."}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((note) => (
            <div
              key={note.id}
              className="group flex items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/20"
            >
              {/* Icon */}
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="size-4" />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold">
                    {note.dn_number}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {note.items.length} item{note.items.length !== 1 ? "s" : ""}
                  </Badge>
                </div>

                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                  <span>{format(parseISO(note.dn_date), "d MMM yyyy")}</span>
                  {note.deliver_to && <span>→ {note.deliver_to}</span>}
                  {note.location && <span>{note.location}</span>}
                  {note.po && <span>PO: {note.po}</span>}
                </div>

                <div className="mt-1 text-xs text-muted-foreground">
                  Generated by {who(note.generated_by)} ·{" "}
                  {format(parseISO(note.generated_at), "d MMM yyyy, HH:mm")}
                </div>

                {/* Item list preview */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {note.items.slice(0, 4).map((it, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground truncate max-w-[180px]"
                    >
                      {it.description.split("\n")[0]}
                    </span>
                  ))}
                  {note.items.length > 4 && (
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      +{note.items.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => reprint(note)}
                    >
                      <Printer className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reprint / preview PDF</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                      onClick={() => setDeleteTarget(note)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete note</TooltipContent>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual create */}
      <DeliveryNoteDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initialLines={[]}
      />

      {/* Delete confirm */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete delivery note?</DialogTitle>
            <DialogDescription>
              {deleteTarget?.dn_number} will be permanently removed. This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteNote.isPending}
            >
              {deleteNote.isPending && (
                <span className="size-4 animate-spin">⏳</span>
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
