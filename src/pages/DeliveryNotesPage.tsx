import { useMemo, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { format, parseISO } from "date-fns"
import {
  Download,
  FileCheck2,
  FileText,
  Loader2,
  Plus,
  Printer,
  Search,
  Trash2,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileDropzone } from "@/components/ui/file-dropzone"
import { getSignedUrl } from "@/hooks/useDocuments"
import { useProject } from "@/contexts/ProjectContext"
import {
  useDeliveryNotes,
  useDeleteDeliveryNote,
  useRemoveSignedDn,
  useUploadSignedDn,
} from "@/hooks/useDeliveryNotes"
import { useProfiles } from "@/hooks/useItems"
import { printDeliveryNote } from "@/lib/deliveryNotePdf"
import { DeliveryNoteDialog } from "@/components/DeliveryNoteDialog"
import type { DeliveryNote } from "@/lib/types"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { SignatureBadge } from "@/components/SignatureBadge"

type SignFilter = "all" | "unsigned" | "signed"

async function openSigned(path: string) {
  try {
    const url = await getSignedUrl(path)
    window.open(url, "_blank", "noopener")
  } catch (e) {
    toast.error("Could not open file", {
      description: e instanceof Error ? e.message : "Unknown error",
    })
  }
}

// ── Signed copy dialog ────────────────────────────────────────────────────────

function SignedCopyDialog({
  note,
  who,
  onClose,
}: {
  note: DeliveryNote | null
  who: (id: string | null) => string
  onClose: () => void
}) {
  const upload = useUploadSignedDn()
  const remove = useRemoveSignedDn()
  const confirm = useConfirm()

  async function onFiles([file]: File[]) {
    if (!note || !file) return
    try {
      await upload.mutateAsync({ note, file })
      toast.success(`${note.dn_number} marked as signed`)
      onClose()
    } catch (e) {
      toast.error("Upload failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    }
  }

  async function askRemove() {
    if (!note) return
    const ok = await confirm({
      title: "Remove signed copy?",
      description: `The signed file will be deleted and ${note.dn_number} goes back to Unsigned.`,
      confirmText: "Remove",
      destructive: true,
    })
    if (!ok) return
    try {
      await remove.mutateAsync(note)
      toast.success("Signed copy removed")
      onClose()
    } catch (e) {
      toast.error("Could not remove", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    }
  }

  const signed = !!note?.signed_storage_path

  return (
    <Dialog open={!!note} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {note?.dn_number} <SignatureBadge signed={signed} />
          </DialogTitle>
          <DialogDescription>
            Upload the scan of the delivery note signed by the recipient.
          </DialogDescription>
        </DialogHeader>

        {note && signed && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-600/40 bg-emerald-50/40 p-2.5 dark:bg-emerald-950/20">
            <FileCheck2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{note.signed_file_name}</div>
              <div className="text-xs text-muted-foreground">
                {who(note.signed_uploaded_by)}
                {note.signed_uploaded_at &&
                  ` · ${format(parseISO(note.signed_uploaded_at), "d MMM yyyy, HH:mm")}`}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Open signed copy"
              onClick={() => openSigned(note.signed_storage_path!)}
            >
              <Download className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-destructive"
              aria-label="Remove signed copy"
              onClick={askRemove}
              disabled={remove.isPending}
            >
              {remove.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            </Button>
          </div>
        )}

        <FileDropzone
          accept=".pdf,image/*"
          onFiles={onFiles}
          busy={upload.isPending}
          title={signed ? "Drop a file to replace the signed copy" : "Drop the signed copy or click to browse"}
          hint="PDF or image"
        />
      </DialogContent>
    </Dialog>
  )
}

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
  const [signFilter, setSignFilter] = useState<SignFilter>("all")
  const [signingId, setSigningId] = useState<string | null>(null)
  const signingNote = notes.find((n) => n.id === signingId) ?? null

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
      if (signFilter !== "all" && (signFilter === "signed") !== !!n.signed_storage_path) return false
      return true
    })
  }, [notes, search, fromDate, toDate, signFilter])

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
        description: e instanceof Error ? e.message : "Unknown error",
      })
    }
  }

  const activeFilters = !!(search || fromDate || toDate || signFilter !== "all")
  const unsignedCount = notes.filter((n) => !n.signed_storage_path).length

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
                  <SignatureBadge signed={!!note.signed_storage_path} />
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
                {note.signed_storage_path && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-emerald-600"
                        onClick={() => openSigned(note.signed_storage_path!)}
                      >
                        <FileCheck2 className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Open signed copy</TooltipContent>
                  </Tooltip>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => setSigningId(note.id)}
                >
                  {note.signed_storage_path ? "Signed copy" : "Upload signed"}
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

      <SignedCopyDialog note={signingNote} who={who} onClose={() => setSigningId(null)} />

      {/* Manual create */}
      <DeliveryNoteDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initialLines={[]}
      />

    </div>
  )
}
