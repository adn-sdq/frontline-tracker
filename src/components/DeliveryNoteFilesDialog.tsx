import { useMemo, useState } from "react"
import { format, parseISO } from "date-fns"
import { Download, Eye, FileText, Loader2, Printer, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileDropzone } from "@/components/ui/file-dropzone"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileViewerModal, isPreviewable } from "@/components/FileViewerModal"
import { SignatureBadge } from "@/components/SignatureBadge"
import { useDeleteDnFile, useSetDnFileKind, useUploadDnFiles } from "@/hooks/useDeliveryNotes"
import { getSignedUrl } from "@/hooks/useDocuments"
import { buildHtml, printDeliveryNote, type DeliveryNotePrintData } from "@/lib/deliveryNotePdf"
import { cn, errorMessage } from "@/lib/utils"
import type { DeliveryNote, DeliveryNoteFile, DnFileKind } from "@/lib/types"

function fmtSize(bytes: number | null) {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

type Preview = { url?: string; html?: string; name: string }

/**
 * Every version of one delivery note: the generated note (when it has items)
 * and any uploaded files — each previewable, downloadable and marked signed
 * or unsigned. Upload anything, including manually made notes.
 */
export function DeliveryNoteFilesDialog({
  note,
  files,
  printData,
  who,
  canEdit,
  onClose,
}: {
  note: DeliveryNote | null
  files: DeliveryNoteFile[]
  printData: DeliveryNotePrintData | null
  who: (id: string | null) => string
  canEdit: boolean
  onClose: () => void
}) {
  const upload = useUploadDnFiles()
  const setKind = useSetDnFileKind()
  const remove = useDeleteDnFile()
  const confirm = useConfirm()
  const [kind, setUploadKind] = useState<DnFileKind>("unsigned")
  const [preview, setPreview] = useState<Preview | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const mine = useMemo(() => files.filter((f) => f.delivery_note_id === note?.id), [files, note?.id])
  const signed = mine.some((f) => f.kind === "signed")
  const hasGenerated = !!note && note.items.length > 0

  async function onFiles(picked: File[]) {
    if (!note) return
    try {
      await upload.mutateAsync({ noteId: note.id, files: picked, kind })
      toast.success(`${picked.length} file${picked.length > 1 ? "s" : ""} added as ${kind}`)
    } catch (e) {
      toast.error("Upload failed", { description: errorMessage(e) })
    }
  }

  async function open(f: DeliveryNoteFile, mode: "preview" | "download") {
    setBusy(f.id + mode)
    try {
      const url = await getSignedUrl(f.storage_path)
      if (mode === "preview") setPreview({ url, name: f.file_name })
      else window.open(url, "_blank", "noopener")
    } catch (e) {
      toast.error("Could not open file", { description: errorMessage(e) })
    } finally {
      setBusy(null)
    }
  }

  async function changeKind(f: DeliveryNoteFile, next: DnFileKind) {
    try {
      await setKind.mutateAsync({ id: f.id, kind: next })
      toast.success(`Marked as ${next}`)
    } catch (e) {
      toast.error("Could not update", { description: errorMessage(e) })
    }
  }

  async function askDelete(f: DeliveryNoteFile) {
    const ok = await confirm({
      title: "Delete file?",
      description: `${f.file_name} will be permanently removed.`,
      confirmText: "Delete",
      destructive: true,
    })
    if (!ok) return
    try {
      await remove.mutateAsync(f)
      toast.success("File deleted")
    } catch (e) {
      toast.error("Could not delete", { description: errorMessage(e) })
    }
  }

  return (
    <>
      <Dialog open={!!note} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {note?.dn_number} <SignatureBadge signed={signed} />
            </DialogTitle>
            <DialogDescription>
              All versions of this delivery note. A note is Signed once any file is marked signed.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            {hasGenerated && printData && (
              <div className="flex items-center gap-2 rounded-lg border p-2.5">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">Generated note</div>
                  <div className="text-xs text-muted-foreground">
                    {note!.items.length} item{note!.items.length > 1 ? "s" : ""} · created by {who(note!.generated_by)}
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px]">System</Badge>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => setPreview({ html: buildHtml(printData), name: `Delivery Note ${note!.dn_number}` })}>
                      <Eye className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Preview</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => printDeliveryNote(printData)}>
                      <Printer className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Print / save as PDF</TooltipContent>
                </Tooltip>
              </div>
            )}

            {mine.length === 0 && !hasGenerated && (
              <p className="py-2 text-sm text-muted-foreground">No files yet.</p>
            )}

            {mine.map((f) => (
              <div
                key={f.id}
                className={cn("flex items-center gap-2 rounded-lg border p-2.5", f.kind === "signed" && "border-emerald-600/40 bg-emerald-50/40 dark:bg-emerald-950/20")}
              >
                <FileText className={cn("size-4 shrink-0", f.kind === "signed" ? "text-emerald-600" : "text-muted-foreground")} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{f.file_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {who(f.uploaded_by)} · {format(parseISO(f.uploaded_at), "d MMM yyyy, HH:mm")}
                    {f.file_size ? ` · ${fmtSize(f.file_size)}` : ""}
                  </div>
                </div>
                {canEdit ? (
                  <Select value={f.kind} onValueChange={(v) => changeKind(f, v as DnFileKind)}>
                    <SelectTrigger size="sm" className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unsigned">Unsigned</SelectItem>
                      <SelectItem value="signed">Signed</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <SignatureBadge signed={f.kind === "signed"} />
                )}
                {isPreviewable(f.file_name) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-7" disabled={busy === f.id + "preview"} onClick={() => open(f, "preview")}>
                        {busy === f.id + "preview" ? <Loader2 className="size-3.5 animate-spin" /> : <Eye className="size-3.5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Preview</TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-7" disabled={busy === f.id + "download"} onClick={() => open(f, "download")}>
                      {busy === f.id + "download" ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download</TooltipContent>
                </Tooltip>
                {canEdit && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => askDelete(f)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete</TooltipContent>
                  </Tooltip>
                )}
              </div>
            ))}
          </div>

          {canEdit && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Upload as</span>
                <div className="inline-flex rounded-sm border p-0.5" role="radiogroup" aria-label="Upload as">
                  {(["unsigned", "signed"] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={kind === k}
                      onClick={() => setUploadKind(k)}
                      className={cn(
                        "rounded-[2px] px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                        kind === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
              <FileDropzone
                multiple
                onFiles={onFiles}
                busy={upload.isPending}
                title={`Drop ${kind} files or click to browse`}
                hint="PDF, scans or photos — you can change signed/unsigned later"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <FileViewerModal
        open={!!preview}
        onClose={() => setPreview(null)}
        url={preview?.url ?? null}
        html={preview?.html}
        fileName={preview?.name ?? ""}
      />
    </>
  )
}
