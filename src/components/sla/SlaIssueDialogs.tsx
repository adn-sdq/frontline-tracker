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
import { useSaveSlaIssue, useSetSlaIssueStatus } from "@/hooks/useSla"
import { useSystems } from "@/hooks/useSystems"
import {
  SLA_ISSUE_STATUS_LABELS,
  SLA_SEVERITIES,
  SLA_SEVERITY_LABELS,
  type SlaIssue,
  type SlaIssueStatus,
  type SlaSeverity,
} from "@/lib/types"

const NONE = "__none"

// ── Create / edit an issue ────────────────────────────────────────────────────

export function SlaIssueDialog({
  open,
  onOpenChange,
  contractId,
  visitId,
  issue,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  contractId: string
  /** The visit the issue was found at (new issues only). */
  visitId?: string | null
  issue?: SlaIssue | null
}) {
  const save = useSaveSlaIssue()
  const { activeSystems } = useSystems()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [system, setSystem] = useState<string>(NONE)
  const [severity, setSeverity] = useState<SlaSeverity>("medium")

  useEffect(() => {
    if (!open) return
    setTitle(issue?.title ?? "")
    setDescription(issue?.description ?? "")
    setLocation(issue?.location ?? "")
    setSystem(issue?.system ?? NONE)
    setSeverity(issue?.severity ?? "medium")
  }, [open, issue])

  async function submit() {
    if (!title.trim()) return toast.error("Describe the issue in the title")
    const input = {
      title: title.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      system: system === NONE ? null : system,
      severity,
    }
    try {
      if (issue) await save.mutateAsync({ id: issue.id, input })
      else await save.mutateAsync({ input: { ...input, contract_id: contractId, found_visit_id: visitId ?? null } })
      toast.success(issue ? "Issue updated" : "Issue logged")
      onOpenChange(false)
    } catch (e) {
      toast.error("Could not save issue", { description: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{issue ? "Edit issue" : "Log an issue"}</DialogTitle>
          <DialogDescription>
            Unresolved issues carry over to every following visit until they're resolved.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">Issue *</Label>
          <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Projector lamp hours exceeded in Hall B" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Severity</Label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as SlaSeverity)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SLA_SEVERITIES.map((s) => <SelectItem key={s} value={s}>{SLA_SEVERITY_LABELS[s]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">System</Label>
            <Select value={system} onValueChange={setSystem}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>—</SelectItem>
                {activeSystems.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Room / zone" />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">Details</Label>
          <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>Cancel</Button>
          <Button onClick={submit} disabled={save.isPending}>
            {save.isPending && <Loader2 className="size-4 animate-spin" />}
            {issue ? "Save" : "Log issue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Change status with a note ─────────────────────────────────────────────────

const STATUS_PROMPTS: Record<SlaIssueStatus, { title: string; placeholder: string; cta: string }> = {
  resolved: { title: "Resolve issue", placeholder: "What was done to fix it?", cta: "Mark resolved" },
  deferred: { title: "Keep for next visit", placeholder: "Why is it waiting? (parts on order, client approval…)", cta: "Keep for next visit" },
  in_progress: { title: "Mark in progress", placeholder: "Optional note", cta: "Mark in progress" },
  open: { title: "Reopen issue", placeholder: "Why is it being reopened?", cta: "Reopen" },
}

export function SlaIssueStatusDialog({
  target,
  onClose,
}: {
  target: { issue: SlaIssue; status: SlaIssueStatus; visitId?: string | null } | null
  onClose: () => void
}) {
  const setStatus = useSetSlaIssueStatus()
  const [note, setNote] = useState("")
  useEffect(() => {
    if (target) setNote("")
  }, [target])

  const prompt = target ? STATUS_PROMPTS[target.status] : null

  async function submit() {
    if (!target) return
    if (target.status === "resolved" && !note.trim()) return toast.error("Describe the fix before resolving")
    try {
      await setStatus.mutateAsync({ issue: target.issue, status: target.status, visitId: target.visitId, note })
      toast.success(`Issue: ${SLA_ISSUE_STATUS_LABELS[target.status]}`)
      onClose()
    } catch (e) {
      toast.error("Could not update issue", { description: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{prompt?.title}</DialogTitle>
          <DialogDescription className="line-clamp-2">{target?.issue.title}</DialogDescription>
        </DialogHeader>
        <Textarea autoFocus rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={prompt?.placeholder} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={setStatus.isPending}>Cancel</Button>
          <Button onClick={submit} disabled={setStatus.isPending}>
            {setStatus.isPending && <Loader2 className="size-4 animate-spin" />}
            {prompt?.cta}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
