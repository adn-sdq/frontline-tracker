import { useEffect, useState } from "react"
import { format } from "date-fns"
import { CalendarDays, Loader2, Users } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/contexts/AuthContext"
import {
  useCreateAssignment,
  useRespondTechRequest,
  useTechnicians,
} from "@/hooks/useTechnicians"
import type { TechnicianRequest } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function fmtDate(d: string) {
  return format(new Date(d + "T00:00:00"), "d MMM yyyy")
}

export function RespondRequestDialog({
  request,
  onClose,
}: {
  request: TechnicianRequest | null
  onClose: () => void
}) {
  const { user } = useAuth()
  const { data: technicians = [] } = useTechnicians()
  const respond = useRespondTechRequest()
  const createAssignment = useCreateAssignment()

  const [note, setNote] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [busy, setBusy] = useState<null | "approve" | "changed" | "declined">(null)

  useEffect(() => {
    if (!request) return
    setNote(request.response_note ?? "")
    setSelected([])
    setStartDate(request.start_date)
    setEndDate(request.end_date)
  }, [request])

  if (!request) return null

  const activeTechs = technicians.filter((t) => t.active)

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function approve() {
    if (endDate < startDate) { toast.error("End date can't be before start date"); return }
    setBusy("approve")
    try {
      // Create an assignment for each chosen technician, carrying the request's
      // (possibly manager-adjusted) dates and the original time window.
      for (const techId of selected) {
        await createAssignment.mutateAsync({
          technician_id: techId,
          project_id: request!.project_id,
          project_name: request!.project_name,
          request_id: request!.id,
          start_date: startDate,
          end_date: endDate,
          start_time: request!.start_time,
          end_time: request!.end_time,
          notes: note.trim() || null,
        })
      }
      await respond.mutateAsync({
        id: request!.id,
        status: "approved",
        response_note: note.trim() || null,
        responded_by: user?.id ?? null,
      })
      toast.success(
        selected.length > 0
          ? `Approved — ${selected.length} technician${selected.length > 1 ? "s" : ""} assigned`
          : "Request approved"
      )
      onClose()
    } catch (e) {
      toast.error("Could not approve", { description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setBusy(null)
    }
  }

  async function setStatus(status: "changed" | "declined") {
    if (!note.trim()) {
      toast.error(status === "declined" ? "Add a reason for declining" : "Explain what changed")
      return
    }
    setBusy(status)
    try {
      await respond.mutateAsync({
        id: request!.id,
        status,
        response_note: note.trim(),
        responded_by: user?.id ?? null,
      })
      toast.success(status === "declined" ? "Request declined" : "Response sent")
      onClose()
    } catch (e) {
      toast.error("Could not update", { description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setBusy(null)
    }
  }

  const timeLabel =
    request.start_time && request.end_time
      ? `${request.start_time.slice(0, 5)}–${request.end_time.slice(0, 5)}`
      : "All day"

  return (
    <Dialog open={!!request} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Respond to request</DialogTitle>
          <DialogDescription>
            Approve and assign technicians, propose a change, or decline.
          </DialogDescription>
        </DialogHeader>

        {/* Request summary */}
        <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{request.project_name}</span>
            <Badge variant="outline" className="gap-1">
              <Users className="size-3" /> {request.quantity} needed
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="size-3.5" />
              {fmtDate(request.start_date)}
              {request.end_date !== request.start_date && ` → ${fmtDate(request.end_date)}`}
            </span>
            <span>· {timeLabel}</span>
          </div>
          {request.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {request.tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
              ))}
            </div>
          )}
          {request.notes && <p className="text-muted-foreground">{request.notes}</p>}
        </div>

        {/* Assignment */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Assign from</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Assign to</Label>
              <Input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center justify-between">
              <span>Assign technicians</span>
              <span className="text-xs font-normal text-muted-foreground">{selected.length} selected</span>
            </Label>
            {activeTechs.length === 0 ? (
              <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                No active technicians in the roster yet.
              </p>
            ) : (
              <div className="max-h-44 space-y-0.5 overflow-y-auto rounded-md border p-1">
                {activeTechs.map((t) => (
                  <label
                    key={t.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <Checkbox checked={selected.includes(t.id)} onCheckedChange={() => toggle(t.id)} />
                    <span className="flex-1 truncate">{t.full_name}</span>
                    {t.trade && <span className="text-xs text-muted-foreground">{t.trade}</span>}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Response note */}
        <div className="space-y-1.5">
          <Label>Response note</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Optional for approve · required for change/decline"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => setStatus("declined")}
            disabled={!!busy}
          >
            {busy === "declined" && <Loader2 className="size-4 animate-spin" />} Decline
          </Button>
          <Button variant="outline" onClick={() => setStatus("changed")} disabled={!!busy}>
            {busy === "changed" && <Loader2 className="size-4 animate-spin" />} Propose change
          </Button>
          <Button onClick={approve} disabled={!!busy}>
            {busy === "approve" && <Loader2 className="size-4 animate-spin" />} Approve &amp; assign
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
