import { useEffect, useRef, useState } from "react"
import { errorMessage } from "@/lib/utils"
import {
  Boxes,
  Download,
  FileText,
  Loader2,
  Paperclip,
  Trash2,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { DatePicker } from "@/components/DatePicker"

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ItemHistoryList } from "@/components/ItemHistoryList"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ConflictError, useCreateItem, useUpdateItem } from "@/hooks/useItems"
import { useItemSerials, useUpsertSerial } from "@/hooks/useItemSerials"
import {
  getItemFileSignedUrl,
  useDeleteItemFile,
  useItemFiles,
  useItemFilesRealtime,
  useUploadItemFile,
} from "@/hooks/useItemFiles"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { FileDropzone } from "@/components/ui/file-dropzone"
import { useSystems } from "@/hooks/useSystems"
import { useAuth } from "@/contexts/AuthContext"
import { useProject } from "@/contexts/ProjectContext"
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

export function ItemAttachments({ itemId }: { itemId: string }) {
  useItemFilesRealtime(itemId)
  const files = useItemFiles(itemId)
  const uploadFile = useUploadItemFile()
  const deleteFile = useDeleteItemFile()
  const confirm = useConfirm()
  const [note, setNote] = useState("")
  const [downloading, setDownloading] = useState<string | null>(null)

  async function onFiles(picked: File[]) {
    let done = 0
    for (const file of picked) {
      try {
        await uploadFile.mutateAsync({ itemId, file, note: note || undefined })
        done++
      } catch (err) {
        toast.error(`Upload failed: ${file.name}`, {
          description: errorMessage(err),
        })
      }
    }
    if (done > 0) {
      toast.success(done === 1 ? "File attached" : `${done} files attached`)
      setNote("")
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
        description: errorMessage(err),
      })
    } finally {
      setDownloading(null)
    }
  }

  async function remove(id: string, storagePath: string) {
    const ok = await confirm({
      title: "Remove attachment?",
      description: "This permanently deletes the file. This can't be undone.",
      confirmText: "Remove",
      destructive: true,
    })
    if (!ok) return
    try {
      await deleteFile.mutateAsync({ id, itemId, storagePath })
      toast.success("File removed")
    } catch (err) {
      toast.error("Could not remove file", {
        description: errorMessage(err),
      })
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Paperclip className="size-4" /> Attachments
        <Badge variant="secondary">{files.data?.length ?? 0}</Badge>
      </div>

      <FileDropzone multiple onFiles={onFiles} busy={uploadFile.isPending}>
        <div className="px-3 py-2.5">
          <Input
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-8"
          />
        </div>
      </FileDropzone>

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
  unique_id: string
  tracking: "unit" | "lot"
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
    unique_id: "",
    tracking: "unit",
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
    unique_id: i.unique_id ?? "",
    tracking: i.tracking ?? "unit",
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

/** The item form: state, fields and save. Shared by the Add dialog and the item page. */
export function useItemForm(item: Item | null, defaultSystem?: System) {
  const { user } = useAuth()
  const { currentProject, currentProjectId } = useProject()
  const { activeSystems } = useSystems(currentProjectId)
  const create = useCreateItem()
  const update = useUpdateItem()
  const [form, setForm] = useState<FormState>(blank(defaultSystem))
  const editing = !!item

  function reset() {
    if (item) setForm(fromItem(item))
    else {
      const base = blank(defaultSystem)
      base.location = currentProject?.site_location ?? ""
      setForm(base)
    }
  }

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
      unique_id: form.unique_id || null,
      tracking: form.tracking,
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
      return true
    } catch (e) {
      if (e instanceof ConflictError) {
        toast.warning("Someone else changed this item", {
          description: "Reload to get the latest values, then make your change again.",
        })
      } else {
        toast.error("Could not save", {
          description: errorMessage(e),
        })
      }
      return false
    }
  }

  const busy = create.isPending || update.isPending

  const fields = (
    <>
      <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-4">
        <div>
          <div className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">SKU</div>
          <div className="font-mono text-base font-bold text-primary">
            {item?.sku ?? <span className="text-sm font-normal text-muted-foreground">Assigned when saved</span>}
          </div>
        </div>
        <Field label="How is it tracked?">
          <Select value={form.tracking} onValueChange={(v) => set("tracking", v as "unit" | "lot")}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unit">Device — every unit has its own QR (and serial number)</SelectItem>
              <SelectItem value="lot">Accessory / small part — one QR for the whole line</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

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
        <Field label="Your reference">
          <Input
            value={form.unique_id}
            onChange={(e) => set("unique_id", e.target.value)}
            placeholder="e.g. BOQ line AV-003"
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

      <Separator />

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

      {/* Quantities — secondary "mid" info, grouped compactly */}
      <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <Boxes className="size-3.5" /> Quantities
        </div>
        <div className="grid grid-cols-4 gap-2">
          <QtyInput label="Req" value={form.qty_required} onChange={(v) => set("qty_required", v)} />
          <QtyInput label="Ord" value={form.qty_ordered} onChange={(v) => set("qty_ordered", v)} />
          <QtyInput label="Del" value={form.qty_delivered} onChange={(v) => set("qty_delivered", v)} />
          <QtyInput label="Inst" value={form.qty_installed} onChange={(v) => set("qty_installed", v)} />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-3">
        <Field label="ETA">
          <DatePicker value={form.eta} onChange={(v) => set("eta", v)} placeholder="Select ETA" />
        </Field>
      </div>

      <Field label="Notes">
        <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
      </Field>
    </>
  )

  return { form, fields, submit, busy, reset, editing }
}

