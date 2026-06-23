import { useEffect, useRef, useState } from "react"
import {
  Download,
  FileText,
  Loader2,
  Paperclip,
  Trash2,
  Upload,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ConflictError, useCreateItem, useUpdateItem } from "@/hooks/useItems"
import {
  getItemFileSignedUrl,
  useDeleteItemFile,
  useItemFiles,
  useItemFilesRealtime,
  useUploadItemFile,
} from "@/hooks/useItemFiles"
import { useSystems } from "@/hooks/useSystems"
import { useAuth } from "@/contexts/AuthContext"
import {
  DELIVERY_STATUSES,
  INSTALLATION_STATUSES,
  PROCUREMENT_STATUSES,
  STATUS_LABELS,
  type Item,
  type System,
} from "@/lib/types"

function fmtSize(bytes: number | null) {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function ItemAttachments({ itemId }: { itemId: string }) {
  useItemFilesRealtime(itemId)
  const files = useItemFiles(itemId)
  const uploadFile = useUploadItemFile()
  const deleteFile = useDeleteItemFile()
  const fileInput = useRef<HTMLInputElement>(null)
  const [note, setNote] = useState("")
  const [downloading, setDownloading] = useState<string | null>(null)

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await uploadFile.mutateAsync({ itemId, file, note: note || undefined })
      toast.success("File attached")
      setNote("")
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
      const url = await getItemFileSignedUrl(path)
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

  async function remove(id: string, storagePath: string) {
    try {
      await deleteFile.mutateAsync({ id, itemId, storagePath })
      toast.success("File removed")
    } catch (err) {
      toast.error("Could not remove file", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Paperclip className="size-4" /> Attachments
        <Badge variant="secondary">{files.data?.length ?? 0}</Badge>
      </div>

      <div className="rounded-lg border bg-muted/30 p-3">
        <Input
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="h-8 mb-2"
        />
        <input
          ref={fileInput}
          type="file"
          aria-label="Attach file"
          className="hidden"
          onChange={onPickFile}
        />
        <Button
          type="button"
          size="sm"
          className="w-full"
          onClick={() => fileInput.current?.click()}
          disabled={uploadFile.isPending}
        >
          {uploadFile.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          Attach file
        </Button>
      </div>

      {(files.data?.length ?? 0) > 0 && (
        <div className="flex flex-col gap-1.5">
          {files.data?.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-2 rounded-lg border p-2"
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{f.file_name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(f.uploaded_at), { addSuffix: true })}
                  {f.file_size ? ` · ${fmtSize(f.file_size)}` : ""}
                  {f.note ? ` · ${f.note}` : ""}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => download(f.storage_path)}
                  disabled={downloading === f.storage_path}
                >
                  {downloading === f.storage_path ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive"
                  onClick={() => remove(f.id, f.storage_path)}
                  disabled={deleteFile.isPending}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

type FormState = {
  system: System
  location: string
  sno: string
  brand: string
  model_no: string
  description: string
  qty_required: string
  qty_ordered: string
  qty_delivered: string
  qty_installed: string
  procurement_status: string
  delivery_status: string
  installation_status: string
  supplier: string
  eta: string
  notes: string
}

function blank(system: System = "AV"): FormState {
  return {
    system,
    location: "",
    sno: "",
    brand: "",
    model_no: "",
    description: "",
    qty_required: "0",
    qty_ordered: "0",
    qty_delivered: "0",
    qty_installed: "0",
    procurement_status: "not_started",
    delivery_status: "pending",
    installation_status: "not_started",
    supplier: "",
    eta: "",
    notes: "",
  }
}

function fromItem(i: Item): FormState {
  return {
    system: i.system,
    location: i.location ?? "",
    sno: i.sno != null ? String(i.sno) : "",
    brand: i.brand ?? "",
    model_no: i.model_no ?? "",
    description: i.description ?? "",
    qty_required: String(i.qty_required ?? 0),
    qty_ordered: String(i.qty_ordered ?? 0),
    qty_delivered: String(i.qty_delivered ?? 0),
    qty_installed: String(i.qty_installed ?? 0),
    procurement_status: i.procurement_status,
    delivery_status: i.delivery_status,
    installation_status: i.installation_status,
    supplier: i.supplier ?? "",
    eta: i.eta ?? "",
    notes: i.notes ?? "",
  }
}

export function ItemDialog({
  open,
  onOpenChange,
  item,
  defaultSystem,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: Item | null
  defaultSystem?: System
}) {
  const { user } = useAuth()
  const { activeSystems } = useSystems()
  const create = useCreateItem()
  const update = useUpdateItem()
  const [form, setForm] = useState<FormState>(blank(defaultSystem))
  const editing = !!item

  useEffect(() => {
    if (open) setForm(item ? fromItem(item) : blank(defaultSystem))
  }, [open, item, defaultSystem])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const num = (v: string) => {
    const n = Number(v)
    return Number.isNaN(n) ? 0 : n
  }

  async function submit() {
    const payload = {
      system: form.system,
      location: form.location || null,
      sno: form.sno ? Number(form.sno) : null,
      brand: form.brand || null,
      model_no: form.model_no || null,
      description: form.description || null,
      qty_required: num(form.qty_required),
      qty_ordered: num(form.qty_ordered),
      qty_delivered: num(form.qty_delivered),
      qty_installed: num(form.qty_installed),
      procurement_status: form.procurement_status as Item["procurement_status"],
      delivery_status: form.delivery_status as Item["delivery_status"],
      installation_status: form.installation_status as Item["installation_status"],
      supplier: form.supplier || null,
      eta: form.eta || null,
      notes: form.notes || null,
    }
    try {
      if (editing && item) {
        await update.mutateAsync({
          id: item.id,
          version: item.version,
          patch: payload,
        })
        toast.success("Item updated")
      } else {
        await create.mutateAsync({ ...payload, created_by: user?.id })
        toast.success("Item added")
      }
      onOpenChange(false)
    } catch (e) {
      if (e instanceof ConflictError) {
        toast.warning("Someone else changed this item", {
          description: "Close and reopen to load the latest values.",
        })
      } else {
        toast.error("Could not save", {
          description: e instanceof Error ? e.message : "Unknown error",
        })
      }
    }
  }

  const busy = create.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit item" : "Add item"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the line item. Your change is recorded with your name."
              : "Add a new procurement line item."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="System">
            <Select value={form.system} onValueChange={(v) => set("system", v as System)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activeSystems.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Location / Room">
            <Input value={form.location} onChange={(e) => set("location", e.target.value)} />
          </Field>
          <Field label="S.No">
            <Input
              type="number"
              value={form.sno}
              onChange={(e) => set("sno", e.target.value)}
            />
          </Field>
          <Field label="Brand">
            <Input value={form.brand} onChange={(e) => set("brand", e.target.value)} />
          </Field>
          <Field label="Model No">
            <Input value={form.model_no} onChange={(e) => set("model_no", e.target.value)} />
          </Field>
          <Field label="Supplier">
            <Input value={form.supplier} onChange={(e) => set("supplier", e.target.value)} />
          </Field>
        </div>

        <Field label="Description">
          <Textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={2}
          />
        </Field>

        <div className="grid grid-cols-4 gap-3">
          <Field label="Required">
            <Input type="number" value={form.qty_required} onChange={(e) => set("qty_required", e.target.value)} />
          </Field>
          <Field label="Ordered">
            <Input type="number" value={form.qty_ordered} onChange={(e) => set("qty_ordered", e.target.value)} />
          </Field>
          <Field label="Delivered">
            <Input type="number" value={form.qty_delivered} onChange={(e) => set("qty_delivered", e.target.value)} />
          </Field>
          <Field label="Installed">
            <Input type="number" value={form.qty_installed} onChange={(e) => set("qty_installed", e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Procurement">
            <StatusPicker value={form.procurement_status} options={PROCUREMENT_STATUSES} onChange={(v) => set("procurement_status", v)} />
          </Field>
          <Field label="Delivery">
            <StatusPicker value={form.delivery_status} options={DELIVERY_STATUSES} onChange={(v) => set("delivery_status", v)} />
          </Field>
          <Field label="Installation">
            <StatusPicker value={form.installation_status} options={INSTALLATION_STATUSES} onChange={(v) => set("installation_status", v)} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="ETA">
            <Input type="date" value={form.eta} onChange={(e) => set("eta", e.target.value)} />
          </Field>
        </div>

        <Field label="Notes">
          <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
        </Field>

        {editing && item && (
          <>
            <Separator />
            <ItemAttachments itemId={item.id} />
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {editing ? "Save changes" : "Add item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function StatusPicker({
  value,
  options,
  onChange,
}: {
  value: string
  options: readonly string[]
  onChange: (v: string) => void
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {STATUS_LABELS[o] ?? o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
