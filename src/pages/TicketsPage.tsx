import { useState, useMemo } from "react"
import { Plus, Search, Ticket as TicketIcon, X, MapPin, User, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

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

import { PageHeader } from "@/components/PageHeader"
import { useTickets } from "@/hooks/useTickets"
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

export default function TicketsPage() {
  const { data: tickets = [], isLoading } = useTickets()
  const { data: profiles = [] } = useAllProfiles()

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

  // Count by status for header summary
  const openCount = tickets.filter((t) => t.status === "open").length
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <PageHeader
        eyebrow="Support"
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
      >
        <Button onClick={openNew} className="shrink-0">
          <Plus className="h-4 w-4 mr-1" /> New ticket
        </Button>
      </PageHeader>

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
        </div>
      </div>

      {/* Ticket list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg border bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border bg-card py-16 text-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <TicketIcon className="h-7 w-7" />
          </div>
          <div>
            <p className="font-display text-base text-foreground">
              {tickets.length === 0 ? "No tickets yet" : "No matches"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {tickets.length === 0
                ? "Create the first ticket to start tracking issues."
                : "Try adjusting the filters or search term."}
            </p>
          </div>
          {tickets.length === 0 && (
            <Button size="sm" onClick={openNew} className="mt-1">
              <Plus className="h-3.5 w-3.5" /> New ticket
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTicket(t)}
              className="w-full text-left rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm active:scale-[0.995] space-y-2.5"
            >
              {/* Badges + ticket number */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[11px] text-muted-foreground/70 shrink-0">{t.ticket_number}</span>
                <Badge className={`${TICKET_PRIORITY_STYLES[t.priority]} text-[11px] px-1.5 py-0`}>
                  {TICKET_PRIORITY_LABELS[t.priority]}
                </Badge>
                <Badge className={`${TICKET_STATUS_STYLES[t.status]} text-[11px] px-1.5 py-0`}>
                  {TICKET_STATUS_LABELS[t.status]}
                </Badge>
                <Badge variant="outline" className="text-[11px] px-1.5 py-0">{TICKET_CATEGORY_LABELS[t.category]}</Badge>
              </div>

              {/* Title */}
              <p className="font-medium text-sm leading-snug">{t.title}</p>

              {/* Meta row — wraps gracefully on mobile */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground/70 shrink-0">{t.project_name}</span>
                {t.site_location && (
                  <span className="flex items-center gap-1 shrink-0">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate max-w-32">{t.site_location}</span>
                  </span>
                )}
                {t.assigned_to && (
                  <span className="flex items-center gap-1 shrink-0">
                    <User className="h-3 w-3 shrink-0" /> {nameFor(t.assigned_to) ?? "Assigned"}
                  </span>
                )}
                <span className="flex items-center gap-1 shrink-0 sm:ml-auto">
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