/** Inline editor for the item page — the same form, no popup. */
export function ItemEditPanel({ item, onDone }: { item: Item; onDone: () => void }) {
  const f = useItemForm(item)
  // Seed once per item; realtime refreshes must not wipe edits in progress.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => f.reset(), [item.id])
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
      {f.fields}
      <div className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" onClick={onDone} disabled={f.busy}>Cancel</Button>
        <Button onClick={async () => { if (await f.submit()) onDone() }} disabled={f.busy}>
          {f.busy && <Loader2 className="size-4 animate-spin" />} Save changes
        </Button>
      </div>
    </div>
  )
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
  const f = useItemForm(item, defaultSystem)
  const { form, fields: detailsForm, busy, editing } = f
  // Only seed when the dialog opens, so realtime refreshes don't wipe a half-filled form.
  const prevOpenRef = useRef(false)
  useEffect(() => {
    const justOpened = open && !prevOpenRef.current
    prevOpenRef.current = open
    if (justOpened) f.reset()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item])

  async function submit() {
    if (await f.submit()) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-x-hidden overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit item" : "Add item"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the line item. Your change is recorded with your name."
              : "Add a new procurement line item."}
          </DialogDescription>
        </DialogHeader>

        {editing && item ? (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="details">Details</TabsTrigger>
              {form.tracking === "unit" && <TabsTrigger value="serials">Serials</TabsTrigger>}
              <TabsTrigger value="files">Attachments</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="flex flex-col gap-4 pt-2">
              {detailsForm}
            </TabsContent>
            <TabsContent value="serials" className="pt-2">
              <SerialsSection itemId={item.id} qty={Number(form.qty_required) || 0} />
            </TabsContent>
            <TabsContent value="files" className="pt-2">
              <ItemAttachments itemId={item.id} />
            </TabsContent>
            <TabsContent value="history" className="pt-2">
              <ItemHistoryList itemId={item.id} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex flex-col gap-4">{detailsForm}</div>
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

// ---------------------------------------------------------------------------
// Serial Numbers Section

export function SerialsSection({ itemId, qty }: { itemId: string; qty: number }) {
  const { data: serials = [] } = useItemSerials(itemId)
  const upsert = useUpsertSerial()
  const filled = serials.filter((s) => s.serial_number).length

  if (qty === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">Serial Numbers</span>
        <Badge variant={filled === qty ? "default" : "secondary"}>
          {filled} / {qty}
        </Badge>
      </div>

      <div className="flex flex-col gap-1.5">
        {Array.from({ length: qty }, (_, i) => {
          const unitIndex = i + 1
          const row = serials.find((s) => s.unit_index === unitIndex)
          return (
            <SerialRow
              key={unitIndex}
              itemId={itemId}
              unitIndex={unitIndex}
              initialValue={row?.serial_number ?? ""}
              onSave={(val) =>
                upsert.mutate({ itemId, unitIndex, serialNumber: val })
              }
            />
          )
        })}
      </div>
    </div>
  )
}

function SerialRow({
  itemId: _itemId,
  unitIndex,
  initialValue,
  onSave,
}: {
  itemId: string
  unitIndex: number
  initialValue: string
  onSave: (val: string) => void
}) {
  const [value, setValue] = useState(initialValue)

  // Sync when DB data changes (e.g. another tab saved)
  useEffect(() => { setValue(initialValue) }, [initialValue])

  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-right text-xs text-muted-foreground">
        Unit {unitIndex}
      </span>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => onSave(value)}
        placeholder="Serial number"
        className="h-8 font-mono text-sm"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function QtyInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 px-2 text-center tabular-nums"
      />
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
