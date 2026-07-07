import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  useCreateTechnician,
  useUpdateTechnician,
} from "@/hooks/useTechnicians"
import type { Technician } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function TechnicianFormDialog({
  open,
  onOpenChange,
  technician,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  technician: Technician | null
}) {
  const createTech = useCreateTechnician()
  const updateTech = useUpdateTechnician()
  const editing = !!technician

  const [fullName, setFullName] = useState("")
  const [trade, setTrade] = useState("")
  const [phone, setPhone] = useState("")
  const [nationality, setNationality] = useState("")
  const [iqamaNumber, setIqamaNumber] = useState("")
  const [iqamaExpiry, setIqamaExpiry] = useState("")
  const [active, setActive] = useState(true)
  const [notes, setNotes] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setFullName(technician?.full_name ?? "")
    setTrade(technician?.trade ?? "")
    setPhone(technician?.phone ?? "")
    setNationality(technician?.nationality ?? "")
    setIqamaNumber(technician?.iqama_number ?? "")
    setIqamaExpiry(technician?.iqama_expiry ?? "")
    setActive(technician?.active ?? true)
    setNotes(technician?.notes ?? "")
  }, [open, technician])

  async function submit() {
    if (!fullName.trim()) { toast.error("Name is required"); return }
    setBusy(true)
    const payload = {
      full_name: fullName.trim(),
      trade: trade.trim() || null,
      phone: phone.trim() || null,
      nationality: nationality.trim() || null,
      iqama_number: iqamaNumber.trim() || null,
      iqama_expiry: iqamaExpiry || null,
      active,
      notes: notes.trim() || null,
    }
    try {
      if (editing) {
        await updateTech.mutateAsync({ id: technician!.id, patch: payload })
        toast.success("Technician updated")
      } else {
        await createTech.mutateAsync(payload)
        toast.success("Technician added")
      }
      onOpenChange(false)
    } catch (e) {
      toast.error("Could not save", { description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit technician" : "Add technician"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update this technician's details." : "Register a technician with their Iqama and contact details."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Ahmed Khan" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Trade / skill</Label>
              <Input value={trade} onChange={(e) => setTrade(e.target.value)} placeholder="AV Technician" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05x xxx xxxx" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Iqama number</Label>
              <Input value={iqamaNumber} onChange={(e) => setIqamaNumber(e.target.value)} placeholder="2xxxxxxxxx" />
            </div>
            <div className="space-y-1.5">
              <Label>Iqama expiry</Label>
              <Input type="date" value={iqamaExpiry} onChange={(e) => setIqamaExpiry(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Nationality</Label>
            <Input value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="e.g. Pakistani" />
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Certifications, availability…" />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={active} onCheckedChange={(v) => setActive(!!v)} />
            Active — available to assign
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />} {editing ? "Save" : "Add technician"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
