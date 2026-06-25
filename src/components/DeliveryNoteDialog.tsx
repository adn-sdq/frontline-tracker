import { useEffect, useState } from "react"
import { FileText, Loader2, Plus, Trash2 } from "lucide-react"
import { format } from "date-fns"
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
import { DatePicker } from "@/components/DatePicker"
import { useProject } from "@/contexts/ProjectContext"
import { useCreateDeliveryNote, useNextDnNumber } from "@/hooks/useDeliveryNotes"
import { printDeliveryNote } from "@/lib/deliveryNotePdf"
import type { DeliveryNoteItem, Item } from "@/lib/types"

// Auto-name: DN-[PROJECT_CODE]-[YYYYMMDD]-[NNN]
// e.g. DN-ILMI-20260624-001
function buildDnNumber(projectName: string | undefined, seq: number): string {
  const code = (projectName ?? "")
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 6) || "PRJ"
  const date = format(new Date(), "yyyyMMdd")
  const num = String(seq).padStart(3, "0")
  return `DN-${code}-${date}-${num}`
}

// Build a sensible default delivery-note line from a tracker item:
// first line = brand + model, second line = description; serial = unique_id.
function itemToLine(i: Item): DeliveryNoteItem {
  const head = [i.brand, i.model_no].filter(Boolean).join(" ")
  const description = [head, i.description].filter(Boolean).join("\n")
  const qty = i.qty_delivered || i.qty_ordered || i.qty_required || 1
  return {
    description: description || (i.unique_id ?? ""),
    qty,
    serial: i.unique_id ?? "",
  }
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

export function DeliveryNoteDialog({
  open,
  onOpenChange,
  items,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: Item[]
}) {
  const { currentProject } = useProject()
  const create = useCreateDeliveryNote()
  const { data: nextNum } = useNextDnNumber()

  const [dnNumber, setDnNumber] = useState("")
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [po, setPo] = useState("")
  const [customerPo, setCustomerPo] = useState("")
  const [deliverTo, setDeliverTo] = useState("First Fix Team")
  const [location, setLocation] = useState("")
  const [contact, setContact] = useState("")
  const [lines, setLines] = useState<DeliveryNoteItem[]>([])

  // Re-seed the form each time the dialog opens with a fresh selection.
  useEffect(() => {
    if (!open) return
    setDnNumber(nextNum ? buildDnNumber(currentProject?.name, nextNum) : "")
    setDate(format(new Date(), "yyyy-MM-dd"))
    setPo(currentProject?.our_po ?? "")
    setCustomerPo(currentProject?.client_po ?? "")
    setDeliverTo(currentProject?.client_name ?? "First Fix Team")
    setLocation(currentProject?.site_location ?? "")
    setContact(currentProject?.site_contact ?? "")
    setLines(items.map(itemToLine))
  }, [open, items, nextNum, currentProject])

  function setLine(idx: number, patch: Partial<DeliveryNoteItem>) {
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)))
  }
  function removeLine(idx: number) {
    setLines((ls) => ls.filter((_, i) => i !== idx))
  }
  function addLine() {
    setLines((ls) => [...ls, { description: "", qty: 1, serial: "" }])
  }

  function generate() {
    const cleaned = lines.filter(
      (l) => l.description.trim() || l.serial.trim()
    )
    if (cleaned.length === 0) {
      toast.error("Add at least one item")
      return
    }
    printDeliveryNote({
      dnNumber: dnNumber || String(nextNum ?? 1),
      date,
      projectName: currentProject?.name ?? "",
      po,
      customerPo,
      deliverTo,
      location,
      contact,
      items: cleaned,
    })
  }

  async function generateAndSave() {
    const cleaned = lines.filter(
      (l) => l.description.trim() || l.serial.trim()
    )
    if (cleaned.length === 0) {
      toast.error("Add at least one item")
      return
    }
    try {
      await create.mutateAsync({
        dn_number: dnNumber || String(nextNum ?? 1),
        dn_date: date,
        po: po || null,
        customer_po: customerPo || null,
        deliver_to: deliverTo || null,
        location: location || null,
        contact: contact || null,
        items: cleaned,
        notes: null,
      })
      printDeliveryNote({
        dnNumber: dnNumber || String(nextNum ?? 1),
        date,
        projectName: currentProject?.name ?? "",
        po,
        customerPo,
        deliverTo,
        location,
        contact,
        items: cleaned,
      })
      toast.success("Delivery note saved & generated")
      onOpenChange(false)
    } catch (e) {
      toast.error("Could not save", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Generate delivery note</DialogTitle>
          <DialogDescription>
            Review the header and item lines, then generate a printable PDF.
          </DialogDescription>
        </DialogHeader>

        {/* Header fields */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Delivery number">
            <Input value={dnNumber} onChange={(e) => setDnNumber(e.target.value)} />
          </Field>
          <Field label="Date">
            <DatePicker value={date} onChange={setDate} placeholder="Date" />
          </Field>
          <Field label="Project">
            <Input value={currentProject?.name ?? ""} disabled />
          </Field>
          <Field label="PO">
            <Input value={po} onChange={(e) => setPo(e.target.value)} />
          </Field>
          <Field label="Customer PO">
            <Input value={customerPo} onChange={(e) => setCustomerPo(e.target.value)} />
          </Field>
          <Field label="Delivery to">
            <Input value={deliverTo} onChange={(e) => setDeliverTo(e.target.value)} />
          </Field>
          <Field label="Location">
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="sm:col-span-1"
            />
          </Field>
          <Field label="Contact">
            <Input value={contact} onChange={(e) => setContact(e.target.value)} />
          </Field>
        </div>

        {/* Item lines */}
        <div className="mt-2">
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Items ({lines.length})
            </Label>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="size-3.5" /> Add line
            </Button>
          </div>

          <div className="grid grid-cols-[1fr_70px_1fr_32px] gap-2 px-1 pb-1 text-[11px] font-medium text-muted-foreground">
            <span>Item description</span>
            <span className="text-center">Qty</span>
            <span>Serial number</span>
            <span />
          </div>

          <div className="flex flex-col gap-2">
            {lines.map((l, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_70px_1fr_32px] items-start gap-2"
              >
                <Textarea
                  value={l.description}
                  onChange={(e) => setLine(i, { description: e.target.value })}
                  rows={2}
                  className="min-h-0 text-sm"
                  placeholder="Model / description"
                />
                <Input
                  type="number"
                  value={l.qty}
                  onChange={(e) => setLine(i, { qty: Number(e.target.value) || 0 })}
                  className="text-center"
                />
                <Textarea
                  value={l.serial}
                  onChange={(e) => setLine(i, { serial: e.target.value })}
                  rows={2}
                  className="min-h-0 font-mono text-xs"
                  placeholder="Serial / MAC"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive"
                  onClick={() => removeLine(i)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            {lines.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No items. Click "Add line" to add one.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="outline" onClick={generate}>
            <FileText className="size-4" /> Preview / Print only
          </Button>
          <Button onClick={generateAndSave} disabled={create.isPending}>
            {create.isPending && <Loader2 className="size-4 animate-spin" />}
            Save & generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
