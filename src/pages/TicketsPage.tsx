import { useState, useMemo } from "react"
import {
  Plus,
  Search,
  Ticket as TicketIcon,
  X,
  MapPin,
  User,
  Clock,
  LayoutList,
  Columns3,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { ActionButton } from "@/components/shell/ActionButton"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/PageHeader"
import { KanbanBoard, type KanbanColumn } from "@/components/kanban/KanbanBoard"
import { cn } from "@/lib/utils"
import { useTickets, useUpdateTicket } from "@/hooks/useTickets"
import { useAllProfiles } from "@/hooks/useAdmin"
import { TicketDialog } from "@/components/TicketDialog"
import { TicketDetailSheet } from "@/components/TicketDetailSheet"
import type { Ticket, TicketStatus, TicketPriority, TicketCategory } from "@/lib/types"
import {
  TICKET_PRIORITY_LABELS,
  TICKET_PRIORITY_STYLES,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_STYLES,
  TICKET_CATEGORY_LABELS,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  TICKET_CATEGORIES,
} from "@/lib/types"

const STATUS_DOT: Record<TicketStatus, string> = {
  open: "bg-blue-500",
  in_progress: "bg-amber-500",
  pending: "bg-violet-500",
  resolved: "bg-emerald-500",
  closed: "bg-muted-foreground/40",
}

export default function TicketsPage() {
  const { data: tickets = [], isLoading } = useTickets()
  const { data: profiles = [] } = useAllProfiles()
  const updateTicket = useUpdateTicket()

  const [view, setView] = useState<"list" | "board">("list")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "ALL">("ALL")
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "ALL">("ALL")
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | "ALL">("ALL")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)

  function nameFor(uid: string | null) {
    if (!uid) return null
    const p = profiles.find((p) => p.id === uid)
    return p?.full_name ?? p?.username ?? null
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return tickets.filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false
      if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false
      if (categoryFilter !== "ALL" && t.category !== categoryFilter) return false
      if (q) {
        const haystack = [t.ticket_number, t.title, t.project_name, t.site_contact, t.site_location, t.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [tickets, search, statusFilter, priorityFilter, categoryFilter])

  const activeFilters = [statusFilter !== "ALL", priorityFilter !== "ALL", categoryFilter !== "ALL", !!search].filter(Boolean).length

  function clearFilters() {
    setSearch("")
    setStatusFilter("ALL")
    setPriorityFilter("ALL")
    setCategoryFilter("ALL")
  }

  function openNew() {
    setEditingTicket(null)
    setDialogOpen(true)
  }

  function openEdit(t: Ticket) {
    setEditingTicket(t)
    setSelectedTicket(null)
    setDialogOpen(true)
  }

  async function moveTicket(id: string, status: TicketStatus) {
    try {
      await updateTicket.mutateAsync({ id, patch: { status } })
      toast.success(`Moved to ${TICKET_STATUS_LABELS[status]}`)
    } catch (e) {
      toast.error("Could not move ticket", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    }
  }

  const boardColumns: KanbanColumn<TicketStatus>[] = TICKET_STATUSES.map((s) => ({
    id: s,
    label: TICKET_STATUS_LABELS[s],
    accentClass: STATUS_DOT[s],
  }))

  // Count by status for header summary
  const openCount = tickets.filter((t) => t.status === "open").length
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Support Tickets"
        subtitle={
          openCount > 0 || inProgressCount > 0 ? (
            <>
              {openCount > 0 && <span>{openCount} open</span>}
              {openCount > 0 && inProgressCount > 0 && <span> · </span>}
              {inProgressCount > 0 && <span>{inProgressCount} in progress</span>}
            </>
          ) : (
            "Internal issue tracking across all projects"
          )
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-2">
        {/* Search — full width */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search tickets…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* Selects row — equal-width on mobile, natural on desktop */}
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TicketStatus | "ALL")}>
            <SelectTrigger className="flex-1 min-w-27.5 sm:w-36 sm:flex-none">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {TICKET_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{TICKET_STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as TicketPriority | "ALL")}>
            <SelectTrigger className="flex-1 min-w-27.5 sm:w-36 sm:flex-none">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All priorities</SelectItem>
              {TICKET_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>{TICKET_PRIORITY_LABELS[p]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as TicketCategory | "ALL")}>
            <SelectTrigger className="flex-1 min-w-30 sm:w-40 sm:flex-none">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All categories</SelectItem>
              {TICKET_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{TICKET_CATEGORY_LABELS[c]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground shrink-0">
              <X className="h-3.5 w-3.5" /> Clear ({activeFilters})
            </Button>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            <div className="flex rounded-sm border border-input p-0.5">
              <button
                type="button"
                aria-label="List view"
                onClick={() => setView("list")}
                className={cn(
                  "grid size-7 place-items-center rounded-[3px] transition-colors",
                  view === "list" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutList className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Board view"
                onClick={() => setView("board")}
                className={cn(
                  "grid size-7 place-items-center rounded-[3px] transition-colors",
                  view === "board" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Columns3 className="size-4" />
              </button>
            </div>
            <ActionButton icon={Plus} label="New ticket" primary onClick={openNew} />
          </div>
        </div>
      </div>

      {/* Ticket list */}
      {isLoading ? (
        <div className="divide-y overflow-hidden rounded-lg border">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={TicketIcon}
          title={tickets.length === 0 ? "No tickets yet" : "No tickets matched your search"}
          description={
            tickets.length === 0
              ? "Create the first ticket to start tracking issues."
              : "Try adjusting the filters or search term."
          }
          action={
            tickets.length === 0 && (
              <Button onClick={openNew}>
                <Plus className="h-3.5 w-3.5" /> New ticket
              </Button>
            )
          }
        />
      ) : view === "board" ? (
        <KanbanBoard<Ticket, TicketStatus>
          columns={boardColumns}
          items={filtered}
          getId={(t) => t.id}
          getColumn={(t) => t.status}
          onMove={(id, status) => moveTicket(id, status)}
          emptyLabel="No tickets"
          renderCard={(t) => (
            <button
              type="button"
              onClick={() => setSelectedTicket(t)}
              className="flex w-full flex-col gap-2 p-3 text-left"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-[11px] text-muted-foreground">{t.ticket_number}</span>
                <Badge className={cn("shrink-0", TICKET_PRIORITY_STYLES[t.priority])}>
                  {TICKET_PRIORITY_LABELS[t.priority]}
                </Badge>
              </div>
              <p className="text-sm font-medium leading-snug">{t.title}</p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                <Badge variant="outline" className="text-[10px]">
                  {TICKET_CATEGORY_LABELS[t.category]}
                </Badge>
                {t.assigned_to && (
                  <span className="flex items-center gap-1">
                    <User className="size-3 shrink-0" />
                    {nameFor(t.assigned_to) ?? "Assigned"}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="size-3 shrink-0" />
                  {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                </span>
              </div>
            </button>
          )}
        />
      ) : (
        <div className="divide-y overflow-hidden rounded-lg border bg-card">
          {filtered.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTicket(t)}
              className="flex w-full flex-col gap-2 px-4 py-3 text-left transition-colors hover:bg-accent sm:flex-row sm:items-center sm:gap-4"
            >
              {/* LEFT — title line + meta line, fixed order */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {t.ticket_number}
                  </span>
                  <p className="truncate text-sm font-medium">{t.title}</p>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span>{t.project_name}</span>
                  {t.site_location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="max-w-40 truncate">{t.site_location}</span>
                    </span>
                  )}
                  {t.assigned_to && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3 shrink-0" />
                      {nameFor(t.assigned_to) ?? "Assigned"}
                    </span>
                  )}
                </div>
              </div>

              {/* RIGHT — aligned columns: category · priority · status · age */}
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Badge variant="outline">{TICKET_CATEGORY_LABELS[t.category]}</Badge>
                <Badge className={TICKET_PRIORITY_STYLES[t.priority]}>
                  {TICKET_PRIORITY_LABELS[t.priority]}
                </Badge>
                <Badge className={TICKET_STATUS_STYLES[t.status]}>
                  {TICKET_STATUS_LABELS[t.status]}
                </Badge>
                <span className="flex w-24 items-center justify-end gap-1 text-xs text-muted-foreground tabular-nums">
                  <Clock className="h-3 w-3 shrink-0" />
                  {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <TicketDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        ticket={editingTicket}
      />

      <TicketDetailSheet
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onEdit={(t) => {
          setSelectedTicket(null)
          openEdit(t)
        }}
      />
    </div>
  )
}
