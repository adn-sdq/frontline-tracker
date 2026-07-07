import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { useProject } from "@/contexts/ProjectContext"
import { useCreateTechRequest } from "@/hooks/useTechnicians"
import { TECH_REQUEST_TAGS } from "@/lib/types"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function tomorrow(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

export function RequestTechnicianDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { projects, currentProjectId } = useProject()
  const createRequest = useCreateTechRequest()

  const [projectId, setProjectId] = useState<string>("")
  const [quantity, setQuantity] = useState(1)
  const [startDate, setStartDate] = useState(tomorrow())
  const [endDate, setEndDate] = useState(tomorrow())
  const [allDay, setAllDay] = useState(true)
  const [startTime, setStartTime] = useState("08:00")
  const [endTime, setEndTime] = useState("17:00")
  const [tags, setTags] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [busy, setBusy] = useState(false)

  // Reset when opening — default to the current project.
  useEffect(() => {
    if (!open) return
    setProjectId(currentProjectId ?? projects[0]?.id ?? "")
    setQuantity(1)
    setStartDate(tomorrow())
    setEndDate(tomorrow())
    setAllDay(true)
    setStartTime("08:00")
    setEndTime("17:00")
    setTags([])
    setNotes("")
  }, [open, currentProjectId, projects])

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  async function submit() {
    const project = projects.find((p) => p.id === projectId)
    if (!project) { toast.error("Pick a project"); return }
    if (endDate < startDate) { toast.error("End date can't be before start date"); return }
    if (!allDay && endDate === startDate && endTime <= startTime) {
      toast.error("End time must be after start time"); return
    }
    setBusy(true)
    try {
      await createRequest.mutateAsync({
        project_id: project.id,
        project_name: project.name,
        quantity,
        start_date: startDate,
        end_date: endDate,
        start_time: allDay ? null : startTime,
        end_time: allDay ? null : endTime,
        tags,
        notes: notes.trim() || null,
      })
      toast.success("Request submitted")
      onOpenChange(false)
    } catch (e) {
      toast.error("Could not submit", { description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request technicians</DialogTitle>
          <DialogDescription>
            Ask the technicians manager for people on your project. They'll respond with an assignment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Project + quantity */}
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="space-y-1.5">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-24 space-y-1.5">
              <Label>How many</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>From date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>To date</Label>
              <Input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* Times */}
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

          {/* Tags */}
          <div className="space-y-1.5">
            <Label>Common requirements</Label>
            <div className="flex flex-wrap gap-1.5">
              {TECH_REQUEST_TAGS.map((tag) => {
                const on = tags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                      on
                        ? "border-primary bg-primary/10 text-primary hover:bg-primary/20"
                        : "border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/60"
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything else the manager should know…"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || !projectId}>
            {busy && <Loader2 className="size-4 animate-spin" />} Submit request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
