import { useEffect, useRef, useState } from "react"
import { errorMessage } from "@/lib/utils"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/DatePicker"
import { UserAvatar } from "@/components/UserAvatar"
import { displayName } from "@/components/profile/shared"
import { useAuth } from "@/contexts/AuthContext"
import { useProject } from "@/contexts/ProjectContext"
import { useAllProfiles } from "@/hooks/useAdmin"
import { useCreateDeliveryNote, useNextDnNumber } from "@/hooks/useDeliveryNotes"
import { companyContactFor, printDeliveryNote } from "@/lib/deliveryNotePdf"
import type { DeliveryNoteItem } from "@/lib/types"

const NONE = "__none__"

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
  initialLines,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialLines: DeliveryNoteItem[]
  onSaved?: () => void
}) {
  const { currentProject } = useProject()
  const { user } = useAuth()
  const { data: profiles = [] } = useAllProfiles()
  const people = profiles
    .filter((p) => p.status !== "suspended")
    .sort((a, b) => displayName(a).localeCompare(displayName(b)))
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
  const [personId, setPersonId] = useState<string>(NONE)
  const person = people.find((p) => p.id === personId) ?? null
  const companyContact = person ? companyContactFor(person) : ""

  // Re-seed only when the dialog opens — not on subsequent realtime refreshes.
  const prevOpenRef = useRef(false)
  useEffect(() => {
    const justOpened = open && !prevOpenRef.current
    prevOpenRef.current = open
    if (!justOpened) return
    setDnNumber(nextNum ? buildDnNumber(currentProject?.name, nextNum) : "")
    setDate(format(new Date(), "yyyy-MM-dd"))
    setPo(currentProject?.our_po ?? "")
    setCustomerPo(currentProject?.client_po ?? "")
    setDeliverTo(currentProject?.client_name ?? "First Fix Team")
    setLocation(currentProject?.site_location ?? "")
    setContact(currentProject?.site_contact ?? "")
    setLines(initialLines)
    setPersonId(user?.id ?? NONE)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, nextNum, currentProject])

  // If nextNum arrived after the dialog opened and the field is still blank, fill it in.
  useEffect(() => {
    if (open && dnNumber === "" && nextNum) {
      setDnNumber(buildDnNumber(currentProject?.name, nextNum))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, nextNum])

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
      companyContact,
      items: cleaned,
    })
  }

  function buildPayload(cleaned: typeof lines) {
    return {
      dn_number: dnNumber || String(nextNum ?? 1),
      dn_date: date,
      po: po || null,
      customer_po: customerPo || null,
      deliver_to: deliverTo || null,
      location: location || null,
      contact: contact || null,
      contact_person_id: person?.id ?? null,
      company_contact: companyContact || null,
      items: cleaned,
      notes: null,
    }
  }

  async function saveOnly() {
    const cleaned = lines.filter((l) => l.description.trim() || l.serial.trim())
    if (cleaned.length === 0) { toast.error("Add at least one item"); return }
    try {
      await create.mutateAsync(buildPayload(cleaned))
      toast.success("Delivery note saved")
      onSaved?.()
      onOpenChange(false)
    } catch (e) {
      toast.error("Could not save", { description: errorMessage(e) })
    }
  }

  async function generateAndSave() {
    const cleaned = lines.filter((l) => l.description.trim() || l.serial.trim())
    if (cleaned.length === 0) { toast.error("Add at least one item"); return }
    try {
      await create.mutateAsync(buildPayload(cleaned))
      printDeliveryNote({
        dnNumber: dnNumber || String(nextNum ?? 1),
        date,
        projectName: currentProject?.name ?? "",
        po,
        customerPo,
        deliverTo,
        location,
        contact,
        companyContact,
        items: cleaned,
      })
      toast.success("Delivery note saved & generated")
      onSaved?.()
      onOpenChange(false)
    } catch (e) {
      toast.error("Could not save", { description: errorMessage(e) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-x-hidden overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Delivery note</DialogTitle>
          <DialogDescription>
            Fill in the header and item lines. Save to record it, or save & print to generate a PDF.
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
          <Field label="Site contact">
            <Input value={contact} onChange={(e) => setContact(e.target.value)} />
          </Field>
        </div>

        {/* Company contact person */}
        <div className="grid gap-1.5 rounded-lg border bg-muted/30 p-3 sm:grid-cols-[minmax(0,16rem)_1fr] sm:items-start sm:gap-4">
          <Field label="Our contact person (printed on the DN)">
            <Select value={personId} onValueChange={setPersonId}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Choose a person" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No contact person</SelectItem>
                {people.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <UserAvatar name={displayName(p)} src={p.avatar_url} seed={p.id} className="size-5" fallbackClassName="text-[8px]" />
                    <span className="max-w-56 truncate">
                      {displayName(p)}
                      {p.job_title && <span className="text-muted-foreground"> · {p.job_title}</span>}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="min-w-0 text-xs sm:pt-6">
            {person ? (
              <>
                <p className="whitespace-pre-line text-foreground">{companyContact}</p>
                {!person.phone && !person.contact_email && (
                  <p className="mt-1 text-amber-700 dark:text-amber-400">
                    No phone or email on this profile — only the name will print. Add them in their profile.
                  </p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">Only the company address will print.</p>
            )}
          </div>
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
            <FileText className="size-4" /> Preview only
          </Button>
          <Button variant="outline" onClick={saveOnly} disabled={create.isPending}>
            {create.isPending && <Loader2 className="size-4 animate-spin" />}
            Save
          </Button>
          <Button onClick={generateAndSave} disabled={create.isPending}>
            {create.isPending && <Loader2 className="size-4 animate-spin" />}
            Save & print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
