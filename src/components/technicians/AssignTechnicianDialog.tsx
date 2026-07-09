import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { useProject } from "@/contexts/ProjectContext"
import { useCreateAssignment, useTechnicians } from "@/hooks/useTechnicians"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/DatePicker"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function AssignTechnicianDialog({
  open,
  onOpenChange,
  technicianId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  /** Pre-select a technician (from the schedule board). */
  technicianId?: string
}) {
  const { projects, currentProjectId } = useProject()
  const { data: technicians = [] } = useTechnicians()
  const createAssignment = useCreateAssignment()

  const [techId, setTechId] = useState("")
  const [projectId, setProjectId] = useState("")
  const [startDate, setStartDate] = useState(today())
  const [endDate, setEndDate] = useState(today())
  const [allDay, setAllDay] = useState(true)
  const [startTime, setStartTime] = useState("08:00")
  const [endTime, setEndTime] = useState("17:00")
  const [notes, setNotes] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setTechId(technicianId ?? "")
    setProjectId(currentProjectId ?? projects[0]?.id ?? "")
    setStartDate(today())
    setEndDate(today())
    setAllDay(true)
    setStartTime("08:00")
    setEndTime("17:00")
    setNotes("")
  }, [open, technicianId, currentProjectId, projects])

  const activeTechs = technicians.filter((t) => t.active)

  async function submit() {
    const project = projects.find((p) => p.id === projectId)
    if (!techId) { toast.error("Pick a technician"); return }
    if (!project) { toast.error("Pick a project"); return }
    if (endDate < startDate) { toast.error("End date can't be before start date"); return }
    setBusy(true)
    try {
      await createAssignment.mutateAsync({
        technician_id: techId,
        project_id: project.id,
        project_name: project.name,
        start_date: startDate,
        end_date: endDate,
        start_time: allDay ? null : startTime,
        end_time: allDay ? null : endTime,
        notes: notes.trim() || null,
      })
      toast.success("Technician assigned")
      onOpenChange(false)
    } catch (e) {
      toast.error("Could not assign", { description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign technician</DialogTitle>
          <DialogDescription>Place a technician on a project for a date range.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label>Technician</Label>
            <Select value={techId} onValueChange={setTechId}>
              <SelectTrigger><SelectValue placeholder="Select technician" /></SelectTrigger>
              <SelectContent>
                {activeTechs.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.full_name}{t.trade ? ` · ${t.trade}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>From date</Label>
              <DatePicker value={startDate} onChange={setStartDate} clearable={false} placeholder="From" />
            </div>
            <div className="space-y-1.5">
              <Label>To date</Label>
              <DatePicker value={endDate} onChange={setEndDate} min={startDate} clearable={false} placeholder="To" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={allDay} onCheckedChange={(v) => setAllDay(!!v)} />
              All day
            </label>
            {!allDay && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>From time</Label>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>To time</Label>
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Scope, contact, gear…" />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />} Assign
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
