import { useMemo, useState } from "react"
import { useOpenOnNew } from "@/hooks/useOpenOnNew"
import { useAuth } from "@/contexts/AuthContext"
import { format, parseISO } from "date-fns"
import {
  FileText,
  Paperclip,
  Plus,
  Printer,
  Search,
  Trash2,
  Upload,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { DatePicker } from "@/components/DatePicker"
import { ActionButton } from "@/components/shell/ActionButton"
import { PageHeader } from "@/components/PageHeader"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { Label } from "@/components/ui/label"
import { useProject } from "@/contexts/ProjectContext"
import {
  useDeliveryNotes,
  useDeleteDeliveryNote,
  useDeliveryNoteFiles,
} from "@/hooks/useDeliveryNotes"
import { DeliveryNoteFilesDialog } from "@/components/DeliveryNoteFilesDialog"
import { ManualDeliveryNoteDialog } from "@/components/ManualDeliveryNoteDialog"
import { useProfiles } from "@/hooks/useItems"
import { printDeliveryNote, type DeliveryNotePrintData } from "@/lib/deliveryNotePdf"
import { DeliveryNoteDialog } from "@/components/DeliveryNoteDialog"
import type { DeliveryNote } from "@/lib/types"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn, errorMessage } from "@/lib/utils"
import { SignatureBadge } from "@/components/SignatureBadge"

type SignFilter = "all" | "unsigned" | "signed"

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
  const editable = useAuth().canEdit("tracker")
  const { currentProject } = useProject()
  const { data: notes = [], isLoading } = useDeliveryNotes()
  const { data: profiles = {} } = useProfiles()
  const deleteNote = useDeleteDeliveryNote()
  const confirm = useConfirm()

  const [search, setSearch] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  useOpenOnNew(() => setCreateOpen(true))
  const [signFilter, setSignFilter] = useState<SignFilter>("all")
  const [manualOpen, setManualOpen] = useState(false)
  const [filesId, setFilesId] = useState<string | null>(null)
  const filesNote = notes.find((n) => n.id === filesId) ?? null
  const { data: allFiles = [] } = useDeliveryNoteFiles()
  // A note is Signed when any of its files is marked signed.
  const filesByNote = useMemo(() => {
    const m = new Map<string, typeof allFiles>()
    for (const f of allFiles) m.set(f.delivery_note_id, [...(m.get(f.delivery_note_id) ?? []), f])
    return m
  }, [allFiles])
  const isSigned = (n: DeliveryNote) => !!filesByNote.get(n.id)?.some((f) => f.kind === "signed")

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
      if (signFilter !== "all" && (signFilter === "signed") !== isSigned(n)) return false
      return true
    })
  }, [notes, search, fromDate, toDate, signFilter])

  function printDataFor(note: DeliveryNote): DeliveryNotePrintData {
    return {
      dnNumber: note.dn_number,
      date: note.dn_date,
      projectName: currentProject?.name ?? "",
      po: note.po ?? "",
      customerPo: note.customer_po ?? "",
      deliverTo: note.deliver_to ?? "",
      location: note.location ?? "",
      contact: note.contact ?? "",
      companyContact: note.company_contact ?? "",
      items: note.items,
    }
  }

  const reprint = (note: DeliveryNote) => printDeliveryNote(printDataFor(note))

  async function askDelete(note: DeliveryNote) {
    const ok = await confirm({
      title: "Delete delivery note?",
      description: `${note.dn_number} will be permanently removed. This can't be undone.`,
      confirmText: "Delete",
      destructive: true,
    })
    if (!ok) return
    try {
      await deleteNote.mutateAsync(note)
      toast.success("Delivery note deleted")
    } catch (e) {
      toast.error("Could not delete", {
        description: errorMessage(e),
      })
    }
  }

  const activeFilters = !!(search || fromDate || toDate || signFilter !== "all")
  const unsignedCount = notes.filter((n) => !isSigned(n)).length

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Delivery Notes"
        subtitle={`${notes.length} note${notes.length !== 1 ? "s" : ""} for ${currentProject?.name ?? "this project"}`}
      />

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
              onClick={() => { setSearch(""); setFromDate(""); setToDate(""); setSignFilter("all") }}
            >
              Clear
            </Button>
          )}
          {editable && (
            <ActionButton
              icon={Upload}
              label="Upload existing note"
              onClick={() => setManualOpen(true)}
            />
          )}
          {editable && (
            <ActionButton
              icon={Plus}
              label="New delivery note"
              primary
              onClick={() => setCreateOpen(true)}
            />
          )}
        </div>
      </div>

      {/* Signature filter */}
      <div className="inline-flex self-start rounded-sm border p-0.5" role="radiogroup" aria-label="Signature status">
        {(["all", "unsigned", "signed"] as const).map((f) => (
          <button
            key={f}
            type="button"
            role="radio"
            aria-checked={signFilter === f}
            onClick={() => setSignFilter(f)}
            className={cn(
              "rounded-[2px] px-2.5 py-1 text-xs font-medium capitalize transition-colors",
              signFilter === f
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f}
            {f === "unsigned" && unsignedCount > 0 && ` (${unsignedCount})`}
          </button>
        ))}
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
        <EmptyState
          icon={FileText}
          title={notes.length === 0 ? "No delivery notes yet" : "No results"}
          description={
            notes.length === 0
              ? "Create one manually or generate from the Procurement page."
              : "Try adjusting your search or date range."
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((note) => (
            <div
              key={note.id}
              role="button"
              tabIndex={0}
              onClick={() => setFilesId(note.id)}
              onKeyDown={(e) => {
                if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault()
                  setFilesId(note.id)
                }
              }}
              className="group flex cursor-pointer items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors outline-none hover:bg-accent/20 focus-visible:ring-2 focus-visible:ring-ring"
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
                  <SignatureBadge signed={isSigned(note)} />
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
              <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => setFilesId(note.id)}
                >
                  <Paperclip className="size-3.5" />
                  Files{(filesByNote.get(note.id)?.length ?? 0) + (note.items.length ? 1 : 0) > 0 ? ` (${(filesByNote.get(note.id)?.length ?? 0) + (note.items.length ? 1 : 0)})` : ""}
                </Button>
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
                      onClick={() => askDelete(note)}
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

      <DeliveryNoteFilesDialog
        note={filesNote}
        files={allFiles}
        printData={filesNote ? printDataFor(filesNote) : null}
        who={who}
        canEdit={editable}
        onClose={() => setFilesId(null)}
      />
      <ManualDeliveryNoteDialog open={manualOpen} onOpenChange={setManualOpen} />

      {/* Manual create */}
      <DeliveryNoteDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initialLines={[]}
      />

    </div>
  )
}
