import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
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
import { useCreateDocument, useUpdateDocument } from "@/hooks/useDocuments"
import { useSystems } from "@/hooks/useSystems"
import { useAuth } from "@/contexts/AuthContext"
import type { DocStatus, DocumentRow } from "@/lib/types"

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
  const editing = !!doc

  const [title, setTitle] = useState("")
  const [docNumber, setDocNumber] = useState("")
  const [system, setSystem] = useState<string>("")
  const [revision, setRevision] = useState("")
  const [status, setStatus] = useState<DocStatus>("pending")
  const [description, setDescription] = useState("")

  useEffect(() => {
    if (!open) return
    setTitle(doc?.title ?? "")
    setDocNumber(doc?.doc_number ?? "")
    setSystem(doc?.system ?? "")
    setRevision(doc?.revision ?? "")
    setStatus(doc?.status ?? "pending")
    setDescription(doc?.description ?? "")
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
      revision: revision || null,
      status,
      description: description || null,
    }
    try {
      if (editing && doc) {
        await update.mutateAsync({ id: doc.id, patch: payload })
        toast.success("Document updated")
      } else {
        await create.mutateAsync({ ...payload, created_by: user?.id })
        toast.success("Document added")
      }
      onOpenChange(false)
    } catch (e) {
      toast.error("Could not save", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    }
  }

  const busy = create.isPending || update.isPending

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
            <Label className="text-xs text-muted-foreground">Status / code</Label>
            <DocStatusSelect value={status} onChange={(v) => setStatus(v as DocStatus)} />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
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
