import { useRef, useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import {
  Download,
  Eye,
  FileText,
  Loader2,
  MessageSquare,
  Send,
  Upload,
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
import { Separator } from "@/components/ui/separator"
import { DocStatusSelect } from "@/components/DocStatus"
import { DatePicker } from "@/components/DatePicker"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { FileViewerModal } from "@/components/FileViewerModal"
import {
  getSignedUrl,
  useAddComment,
  useDocumentComments,
  useDocumentFiles,
  useSetDocStatus,
  useUpdateFileDate,
  useUploadDocumentFile,
} from "@/hooks/useDocuments"

const today = () => new Date().toISOString().slice(0, 10)
import {
  DOC_STATUS_LABELS,
  type DocStatus,
  type DocumentRow,
  type Profile,
} from "@/lib/types"

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
  const updateFileDate = useUpdateFileDate()
  const addComment = useAddComment()
  const setStatus = useSetDocStatus()
  const fileInput = useRef<HTMLInputElement>(null)

  const [revLabel, setRevLabel] = useState("")
  const [note, setNote] = useState("")
  const [uploadDate, setUploadDate] = useState(today())
  const [comment, setComment] = useState("")
  const [downloading, setDownloading] = useState<string | null>(null)
  const [viewerFile, setViewerFile] = useState<{ url: string; fileName: string } | null>(null)
  const [openingViewer, setOpeningViewer] = useState<string | null>(null)

  function who(id: string | null) {
    if (!id) return "—"
    const p = profiles[id]
    return p?.full_name ?? p?.username ?? "Unknown"
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !doc) return
    try {
      await upload.mutateAsync({
        documentId: doc.id,
        file,
        revLabel,
        note,
        dated: uploadDate || undefined,
      })
      toast.success("File uploaded")
      setRevLabel("")
      setNote("")
      setUploadDate(today())
    } catch (err) {
      toast.error("Upload failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      if (fileInput.current) fileInput.current.value = ""
    }
  }

  async function download(path: string) {
    setDownloading(path)
    try {
      const url = await getSignedUrl(path)
      const a = document.createElement("a")
      a.href = url
      a.target = "_blank"
      a.rel = "noopener"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err) {
      toast.error("Could not open file", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setDownloading(null)
    }
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
        </SheetHeader>

        {doc && (
          <div className="flex flex-col gap-5 px-6 pb-8">
            {doc.description && (
              <p className="text-sm text-muted-foreground">{doc.description}</p>
            )}

            <div className="grid gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Status / review code
              </span>
              <DocStatusSelect value={doc.status} onChange={changeStatus} />
            </div>

            <Separator />

            {/* Files (stacked, newest first) */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="size-4" /> Files
                <Badge variant="secondary">{files.data?.length ?? 0}</Badge>
              </div>

              {/* Upload zone */}
              <div className="rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/20 overflow-hidden">
                {/* Click target */}
                <input
                  ref={fileInput}
                  type="file"
                  aria-label="Upload file"
                  className="hidden"
                  onChange={onPickFile}
                />
                <button
                  type="button"
                  className="w-full flex flex-col items-center gap-1.5 py-5 px-4 hover:bg-muted/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => fileInput.current?.click()}
                  disabled={upload.isPending}
                >
                  {upload.isPending ? (
                    <Loader2 className="size-6 text-muted-foreground animate-spin" />
                  ) : (
                    <Upload className="size-6 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">
                    {upload.isPending ? "Uploading…" : "Click to upload a file"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    New revisions stack on top — all versions kept
                  </span>
                </button>

                {/* Metadata fields */}
                <div className="border-t bg-background/60 px-3 py-2.5 grid grid-cols-2 gap-2">
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
                    <span className="text-xs text-muted-foreground shrink-0">Date</span>
                    <DatePicker
                      value={uploadDate}
                      onChange={setUploadDate}
                      placeholder="Document date"
                      clearable={false}
                      className="h-7 text-xs flex-1"
                    />
                  </div>
                </div>
              </div>

              {files.data?.length === 0 && (
                <p className="text-sm text-muted-foreground">No files yet.</p>
              )}
              <div className="flex flex-col gap-2">
                {files.data?.map((f, idx) => (
                  <div key={f.id} className="rounded-lg border p-2.5 space-y-1.5">
                    {/* Row 1: icon + name + badges + actions */}
                    <div className="flex items-start gap-2">
                      <FileText className="size-4 shrink-0 text-muted-foreground mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="truncate text-sm font-medium">{f.file_name}</span>
                          {idx === 0 && <Badge variant="secondary" className="text-xs shrink-0">Latest</Badge>}
                          {f.rev_label && <Badge variant="outline" className="text-xs shrink-0">{f.rev_label}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {who(f.uploaded_by)} ·{" "}
                          {formatDistanceToNow(new Date(f.uploaded_at), { addSuffix: true })}
                          {f.file_size ? ` · ${fmtSize(f.file_size)}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-0.5 -mt-0.5">
                        {isViewable(f.file_name) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                disabled={openingViewer === f.id}
                                onClick={async () => {
                                  setOpeningViewer(f.id)
                                  try {
                                    const url = await getSignedUrl(f.storage_path)
                                    setViewerFile({ url, fileName: f.file_name })
                                  } catch {
                                    toast.error("Could not open file")
                                  } finally {
                                    setOpeningViewer(null)
                                  }
                                }}
                              >
                                {openingViewer === f.id
                                  ? <Loader2 className="size-3.5 animate-spin" />
                                  : <Eye className="size-3.5" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View file</TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => download(f.storage_path)}
                              disabled={downloading === f.storage_path}
                            >
                              {downloading === f.storage_path ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Download className="size-3.5" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Download</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Row 2: dated + note */}
                    <div className="flex items-center gap-3 pl-6">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground shrink-0">Dated</span>
                        <DatePicker
                          value={f.dated ?? ""}
                          onChange={(val) =>
                            doc && updateFileDate.mutate({ id: f.id, documentId: doc.id, dated: val })
                          }
                          placeholder="—"
                          clearable={false}
                          className="h-6 text-xs w-32"
                        />
                      </div>
                      {f.note && (
                        <span className="text-xs text-muted-foreground italic truncate">{f.note}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Comments */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <MessageSquare className="size-4" /> Comments
                <Badge variant="secondary">{comments.data?.length ?? 0}</Badge>
              </div>

              <div className="flex flex-col gap-2">
                {comments.data?.map((c) => (
                  <div key={c.id} className="rounded-lg border p-2.5">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{who(c.author)}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(c.created_at), "d MMM, HH:mm")}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{c.body}</p>
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
            </div>
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
