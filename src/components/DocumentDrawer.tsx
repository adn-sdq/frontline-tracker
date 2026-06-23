import { useRef, useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import {
  Download,
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
      window.open(url, "_blank")
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

              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Rev label (optional)"
                    value={revLabel}
                    onChange={(e) => setRevLabel(e.target.value)}
                    className="h-8"
                  />
                  <Input
                    placeholder="Note (optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="mt-2 grid gap-1">
                  <span className="text-xs text-muted-foreground">
                    Document date (defaults to today)
                  </span>
                  <Input
                    type="date"
                    value={uploadDate}
                    onChange={(e) => setUploadDate(e.target.value)}
                    className="h-8"
                  />
                </div>
                <input
                  ref={fileInput}
                  type="file"
                  aria-label="Upload file"
                  className="hidden"
                  onChange={onPickFile}
                />
                <Button
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => fileInput.current?.click()}
                  disabled={upload.isPending}
                >
                  {upload.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  Upload file
                </Button>
                <p className="mt-1.5 text-center text-xs text-muted-foreground">
                  New uploads stack on top — older files are kept.
                </p>
              </div>

              {files.data?.length === 0 && (
                <p className="text-sm text-muted-foreground">No files yet.</p>
              )}
              <div className="flex flex-col gap-2">
                {files.data?.map((f, idx) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-2 rounded-lg border p-2"
                  >
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {f.file_name}
                        </span>
                        {idx === 0 && (
                          <Badge variant="secondary" className="shrink-0">
                            Latest
                          </Badge>
                        )}
                        {f.rev_label && (
                          <Badge variant="outline" className="shrink-0">
                            {f.rev_label}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {who(f.uploaded_by)} ·{" "}
                        {formatDistanceToNow(new Date(f.uploaded_at), {
                          addSuffix: true,
                        })}
                        {f.file_size ? ` · ${fmtSize(f.file_size)}` : ""}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Dated</span>
                        <Input
                          type="date"
                          aria-label="Document date"
                          value={f.dated ?? ""}
                          onChange={(e) =>
                            doc &&
                            updateFileDate.mutate({
                              id: f.id,
                              documentId: doc.id,
                              dated: e.target.value,
                            })
                          }
                          className="h-7 w-36 px-2 text-xs"
                        />
                      </div>
                      {f.note && (
                        <div className="text-xs text-muted-foreground italic">
                          {f.note}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      onClick={() => download(f.storage_path)}
                      disabled={downloading === f.storage_path}
                    >
                      {downloading === f.storage_path ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Download className="size-4" />
                      )}
                    </Button>
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
  )
}
