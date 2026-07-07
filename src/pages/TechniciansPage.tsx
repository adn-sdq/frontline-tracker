import { useMemo, useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import {
  AlertTriangle,
  CalendarDays,
  CalendarPlus,
  Clock,
  Inbox,
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
import { PageActions } from "@/contexts/PageActionsContext"
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
import { RequestTechnicianDialog } from "@/components/technicians/RequestTechnicianDialog"
import { RespondRequestDialog } from "@/components/technicians/RespondRequestDialog"
import { TechnicianFormDialog } from "@/components/technicians/TechnicianFormDialog"
import { AssignTechnicianDialog } from "@/components/technicians/AssignTechnicianDialog"

// ── date helpers ──────────────────────────────────────────────────────────────
const TODAY = new Date().toISOString().slice(0, 10)

function fmt(d: string) {
  return format(new Date(d + "T00:00:00"), "d MMM")
}
function dateRange(a: { start_date: string; end_date: string }) {
  return a.start_date === a.end_date ? fmt(a.start_date) : `${fmt(a.start_date)} → ${fmt(a.end_date)}`
}
function timeLabel(a: { start_time: string | null; end_time: string | null }) {
  return a.start_time && a.end_time ? `${a.start_time.slice(0, 5)}–${a.end_time.slice(0, 5)}` : "All day"
}

// ── shared request card ─────────────────────────────────────────────────────
function RequestCard({
  req,
  requesterName,
  children,
}: {
  req: TechnicianRequest
  requesterName?: string | null
  children?: React.ReactNode
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{req.project_name}</span>
            <Badge variant="outline" className="gap-1 text-xs">
              <Users className="size-3" /> {req.quantity}
            </Badge>
            <Badge className={TECH_REQUEST_STATUS_STYLES[req.status]}>
              {TECH_REQUEST_STATUS_LABELS[req.status]}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="size-3.5" /> {dateRange(req)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" /> {timeLabel(req)}
            </span>
            {requesterName && <span>· by {requesterName}</span>}
            <span>· {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}</span>
          </div>
        </div>
        {children && <div className="flex shrink-0 items-center gap-1.5">{children}</div>}
      </div>

      {req.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {req.tags.map((t) => (
            <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
          ))}
        </div>
      )}
      {req.notes && <p className="mt-2 text-sm text-muted-foreground">{req.notes}</p>}
      {req.response_note && (
        <div className="mt-2 rounded-md border-l-2 border-primary/40 bg-muted/40 px-3 py-1.5 text-sm">
          <span className="font-medium">Manager: </span>
          <span className="text-muted-foreground">{req.response_note}</span>
        </div>
      )}
    </div>
  )
}

// ── manager: requests inbox ─────────────────────────────────────────────────
function RequestsInbox({ nameFor }: { nameFor: (id: string | null) => string | null }) {
  const { data: requests = [] } = useTechRequests()
  const deleteReq = useDeleteTechRequest()
  const [statusFilter, setStatusFilter] = useState<TechRequestStatus | "ALL">("ALL")
  const [responding, setResponding] = useState<TechnicianRequest | null>(null)

  const filtered = useMemo(
    () => requests.filter((r) => statusFilter === "ALL" || r.status === statusFilter),
    [requests, statusFilter]
  )

  async function remove(id: string) {
    try {
      await deleteReq.mutateAsync(id)
      toast.success("Request deleted")
    } catch (e) {
      toast.error("Could not delete", { description: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  return (
    <div className="space-y-3">
      <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TechRequestStatus | "ALL")}>
        <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All statuses</SelectItem>
          {TECH_REQUEST_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>{TECH_REQUEST_STATUS_LABELS[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {filtered.length === 0 ? (
        <EmptyState icon={Inbox} title="No requests" subtitle="Requests from members will appear here." />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((req) => (
            <RequestCard key={req.id} req={req} requesterName={nameFor(req.requested_by)}>
              {req.status === "pending" || req.status === "changed" ? (
                <Button size="sm" onClick={() => setResponding(req)}>Respond</Button>
              ) : null}
              <Button
                size="icon"
                variant="ghost"
                className="size-8 text-muted-foreground hover:text-destructive"
                onClick={() => remove(req.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </RequestCard>
          ))}
        </div>
      )}

      <RespondRequestDialog request={responding} onClose={() => setResponding(null)} />
    </div>
  )
}

// ── manager: schedule board ─────────────────────────────────────────────────
function ScheduleBoard() {
  const { data: technicians = [] } = useTechnicians()
  const { data: assignments = [] } = useTechAssignments()
  const deleteAssignment = useDeleteAssignment()
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignTech, setAssignTech] = useState<string | undefined>()

  const activeTechs = technicians.filter((t) => t.active)

  function assignmentsFor(techId: string) {
    return assignments
      .filter((a) => a.technician_id === techId)
      .sort((a, b) => a.start_date.localeCompare(b.start_date))
  }

  async function removeAssignment(id: string) {
    try {
      await deleteAssignment.mutateAsync(id)
      toast.success("Assignment removed")
    } catch (e) {
      toast.error("Could not remove", { description: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  function openAssign(techId?: string) {
    setAssignTech(techId)
    setAssignOpen(true)
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => openAssign()}>
          <CalendarPlus className="size-4" /> New assignment
        </Button>
      </div>

      {activeTechs.length === 0 ? (
        <EmptyState icon={UsersRound} title="No technicians yet" subtitle="Add technicians in the Roster tab to schedule them." />
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

      <AssignTechnicianDialog open={assignOpen} onOpenChange={setAssignOpen} technicianId={assignTech} />
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
        <RequestCard key={req.id} req={req}>
          {req.status === "pending" && (
            <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => cancel(req.id)}>
              Cancel
            </Button>
          )}
        </RequestCard>
      ))}
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
      <PageActions>
        <Button size="sm" onClick={() => setRequestOpen(true)}>
          <Plus className="size-4" /> Request technicians
        </Button>
      </PageActions>

      <PageHeader
        eyebrow="Operations"
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
            <TabsContent value="requests"><RequestsInbox nameFor={nameFor} /></TabsContent>
            <TabsContent value="schedule"><ScheduleBoard /></TabsContent>
            <TabsContent value="roster"><Roster /></TabsContent>
          </div>
        </Tabs>
      ) : (
        <>
          <Separator />
          <MyRequests userId={user?.id} />
        </>
      )}

      <RequestTechnicianDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </div>
  )
}
