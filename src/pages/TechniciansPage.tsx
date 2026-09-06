import { useMemo, useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import {
  AlertTriangle,
  CalendarDays,
  CalendarPlus,
  Clock,
  Columns3,
  Eye,
  Inbox,
  LayoutList,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Trash2,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/contexts/AuthContext"
import { useProject } from "@/contexts/ProjectContext"
import { useAllProfiles } from "@/hooks/useAdmin"
import {
  useCancelTechRequest,
  useDeleteAssignment,
  useDeleteTechnician,
  useDeleteTechRequest,
  useTechAssignments,
  useTechnicians,
  useTechniciansRealtime,
  useTechRequests,
  useUpdateAssignment,
} from "@/hooks/useTechnicians"
import {
  TECH_REQUEST_STATUS_LABELS,
  TECH_REQUEST_STATUS_STYLES,
  TECH_REQUEST_STATUSES,
  type Technician,
  type TechnicianAssignment,
  type TechnicianRequest,
  type TechRequestStatus,
} from "@/lib/types"
import { ActionButton } from "@/components/shell/ActionButton"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { KanbanBoard, type KanbanColumn } from "@/components/kanban/KanbanBoard"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/PageHeader"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RequestTechnicianDialog } from "@/components/technicians/RequestTechnicianDialog"
import { RespondRequestDialog } from "@/components/technicians/RespondRequestDialog"
import { TechnicianFormDialog } from "@/components/technicians/TechnicianFormDialog"
import { AssignTechnicianDialog } from "@/components/technicians/AssignTechnicianDialog"

// ── date helpers ──────────────────────────────────────────────────────────────
const TODAY = new Date().toISOString().slice(0, 10)

// A pending/changed request whose work date has passed with no reply is expired
function isExpired(req: TechnicianRequest): boolean {
  return (req.status === "pending" || req.status === "changed") && req.end_date < TODAY
}

function fmt(d: string) {
  return format(new Date(d + "T00:00:00"), "d MMM")
}
function dateRange(a: { start_date: string; end_date: string }) {
  return a.start_date === a.end_date ? fmt(a.start_date) : `${fmt(a.start_date)} → ${fmt(a.end_date)}`
}
function timeLabel(a: { start_time: string | null; end_time: string | null }) {
  return a.start_time && a.end_time ? `${a.start_time.slice(0, 5)}–${a.end_time.slice(0, 5)}` : "All day"
}

// ── compact request card ────────────────────────────────────────────────────
function RequestCard({
  req,
  requesterName,
  onView,
  onRespond,
  onDelete,
}: {
  req: TechnicianRequest
  requesterName?: string | null
  onView: () => void
  onRespond?: () => void
  onDelete: () => void
}) {
  const expired = isExpired(req)
  const needsAction = !expired && (req.status === "pending" || req.status === "changed")

  return (
    <div className={cn(
      "flex items-start gap-3 rounded-lg border bg-card px-4 py-3",
      needsAction && "border-primary/25"
    )}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{req.project_name}</span>
          {expired ? (
            <Badge variant="outline" className="text-[10px] text-muted-foreground/60">Expired</Badge>
          ) : (
            <Badge className={cn(TECH_REQUEST_STATUS_STYLES[req.status], "text-[10px]")}>
              {TECH_REQUEST_STATUS_LABELS[req.status]}
            </Badge>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><CalendarDays className="size-3" />{dateRange(req)}</span>
          <span className="flex items-center gap-1"><Clock className="size-3" />{timeLabel(req)}</span>
          <span className="flex items-center gap-1"><Users className="size-3" />{req.quantity}</span>
          {requesterName && <span>· by {requesterName}</span>}
          <span>· {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}</span>
        </div>
        {req.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {req.tags.map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {needsAction && onRespond && (
          <Button size="sm" className="h-7 text-xs" onClick={onRespond}>Respond</Button>
        )}
        <Button size="icon" variant="ghost" className="size-7 text-muted-foreground hover:text-foreground" onClick={onView}>
          <Eye className="size-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="size-7 text-muted-foreground hover:text-destructive" onClick={onDelete}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ── request detail dialog ───────────────────────────────────────────────────
function RequestDetailDialog({
  req,
  requesterName,
  open,
  onClose,
  onRespond,
}: {
  req: TechnicianRequest | null
  requesterName?: string | null
  open: boolean
  onClose: () => void
  onRespond?: () => void
}) {
  if (!req) return null
  const expired = isExpired(req)
  const needsAction = !expired && (req.status === "pending" || req.status === "changed")

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {req.project_name}
            {expired ? (
              <Badge variant="outline" className="text-muted-foreground/60">Expired</Badge>
            ) : (
              <Badge className={TECH_REQUEST_STATUS_STYLES[req.status]}>
                {TECH_REQUEST_STATUS_LABELS[req.status]}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div><p className="font-medium text-muted-foreground">Date</p><p>{dateRange(req)}</p></div>
            <div><p className="font-medium text-muted-foreground">Time</p><p>{timeLabel(req)}</p></div>
            <div><p className="font-medium text-muted-foreground">Quantity</p><p>{req.quantity} technician{req.quantity !== 1 ? "s" : ""}</p></div>
            {requesterName && (
              <div><p className="font-medium text-muted-foreground">Requested by</p><p>{requesterName}</p></div>
            )}
          </div>

          {req.tags.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Tags</p>
              <div className="flex flex-wrap gap-1">
                {req.tags.map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
              </div>
            </div>
          )}

          {req.notes && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Request notes</p>
              <p className="rounded-md bg-muted/40 px-3 py-2">{req.notes}</p>
            </div>
          )}

          {req.response_note && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Manager response</p>
              <div className="rounded-md border-l-2 border-primary/40 bg-muted/40 px-3 py-2">
                {req.response_note}
              </div>
            </div>
          )}
        </div>

        {needsAction && onRespond && (
          <div className="flex justify-end pt-1">
            <Button onClick={() => { onClose(); onRespond() }}>Respond to request</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── manager: requests inbox ─────────────────────────────────────────────────
function RequestsInbox({
  nameFor,
  onNew,
}: {
  nameFor: (id: string | null) => string | null
  onNew: () => void
}) {
  const { data: requests = [] } = useTechRequests()
  const deleteReq = useDeleteTechRequest()
  const confirm = useConfirm()
  const [statusFilter, setStatusFilter] = useState<TechRequestStatus | "ALL">("ALL")
  const [responding, setResponding] = useState<TechnicianRequest | null>(null)
  const [viewing, setViewing] = useState<TechnicianRequest | null>(null)

  // Actionable (needs response) → expired → resolved; newest-first within groups
  const filtered = useMemo(() => {
    const all = requests.filter((r) => statusFilter === "ALL" || r.status === statusFilter)
    return [...all].sort((a, b) => {
      const rank = (r: TechnicianRequest) =>
        !isExpired(r) && (r.status === "pending" || r.status === "changed") ? 0
        : isExpired(r) ? 1
        : 2
      const d = rank(a) - rank(b)
      return d !== 0 ? d : b.created_at.localeCompare(a.created_at)
    })
  }, [requests, statusFilter])

  async function remove(id: string) {
    const ok = await confirm({
      title: "Delete request?",
      description: "This removes the technician request. This can't be undone.",
      confirmText: "Delete",
      destructive: true,
    })
    if (!ok) return
    try {
      await deleteReq.mutateAsync(id)
      toast.success("Request deleted")
    } catch (e) {
      toast.error("Could not delete", { description: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TechRequestStatus | "ALL")}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {TECH_REQUEST_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{TECH_REQUEST_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" className="ml-auto" onClick={onNew}>
          <Plus className="size-4" /> New request
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Inbox} title="No requests" subtitle="Requests from members will appear here." />
      ) : (
        <div className="space-y-2">
          {filtered.map((req) => {
            const canRespond = !isExpired(req) && (req.status === "pending" || req.status === "changed")
            return (
              <RequestCard
                key={req.id}
                req={req}
                requesterName={nameFor(req.requested_by)}
                onView={() => setViewing(req)}
                onRespond={canRespond ? () => setResponding(req) : undefined}
                onDelete={() => remove(req.id)}
              />
            )
          })}
        </div>
      )}

      <RespondRequestDialog request={responding} onClose={() => setResponding(null)} />
      <RequestDetailDialog
        req={viewing}
        requesterName={viewing ? nameFor(viewing.requested_by) : null}
        open={!!viewing}
        onClose={() => setViewing(null)}
        onRespond={
          viewing && !isExpired(viewing) && (viewing.status === "pending" || viewing.status === "changed")
            ? () => { setViewing(null); setResponding(viewing) }
            : undefined
        }
      />
    </div>
  )
}

// ── manager: schedule board ─────────────────────────────────────────────────
function ScheduleBoard() {
  const { data: technicians = [] } = useTechnicians()
  const { data: assignments = [] } = useTechAssignments()
  const { projects } = useProject()
  const deleteAssignment = useDeleteAssignment()
  const updateAssignment = useUpdateAssignment()
  const confirm = useConfirm()
  const [view, setView] = useState<"roster" | "places">("places")
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignTech, setAssignTech] = useState<string | undefined>()
  const [assignProjectId, setAssignProjectId] = useState<string | undefined>()

  const activeTechs = technicians.filter((t) => t.active)

  function assignmentsFor(techId: string) {
    return assignments
      .filter((a) => a.technician_id === techId)
      .sort((a, b) => a.start_date.localeCompare(b.start_date))
  }

  // Primary assignment = currently active today, falling back to next upcoming
  function getPrimaryAssignment(techId: string): TechnicianAssignment | null {
    const tas = assignments.filter((a) => a.technician_id === techId)
    const current = tas.find((a) => a.start_date <= TODAY && a.end_date >= TODAY)
    if (current) return current
    const sorted = tas.filter((a) => a.start_date > TODAY).sort((a, b) => a.start_date.localeCompare(b.start_date))
    return sorted[0] ?? null
  }

  const NO_PLACE = "__none__"

  // Columns: Unassigned + every project (regardless of whether anyone is there)
  const placeColumns = useMemo<KanbanColumn<string>[]>(
    () => [
      { id: NO_PLACE, label: "Unassigned" },
      ...projects.map((p) => ({ id: p.id, label: p.name, accentClass: "bg-primary/60" })),
    ],
    [projects],
  )

  function getTechColumn(tech: Technician): string {
    return getPrimaryAssignment(tech.id)?.project_id ?? NO_PLACE
  }

  async function moveTech(techId: string, colId: string) {
    const existing = getPrimaryAssignment(techId)
    if (colId === NO_PLACE) {
      // Dropped on Unassigned → remove current assignment
      if (!existing) return
      const ok = await confirm({
        title: "Remove assignment?",
        description: "This will unschedule the technician.",
        confirmText: "Remove",
        destructive: true,
      })
      if (!ok) return
      try {
        await deleteAssignment.mutateAsync(existing.id)
        toast.success("Moved to unassigned")
      } catch (e) {
        toast.error("Could not remove", { description: e instanceof Error ? e.message : "Unknown error" })
      }
    } else if (existing) {
      // Already has assignment → update project
      const project = projects.find((p) => p.id === colId)
      try {
        await updateAssignment.mutateAsync({
          id: existing.id,
          patch: { project_id: colId, project_name: project?.name ?? "" },
        })
        toast.success(`Moved to ${project?.name ?? colId}`)
      } catch (e) {
        toast.error("Could not move", { description: e instanceof Error ? e.message : "Unknown error" })
      }
    } else {
      // Unassigned → project: open dialog pre-filled
      setAssignTech(techId)
      setAssignProjectId(colId)
      setAssignOpen(true)
    }
  }

  async function removeAssignment(id: string) {
    const ok = await confirm({
      title: "Remove assignment?",
      description: "This unschedules the technician from this placement.",
      confirmText: "Remove",
      destructive: true,
    })
    if (!ok) return
    try {
      await deleteAssignment.mutateAsync(id)
      toast.success("Assignment removed")
    } catch (e) {
      toast.error("Could not remove", { description: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  function openAssign(techId?: string, projectId?: string) {
    setAssignTech(techId)
    setAssignProjectId(projectId)
    setAssignOpen(true)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-1.5">
        <div className="mr-auto flex rounded-sm border border-input p-0.5">
          <button
            type="button"
            aria-label="By technician"
            onClick={() => setView("roster")}
            className={cn(
              "grid size-7 place-items-center rounded-[3px] transition-colors",
              view === "roster" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutList className="size-4" />
          </button>
          <button
            type="button"
            aria-label="By project"
            onClick={() => setView("places")}
            className={cn(
              "grid size-7 place-items-center rounded-[3px] transition-colors",
              view === "places" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Columns3 className="size-4" />
          </button>
        </div>
        <Button size="sm" onClick={() => openAssign()}>
          <CalendarPlus className="size-4" /> New assignment
        </Button>
      </div>

      {activeTechs.length === 0 ? (
        <EmptyState icon={UsersRound} title="No technicians yet" subtitle="Add technicians in the Roster tab to schedule them." />
      ) : view === "places" ? (
        <>
          <p className="text-xs text-muted-foreground">
            Drag a technician to a project to assign them. Drop on Unassigned to remove their current placement.
          </p>
          <KanbanBoard<Technician, string>
            columns={placeColumns}
            items={activeTechs}
            getId={(t) => t.id}
            getColumn={getTechColumn}
            onMove={moveTech}
            emptyLabel="No technicians"
            renderCard={(t) => {
              const assignment = getPrimaryAssignment(t.id)
              return (
                <div className="flex items-start justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.full_name}</p>
                    {t.trade && <p className="text-xs text-muted-foreground">{t.trade}</p>}
                    {assignment ? (
                      <p className="mt-1 text-xs text-muted-foreground">{dateRange(assignment)}</p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground/50">Available</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => openAssign(t.id, assignment?.project_id ?? undefined)}
                      className="text-muted-foreground/50 transition hover:text-foreground"
                      title="Add assignment"
                    >
                      <Plus className="size-3.5" />
                    </button>
                    {assignment && (
                      <button
                        type="button"
                        onClick={() => removeAssignment(assignment.id)}
                        className="text-muted-foreground/50 transition hover:text-destructive"
                        title="Remove assignment"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            }}
          />
        </>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {activeTechs.map((t) => {
            const list = assignmentsFor(t.id)
            const current = list.find((a) => a.start_date <= TODAY && a.end_date >= TODAY)
            const upcoming = list.filter((a) => a.start_date > TODAY)
            return (
              <div key={t.id} className="flex flex-col rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{t.full_name}</p>
                    {t.trade && <p className="text-xs text-muted-foreground">{t.trade}</p>}
                  </div>
                  <Button size="icon" variant="ghost" className="size-7" onClick={() => openAssign(t.id)}>
                    <Plus className="size-4" />
                  </Button>
                </div>

                {/* Current */}
                <div className="mt-3">
                  {current ? (
                    <AssignmentRow a={current} tone="current" onRemove={() => removeAssignment(current.id)} />
                  ) : (
                    <p className="rounded-md bg-muted/40 px-2.5 py-2 text-xs text-muted-foreground">
                      Available today
                    </p>
                  )}
                </div>

                {/* Next */}
                {upcoming.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Up next</p>
                    {upcoming.slice(0, 3).map((a) => (
                      <AssignmentRow key={a.id} a={a} tone="next" onRemove={() => removeAssignment(a.id)} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <AssignTechnicianDialog
        open={assignOpen}
        onOpenChange={(v) => { setAssignOpen(v); if (!v) { setAssignTech(undefined); setAssignProjectId(undefined) } }}
        technicianId={assignTech}
        projectId={assignProjectId}
      />
    </div>
  )
}

function AssignmentRow({
  a,
  tone,
  onRemove,
}: {
  a: TechnicianAssignment
  tone: "current" | "next"
  onRemove: () => void
}) {
  return (
    <div
      className={`group flex items-start justify-between gap-2 rounded-md px-2.5 py-2 text-sm ${
        tone === "current" ? "bg-primary/8 border border-primary/25" : "bg-muted/40"
      }`}
    >
      <div className="min-w-0">
        <p className="flex items-center gap-1 truncate font-medium">
          <MapPin className="size-3 shrink-0 text-muted-foreground" /> {a.project_name}
        </p>
        <p className="text-xs text-muted-foreground">{dateRange(a)} · {timeLabel(a)}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 text-muted-foreground/50 opacity-0 transition hover:text-destructive group-hover:opacity-100"
        title="Remove assignment"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  )
}

// ── manager: roster ─────────────────────────────────────────────────────────
function iqamaState(expiry: string | null): "expired" | "soon" | "ok" | null {
  if (!expiry) return null
  const days = (new Date(expiry).getTime() - Date.now()) / 86_400_000
  if (days < 0) return "expired"
  if (days < 30) return "soon"
  return "ok"
}

function Roster() {
  const { data: technicians = [] } = useTechnicians()
  const deleteTech = useDeleteTechnician()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Technician | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  function openNew() { setEditing(null); setFormOpen(true) }
  function openEdit(t: Technician) { setEditing(t); setFormOpen(true) }

  async function remove(id: string) {
    try {
      await deleteTech.mutateAsync(id)
      toast.success("Technician removed")
      setConfirmId(null)
    } catch (e) {
      toast.error("Could not remove", { description: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={openNew}>
          <UserPlus className="size-4" /> Add technician
        </Button>
      </div>

      {technicians.length === 0 ? (
        <EmptyState icon={UsersRound} title="No technicians" subtitle="Add your first technician to build the roster." />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Trade</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Iqama</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {technicians.map((t) => {
                const iq = iqamaState(t.iqama_expiry)
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">
                      {t.full_name}
                      {t.nationality && (
                        <span className="ml-2 text-xs text-muted-foreground">{t.nationality}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{t.trade ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {t.phone ? (
                        <span className="flex items-center gap-1"><Phone className="size-3" /> {t.phone}</span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      {t.iqama_number ? (
                        <div className="flex flex-col">
                          <span className="font-mono text-xs">{t.iqama_number}</span>
                          {t.iqama_expiry && (
                            <span
                              className={`flex items-center gap-1 text-[11px] ${
                                iq === "expired"
                                  ? "text-red-600 dark:text-red-400"
                                  : iq === "soon"
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {(iq === "expired" || iq === "soon") && <AlertTriangle className="size-3" />}
                              exp {format(new Date(t.iqama_expiry), "d MMM yyyy")}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {t.active ? (
                        <Badge variant="secondary">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {confirmId === t.id ? (
                        <span className="inline-flex items-center gap-1">
                          <Button size="sm" variant="destructive" className="h-7" onClick={() => remove(t.id)}>
                            Delete
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7" onClick={() => setConfirmId(null)}>
                            Cancel
                          </Button>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5">
                          <Button size="icon" variant="ghost" className="size-8" onClick={() => openEdit(t)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setConfirmId(t.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <TechnicianFormDialog open={formOpen} onOpenChange={setFormOpen} technician={editing} />
    </div>
  )
}

// ── member: my requests ─────────────────────────────────────────────────────
function MyRequests({ userId }: { userId: string | undefined }) {
  const { data: requests = [] } = useTechRequests()
  const cancelReq = useCancelTechRequest()
  const [viewing, setViewing] = useState<TechnicianRequest | null>(null)
  const mine = requests.filter((r) => r.requested_by === userId)

  async function cancel(id: string) {
    try {
      await cancelReq.mutateAsync(id)
      toast.success("Request cancelled")
    } catch (e) {
      toast.error("Could not cancel", { description: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  if (mine.length === 0) {
    return <EmptyState icon={Inbox} title="No requests yet" subtitle="Request technicians for your project's next-day work." />
  }

  return (
    <div className="space-y-2.5">
      {mine.map((req) => (
        <RequestCard
          key={req.id}
          req={req}
          onView={() => setViewing(req)}
          onDelete={() => cancel(req.id)}
        />
      ))}
      <RequestDetailDialog
        req={viewing}
        open={!!viewing}
        onClose={() => setViewing(null)}
      />
    </div>
  )
}

// ── shared empty state ──────────────────────────────────────────────────────
function EmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Inbox
  title: string
  subtitle: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border bg-card py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}

// ── page ────────────────────────────────────────────────────────────────────
export default function TechniciansPage() {
  useTechniciansRealtime()
  const { profile, user } = useAuth()
  const { data: profiles = [] } = useAllProfiles()
  const { data: requests = [] } = useTechRequests()
  const isManager = !!profile?.is_admin || !!profile?.is_tech_manager

  const [requestOpen, setRequestOpen] = useState(false)

  function nameFor(uid: string | null) {
    if (!uid) return null
    const p = profiles.find((p) => p.id === uid)
    return p?.full_name ?? p?.username ?? null
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Technicians"
        subtitle={
          isManager
            ? "Manage the roster, answer requests and schedule people across projects."
            : "Request technicians for your project and track responses."
        }
      />

      {isManager ? (
        <Tabs defaultValue="requests">
          <TabsList>
            <TabsTrigger value="requests">
              Requests
              {pendingCount > 0 && (
                <Badge className="ml-1 h-4 min-w-4 justify-center px-1 text-[10px]">{pendingCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="roster">Roster</TabsTrigger>
          </TabsList>
          <div className="pt-4">
            <TabsContent value="requests"><RequestsInbox nameFor={nameFor} onNew={() => setRequestOpen(true)} /></TabsContent>
            <TabsContent value="schedule"><ScheduleBoard /></TabsContent>
            <TabsContent value="roster"><Roster /></TabsContent>
          </div>
        </Tabs>
      ) : (
        <>
          <div className="flex items-center justify-end">
            <ActionButton
              icon={Plus}
              label="Request technicians"
              primary
              onClick={() => setRequestOpen(true)}
            />
          </div>
          <Separator />
          <MyRequests userId={user?.id} />
        </>
      )}

      <RequestTechnicianDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </div>
  )
}
