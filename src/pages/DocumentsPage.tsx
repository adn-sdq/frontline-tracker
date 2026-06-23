import { useMemo, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import {
  FileText,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { DocStatusBadge } from "@/components/DocStatus"
import { DocumentDialog } from "@/components/DocumentDialog"
import { DocumentDrawer } from "@/components/DocumentDrawer"
import {
  useDeleteDocument,
  useDocuments,
  useDocumentsRealtime,
  useFileCounts,
} from "@/hooks/useDocuments"
import { useProfiles } from "@/hooks/useItems"
import { useSystems } from "@/hooks/useSystems"
import {
  DOC_STATUSES,
  DOC_STATUS_LABELS,
  type DocumentRow,
} from "@/lib/types"

export default function DocumentsPage() {
  useDocumentsRealtime()
  const { data: docs = [], isLoading } = useDocuments()
  const { data: profiles = {} } = useProfiles()
  const { data: fileCounts = {} } = useFileCounts()
  const { activeSystems, labelFor } = useSystems()
  const del = useDeleteDocument()

  const [search, setSearch] = useState("")
  const [system, setSystem] = useState("ALL")
  const [status, setStatus] = useState("ALL")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDoc, setEditDoc] = useState<DocumentRow | null>(null)
  const [openDoc, setOpenDoc] = useState<DocumentRow | null>(null)
  const [deleteDoc, setDeleteDoc] = useState<DocumentRow | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return docs.filter((d) => {
      if (system !== "ALL" && d.system !== system) return false
      if (status !== "ALL" && d.status !== status) return false
      if (!q) return true
      return [d.title, d.doc_number, d.description]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q))
    })
  }, [docs, search, system, status])

  // Keep the drawer's document in sync with refreshed data.
  const liveOpenDoc = openDoc ? docs.find((d) => d.id === openDoc.id) ?? openDoc : null

  function who(id: string | null) {
    if (!id) return "—"
    const p = profiles[id]
    return p?.full_name ?? p?.username ?? "Unknown"
  }

  async function confirmDelete() {
    if (!deleteDoc) return
    try {
      await del.mutateAsync(deleteDoc.id)
      toast.success("Document deleted")
    } catch (e) {
      toast.error("Could not delete", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    } finally {
      setDeleteDoc(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground">
            Submittals & reviews between Frontline and First Fix.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditDoc(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="size-4" /> Add document
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search title, number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={system} onValueChange={setSystem}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All systems</SelectItem>
            {activeSystems.map((s) => (
              <SelectItem key={s.key} value={s.key}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {DOC_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {DOC_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-card py-16 text-center text-sm text-muted-foreground">
          No documents yet. Click <strong>Add document</strong> to start tracking
          a submittal.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filtered.map((d) => (
            <div
              key={d.id}
              className="group flex cursor-pointer flex-col gap-2 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40"
              onClick={() => setOpenDoc(d)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-medium">{d.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {[d.doc_number, d.revision].filter(Boolean).join(" · ") ||
                      "No number"}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="size-7 shrink-0">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenuItem
                      onClick={() => {
                        setEditDoc(d)
                        setDialogOpen(true)
                      }}
                    >
                      <Pencil className="size-4" /> Edit details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeleteDoc(d)}
                    >
                      <Trash2 className="size-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <DocStatusBadge status={d.status} />
                {d.system && (
                  <Badge variant="outline">{labelFor(d.system)}</Badge>
                )}
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <FileText className="size-3.5" />
                  {fileCounts[d.id] ?? 0}
                </span>
              </div>

              <div className="text-xs text-muted-foreground">
                Updated by{" "}
                <span className="font-medium text-foreground">
                  {who(d.updated_by)}
                </span>{" "}
                {formatDistanceToNow(new Date(d.updated_at), { addSuffix: true })}
              </div>
            </div>
          ))}
        </div>
      )}

      <DocumentDialog open={dialogOpen} onOpenChange={setDialogOpen} doc={editDoc} />
      <DocumentDrawer
        doc={liveOpenDoc}
        profiles={profiles}
        onClose={() => setOpenDoc(null)}
      />

      <Dialog open={!!deleteDoc} onOpenChange={(o) => !o && setDeleteDoc(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this document?</DialogTitle>
            <DialogDescription>
              "{deleteDoc?.title}" and all its uploaded files and comments will be
              permanently removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDoc(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={del.isPending}
            >
              {del.isPending && <Loader2 className="size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
