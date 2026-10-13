import { useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import {
  BadgeCheck,
  Check,
  Download,
  Eye,
  FileText,
  Loader2,
  Pencil,
  Send,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileDropzone } from "@/components/ui/file-dropzone"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { DocStatusSelect } from "@/components/DocStatus"
import { DatePicker } from "@/components/DatePicker"
import { DocumentHistoryList } from "@/components/DocumentHistoryList"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { FileViewerModal } from "@/components/FileViewerModal"
import {
  getSignedUrl,
  useAddComment,
  useDeleteDocumentFile,
  useDocumentComments,
  useDocumentFiles,
  useRenameDocumentFile,
  useSetDocStatus,
  useUpdateFileDate,
  useUploadDocumentFile,
} from "@/hooks/useDocuments"
import { cn } from "@/lib/utils"
import {
  DOC_STATUS_HINTS,
  DOC_STATUS_LABELS,
  REVIEW_CODES,
  type DocStatus,
  type DocumentFile,
  type DocumentRow,
  type Profile,
  type ReviewCode,
} from "@/lib/types"

const today = () => new Date().toISOString().slice(0, 10)

function fmtSize(bytes: number | null) {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function isViewable(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  return ["pdf", "csv", "xlsx", "xls"].includes(ext)
}

/** Keep the original extension when the user types a new base name. */
function withExtension(next: string, original: string) {
  const ext = original.includes(".") ? original.slice(original.lastIndexOf(".")) : ""
  const trimmed = next.trim()
  if (!ext || trimmed.toLowerCase().endsWith(ext.toLowerCase())) return trimmed
  return trimmed + ext
}

type UploadKind = "submission" | "approved"

// ── One file row ──────────────────────────────────────────────────────────────

function FileRow({
  file: f,
  latest,
  documentId,
  uploader,
  onView,
}: {
  file: DocumentFile
  latest: boolean
  documentId: string
  uploader: string
  onView: (url: string, fileName: string) => void
}) {
  const rename = useRenameDocumentFile()
  const remove = useDeleteDocumentFile()
  const updateFileDate = useUpdateFileDate()
  const confirm = useConfirm()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(f.file_name)
  const [busy, setBusy] = useState<"view" | "download" | null>(null)

  async function open(kind: "view" | "download") {
    setBusy(kind)
    try {
      const url = await getSignedUrl(f.storage_path)
      if (kind === "view") {
        onView(url, f.file_name)
      } else {
        const a = document.createElement("a")
        a.href = url
        a.target = "_blank"
        a.rel = "noopener"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    } catch (err) {
      toast.error("Could not open file", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setBusy(null)
    }
  }

  async function saveName() {
    const next = withExtension(name, f.file_name)
    if (!next || next === f.file_name) {
      setEditing(false)
      setName(f.file_name)
      return
    }
    try {
      await rename.mutateAsync({ id: f.id, documentId, fileName: next })
      toast.success("File renamed")
      setEditing(false)
    } catch (err) {
      toast.error("Could not rename", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    }
  }

  async function askDelete() {
    const ok = await confirm({
      title: "Delete file?",
      description: `${f.file_name} will be permanently removed. The deletion is kept in the document's history.`,
      confirmText: "Delete",
      destructive: true,
    })
    if (!ok) return
    try {
      await remove.mutateAsync({ id: f.id, documentId, storagePath: f.storage_path })
      toast.success("File deleted")
    } catch (err) {
      toast.error("Could not delete file", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    }
  }

  return (
    <div
      className={cn(
        "group space-y-1.5 rounded-lg border p-2.5",
        f.review_code && "border-emerald-600/40 bg-emerald-50/40 dark:bg-emerald-950/20"
      )}
    >
      <div className="flex items-start gap-2">
        {f.review_code ? (
          <BadgeCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
        ) : (
          <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex items-center gap-1">
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void saveName()
                  if (e.key === "Escape") {
                    setEditing(false)
                    setName(f.file_name)
                  }
                }}
                className="h-7 text-sm"
                aria-label="File name"
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={saveName}
                disabled={rename.isPending}
                aria-label="Save name"
              >
                {rename.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => {
                  setEditing(false)
                  setName(f.file_name)
                }}
                aria-label="Cancel rename"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="truncate text-sm font-medium">{f.file_name}</span>
              {latest && <Badge variant="secondary" className="shrink-0 text-xs">Latest</Badge>}
              {f.review_code && (
                <Badge className="shrink-0 border-transparent bg-emerald-600 text-xs text-white">
                  Approved copy · {DOC_STATUS_LABELS[f.review_code]}
                </Badge>
              )}
              {f.rev_label && <Badge variant="outline" className="shrink-0 text-xs">{f.rev_label}</Badge>}
            </div>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground">
            {uploader} · {formatDistanceToNow(new Date(f.uploaded_at), { addSuffix: true })}
            {f.file_size ? ` · ${fmtSize(f.file_size)}` : ""}
          </p>
        </div>
        {!editing && (
          <div className="-mt-0.5 flex shrink-0 gap-0.5">
            {isViewable(f.file_name) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7" disabled={busy === "view"} onClick={() => open("view")}>
                    {busy === "view" ? <Loader2 className="size-3.5 animate-spin" /> : <Eye className="size-3.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View file</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7" disabled={busy === "download"} onClick={() => open("download")}>
                  {busy === "download" ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => {
                    setName(f.file_name)
                    setEditing(true)
                  }}
                >
                  <Pencil className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rename</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive"
                  onClick={askDelete}
                  disabled={remove.isPending}
                >
                  {remove.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 pl-6">
        <div className="flex items-center gap-1.5">
          <span className="shrink-0 text-xs text-muted-foreground">Dated</span>
          <DatePicker
            value={f.dated ?? ""}
            onChange={(val) =>
              updateFileDate.mutate(
                { id: f.id, documentId, dated: val },
                { onSuccess: () => toast.success("Date updated") }
              )
            }
            placeholder="—"
            clearable={false}
            className="h-6 w-32 text-xs"
          />
        </div>
        {f.note && <span className="truncate text-xs italic text-muted-foreground">{f.note}</span>}
      </div>
    </div>
  )
}

// ── Drawer ────────────────────────────────────────────────────────────────────

export function DocumentDrawer({
  doc,
  profiles,
  onClose,
}: {
  doc: DocumentRow | null
  profiles: Record<string, Profile>
  onClose: () => void
}) {
  const files = useDocumentFiles(doc?.id ?? null)
  const comments = useDocumentComments(doc?.id ?? null)
  const upload = useUploadDocumentFile()
  const addComment = useAddComment()
  const setStatus = useSetDocStatus()

  const [kind, setKind] = useState<UploadKind>("submission")
  const [reviewCode, setReviewCode] = useState<ReviewCode>("code_a")
  const [revLabel, setRevLabel] = useState("")
  const [note, setNote] = useState("")
  const [uploadDate, setUploadDate] = useState(today())
  const [comment, setComment] = useState("")
  const [viewerFile, setViewerFile] = useState<{ url: string; fileName: string } | null>(null)

  function who(id: string | null) {
    if (!id) return "—"
    const p = profiles[id]
    return p?.full_name ?? p?.username ?? "Unknown"
  }

  async function onFiles(picked: File[]) {
    if (!doc) return
    const approved = kind === "approved"
    let done = 0
    for (const file of picked) {
      try {
        await upload.mutateAsync({
          documentId: doc.id,
          file,
          revLabel,
          note,
          dated: uploadDate || undefined,
          reviewCode: approved ? reviewCode : null,
        })
        done++
      } catch (err) {
        toast.error(`Upload failed: ${file.name}`, {
          description: err instanceof Error ? err.message : "Unknown error",
        })
      }
    }
    if (done === 0) return
    toast.success(
      approved
        ? `Approved copy uploaded — status set to ${DOC_STATUS_LABELS[reviewCode]}`
        : done === 1
          ? "File uploaded"
          : `${done} files uploaded`
    )
    setRevLabel("")
    setNote("")
    setUploadDate(today())
    setKind("submission")
  }

  async function changeStatus(v: string) {
    if (!doc) return
    try {
      await setStatus(doc.id, v as DocStatus)
      toast.success(`Status set to ${DOC_STATUS_LABELS[v] ?? v}`)
    } catch (err) {
      toast.error("Could not update status", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    }
  }

  async function postComment() {
    if (!doc || !comment.trim()) return
    try {
      await addComment.mutateAsync({ documentId: doc.id, body: comment.trim() })
      setComment("")
      toast.success("Comment posted")
    } catch (err) {
      toast.error("Could not post comment", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    }
  }

  return (
    <>
    <Sheet open={!!doc} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{doc?.title}</SheetTitle>
          <SheetDescription>
            {[doc?.doc_number, doc?.revision].filter(Boolean).join(" · ") ||
              "Document"}
          </SheetDescription>
          {doc && (
            <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <Badge variant="outline" className="font-mono text-[10px]">v{doc.version}</Badge>
              Last saved by {who(doc.updated_by)} ·{" "}
              {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}
            </p>
          )}
        </SheetHeader>

        {doc && (
          <div className="flex flex-col gap-5 px-4 pb-6 sm:px-6 sm:pb-8">
            {doc.description && (
              <p className="text-sm text-muted-foreground">{doc.description}</p>
            )}

            <div className="grid gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Status / review code
              </span>
              <DocStatusSelect value={doc.status} onChange={changeStatus} />
            </div>

            <Tabs defaultValue="files">
              <TabsList>
                <TabsTrigger value="files">
                  Files <Badge variant="secondary" className="ml-1">{files.data?.length ?? 0}</Badge>
                </TabsTrigger>
                <TabsTrigger value="comments">
                  Comments <Badge variant="secondary" className="ml-1">{comments.data?.length ?? 0}</Badge>
                </TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              {/* Files (stacked, newest first) */}
              <TabsContent value="files" className="mt-3 flex flex-col gap-3">
                {/* Upload type */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-sm border p-0.5" role="radiogroup" aria-label="Upload type">
                    {(["submission", "approved"] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        role="radio"
                        aria-checked={kind === k}
                        onClick={() => setKind(k)}
                        className={cn(
                          "rounded-[2px] px-2.5 py-1 text-xs font-medium transition-colors",
                          kind === k
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {k === "submission" ? "Submission" : "Approved copy"}
                      </button>
                    ))}
                  </div>
                  {kind === "approved" && (
                    <Select value={reviewCode} onValueChange={(v) => setReviewCode(v as ReviewCode)}>
                      <SelectTrigger size="sm" className="h-7 w-auto text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REVIEW_CODES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {DOC_STATUS_LABELS[c]} — {DOC_STATUS_HINTS[c]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <FileDropzone
                  multiple
                  onFiles={onFiles}
                  busy={upload.isPending}
                  title={kind === "approved" ? "Drop the approved (stamped) copy" : undefined}
                  hint={
                    kind === "approved"
                      ? `Document status will update to ${DOC_STATUS_LABELS[reviewCode]}`
                      : "New revisions stack on top — all versions kept"
                  }
                  className={cn(kind === "approved" && "border-emerald-600/40")}
                >
                  <div className="grid grid-cols-2 gap-2 px-3 py-2.5">
                    <Input
                      placeholder="Rev label"
                      value={revLabel}
                      onChange={(e) => setRevLabel(e.target.value)}
                      className="h-7 text-xs"
                    />
                    <Input
                      placeholder="Note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="h-7 text-xs"
                    />
                    <div className="col-span-2 flex items-center gap-2">
                      <span className="shrink-0 text-xs text-muted-foreground">Date</span>
                      <DatePicker
                        value={uploadDate}
                        onChange={setUploadDate}
                        placeholder="Document date"
                        clearable={false}
                        className="h-7 flex-1 text-xs"
                      />
                    </div>
                  </div>
                </FileDropzone>

                {files.data?.length === 0 && (
                  <p className="text-sm text-muted-foreground">No files yet.</p>
                )}
                <div className="flex flex-col gap-2">
                  {files.data?.map((f, idx) => (
                    <FileRow
                      key={f.id}
                      file={f}
                      latest={idx === 0}
                      documentId={doc.id}
                      uploader={who(f.uploaded_by)}
                      onView={(url, fileName) => setViewerFile({ url, fileName })}
                    />
                  ))}
                </div>
              </TabsContent>

              {/* Comments */}
              <TabsContent value="comments" className="mt-3 flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  {comments.data?.map((c) => (
                    <div key={c.id} className="rounded-lg border p-2.5">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{who(c.author)}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(c.created_at), "d MMM, HH:mm")}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm">{c.body}</p>
                    </div>
                  ))}
                  {comments.data?.length === 0 && (
                    <p className="text-sm text-muted-foreground">No comments yet.</p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Textarea
                    placeholder="Add a comment…"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                  />
                  <Button
                    size="sm"
                    className="self-end"
                    onClick={postComment}
                    disabled={addComment.isPending || !comment.trim()}
                  >
                    {addComment.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    Post
                  </Button>
                </div>
              </TabsContent>

              {/* Version history */}
              <TabsContent value="history" className="mt-3">
                <DocumentHistoryList documentId={doc.id} profiles={profiles} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>

    <FileViewerModal
      open={!!viewerFile}
      onClose={() => setViewerFile(null)}
      url={viewerFile?.url ?? null}
      fileName={viewerFile?.fileName ?? ""}
    />
    </>
  )
}
