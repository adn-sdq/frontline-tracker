import { useEffect, useRef, useState } from "react"
import { Loader2, Paperclip, Upload, X } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DocStatusSelect } from "@/components/DocStatus"
import {
  useCreateDocument,
  useUpdateDocument,
  useUploadDocumentFile,
} from "@/hooks/useDocuments"
import { useSystems } from "@/hooks/useSystems"
import { useAuth } from "@/contexts/AuthContext"
import { DOC_TYPES, DOC_TYPE_LABELS, type DocStatus, type DocType, type DocumentRow } from "@/lib/types"

const today = () => new Date().toISOString().slice(0, 10)

export function DocumentDialog({
  open,
  onOpenChange,
  doc,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  doc: DocumentRow | null
}) {
  const { user } = useAuth()
  const { activeSystems } = useSystems()
  const create = useCreateDocument()
  const update = useUpdateDocument()
  const upload = useUploadDocumentFile()
  const editing = !!doc
  const fileInput = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState("")
  const [docNumber, setDocNumber] = useState("")
  const [system, setSystem] = useState<string>("")
  const [docType, setDocType] = useState<DocType | "">("")
  const [revision, setRevision] = useState("")
  const [status, setStatus] = useState<DocStatus>("pending")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [fileDate, setFileDate] = useState(today())

  const prevOpenRef = useRef(false)
  useEffect(() => {
    const justOpened = open && !prevOpenRef.current
    prevOpenRef.current = open
    if (!justOpened) return
    setTitle(doc?.title ?? "")
    setDocNumber(doc?.doc_number ?? "")
    setSystem(doc?.system ?? "")
    setDocType(doc?.doc_type ?? "")
    setRevision(doc?.revision ?? "")
    setStatus(doc?.status ?? "pending")
    setDescription(doc?.description ?? "")
    setFile(null)
    setFileDate(today())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, doc])

  async function submit() {
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }
    const payload = {
      title: title.trim(),
      doc_number: docNumber || null,
      system: system || null,
      doc_type: docType || null,
      revision: revision || null,
      status,
      description: description || null,
    }
    try {
      let docId = doc?.id
      if (editing && doc) {
        await update.mutateAsync({ id: doc.id, patch: payload })
      } else {
        const created = await create.mutateAsync({
          ...payload,
          created_by: user?.id,
        })
        docId = created.id
      }
      if (file && docId) {
        await upload.mutateAsync({
          documentId: docId,
          file,
          dated: fileDate || undefined,
        })
      }
      toast.success(editing ? "Document updated" : "Document added")
      onOpenChange(false)
    } catch (e) {
      toast.error("Could not save", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    }
  }

  const busy = create.isPending || update.isPending || upload.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit document" : "Add document"}</DialogTitle>
          <DialogDescription>
            Track a document through review. You can upload files and add
            comments after saving.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">Title</Label>
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. AV Shop Drawing — Lab 01"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Document no.</Label>
            <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Revision</Label>
            <Input
              value={revision}
              onChange={(e) => setRevision(e.target.value)}
              placeholder="e.g. P01 / Rev 0"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">System</Label>
            <Select value={system} onValueChange={setSystem}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {activeSystems.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Document type</Label>
            <Select value={docType} onValueChange={(v) => setDocType(v as DocType)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {DOC_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">Status / code</Label>
          <DocStatusSelect value={status} onChange={(v) => setStatus(v as DocStatus)} />
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        {/* Attach a file */}
        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">
            {editing ? "Attach a new file (optional)" : "Upload file (optional)"}
          </Label>
          <input
            ref={fileInput}
            type="file"
            aria-label="Upload file"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="flex items-center gap-2 rounded-md border p-2 text-sm">
              <Paperclip className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => setFile(null)}
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInput.current?.click()}
            >
              <Upload className="size-4" /> Choose file
            </Button>
          )}
          {file && (
            <div className="mt-1 grid gap-1.5">
              <Label className="text-xs text-muted-foreground">
                Document date (auto-set to today, editable)
              </Label>
              <Input
                type="date"
                value={fileDate}
                onChange={(e) => setFileDate(e.target.value)}
              />
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            You can add more files anytime — open the document to stack new
            uploads on top.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {editing ? "Save" : "Add document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
