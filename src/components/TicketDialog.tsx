import { useState, useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Separator } from "@/components/ui/separator"

import { useProjects } from "@/hooks/useProjects"
import { useAllProfiles } from "@/hooks/useAdmin"
import {
  useCreateTicket,
  useUpdateTicket,
  computeTicketPrefix,
  type TicketInput,
} from "@/hooks/useTickets"
import type { Ticket, TicketCategory, TicketPriority, TicketStatus } from "@/lib/types"
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  TICKET_CATEGORIES as CATS,
  TICKET_PRIORITIES as PRIS,
  TICKET_STATUSES as STATS,
} from "@/lib/types"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  ticket?: Ticket | null
}

function blank(): TicketInput & { status: TicketStatus } {
  return {
    title: "",
    description: "",
    project_id: null,
    project_name: "",
    category: "general",
    priority: "medium",
    status: "open",
    site_contact: "",
    site_phone: "",
    site_location: "",
    assigned_to: null,
  }
}

export function TicketDialog({ open, onOpenChange, ticket }: Props) {
  const [form, setForm] = useState<ReturnType<typeof blank>>(blank)
  const [preview, setPreview] = useState("")

  const { data: projects = [] } = useProjects()
  const { data: profiles = [] } = useAllProfiles()
  const create = useCreateTicket()
  const update = useUpdateTicket()
  const busy = create.isPending || update.isPending

  // Seed form only when the dialog opens — not on every re-render.
  const prevOpenRef = useRef(false)
  useEffect(() => {
    const justOpened = open && !prevOpenRef.current
    prevOpenRef.current = open
    if (!justOpened) return
    if (ticket) {
      setForm({
        title: ticket.title,
        description: ticket.description ?? "",
        project_id: ticket.project_id,
        project_name: ticket.project_name,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        site_contact: ticket.site_contact ?? "",
        site_phone: ticket.site_phone ?? "",
        site_location: ticket.site_location ?? "",
        assigned_to: ticket.assigned_to,
      })
    } else {
      setForm(blank())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ticket])

  // Live preview of ticket number for new tickets
  useEffect(() => {
    if (ticket) return
    const prefix = computeTicketPrefix(form.project_name || "?")
    setPreview(`${prefix}-TKT-${new Date().getFullYear()}-###`)
  }, [form.project_name, ticket])

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [k]: v }))
  }

  function handleProjectSelect(projectId: string) {
    if (projectId === "__none__") {
      set("project_id", null)
      return
    }
    const proj = projects.find((p) => p.id === projectId)
    if (!proj) return
    set("project_id", proj.id)
    set("project_name", proj.name)
    if (proj.site_contact && !form.site_contact) set("site_contact", proj.site_contact)
    if (proj.site_location && !form.site_location) set("site_location", proj.site_location)
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      toast.error("Title is required")
      return
    }
    if (!form.project_name.trim()) {
      toast.error("Project name is required")
      return
    }
    try {
      if (ticket) {
        await update.mutateAsync({ id: ticket.id, patch: form })
        toast.success("Ticket updated")
      } else {
        const created = await create.mutateAsync(form)
        toast.success(`Ticket ${created.ticket_number} created`)
      }
      onOpenChange(false)
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Failed to save ticket")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ticket ? `Edit ${ticket.ticket_number}` : "New Support Ticket"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Issue details */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Issue</p>
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                placeholder="Brief description of the issue"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => set("category", v as TicketCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATS.map((c) => (
                      <SelectItem key={c} value={c}>{TICKET_CATEGORY_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => set("priority", v as TicketPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIS.map((p) => (
                      <SelectItem key={p} value={p}>{TICKET_PRIORITY_LABELS[p]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {ticket && (
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v as TicketStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATS.map((s) => (
                      <SelectItem key={s} value={s}>{TICKET_STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Steps to reproduce, error details, photos reference…"
                rows={4}
                value={form.description ?? ""}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Project & site */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project &amp; Site</p>
            <div className="space-y-1.5">
              <Label>Link to registered project <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Select
                value={form.project_id ?? "__none__"}
                onValueChange={handleProjectSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None / old project —</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Project name *
                {!ticket && form.project_name && (
                  <span className="ml-2 font-mono text-xs text-muted-foreground">{preview}</span>
                )}
              </Label>
              <Input
                placeholder="e.g. NEOM Tower B, MiSK Ilmi Campus…"
                value={form.project_name}
                onChange={(e) => set("project_name", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Site contact</Label>
                <Input
                  placeholder="Name"
                  value={form.site_contact ?? ""}
                  onChange={(e) => set("site_contact", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  placeholder="+966 5x xxx xxxx"
                  value={form.site_phone ?? ""}
                  onChange={(e) => set("site_phone", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Location / area</Label>
              <Input
                placeholder="e.g. Hall B, Server Room 2, Zone 3…"
                value={form.site_location ?? ""}
                onChange={(e) => set("site_location", e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Assignment */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assignment</p>
            <div className="space-y-1.5">
              <Label>Assigned to</Label>
              <Select
                value={form.assigned_to ?? "__none__"}
                onValueChange={(v) => set("assigned_to", v === "__none__" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Unassigned —</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name ?? p.username ?? p.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {ticket ? "Save changes" : "Create ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
