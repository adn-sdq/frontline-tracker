import { useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  AlertTriangle,
  CalendarCheck2,
  CalendarClock,
  FileWarning,
  ListChecks,
  Plus,
  Search,
} from "lucide-react"

import { PageHeader } from "@/components/PageHeader"
import { ActionButton } from "@/components/shell/ActionButton"
import { SignatureBadge } from "@/components/SignatureBadge"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { StatTile } from "@/components/ui/stat-tile"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ContractStatusBadge, PeriodStateBadge } from "@/components/sla/SlaBadges"
import { SlaContractDialog } from "@/components/sla/SlaContractDialog"
import { SlaIssueRow } from "@/components/sla/SlaIssueRow"
import { useSlaWorkspace } from "@/components/sla/useSlaWorkspace"
import { contractStats, isUnresolved, periodLabel, periodState, type PeriodState } from "@/lib/sla"
import { cn } from "@/lib/utils"
import {
  SLA_FREQUENCY_LABELS,
  SLA_ISSUE_STATUSES,
  SLA_ISSUE_STATUS_LABELS,
  SLA_SEVERITIES,
  SLA_SEVERITY_LABELS,
  type SlaContract,
} from "@/lib/types"

const STATE_ORDER: Record<PeriodState, number> = {
  overdue: 0,
  due: 1,
  scheduled: 2,
  missed: 3,
  completed: 4,
  cancelled: 5,
  upcoming: 6,
}

type Tab = "month" | "contracts" | "issues"

export default function SlaPage() {
  const ws = useSlaWorkspace()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = (params.get("tab") as Tab) ?? "month"
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [issueStatus, setIssueStatus] = useState("UNRESOLVED")
  const [severity, setSeverity] = useState("ALL")

  const contracts = useMemo(() => ws.contracts.data ?? [], [ws.contracts.data])
  const issues = useMemo(() => ws.issues.data ?? [], [ws.issues.data])
  const active = contracts.filter((c) => c.status === "active")

  const stats = useMemo(
    () => new Map(contracts.map((c) => [c.id, contractStats(c, ws.visitFor, issues)])),
    [contracts, ws.visitFor, issues]
  )

  // This month: every active contract's current period + any overdue backlog.
  const monthRows = useMemo(() => {
    const rows: { contract: SlaContract; period: string; state: PeriodState }[] = []
    for (const c of active) {
      const s = stats.get(c.id)!
      for (const p of s.overdue) rows.push({ contract: c, period: p, state: "overdue" })
      if (s.current && !s.overdue.includes(s.current)) {
        rows.push({ contract: c, period: s.current, state: periodState(s.current, ws.visitFor(c.id, s.current)) })
      }
    }
    return rows.sort(
      (a, b) => STATE_ORDER[a.state] - STATE_ORDER[b.state] || a.period.localeCompare(b.period) || a.contract.name.localeCompare(b.contract.name)
    )
  }, [active, stats, ws])

  const totals = useMemo(() => {
    let overdue = 0
    let dueNow = 0
    let unsigned = 0
    for (const c of active) {
      const s = stats.get(c.id)!
      overdue += s.overdue.length
      if (s.currentState === "due" || s.currentState === "scheduled") dueNow++
    }
    for (const c of contracts) unsigned += stats.get(c.id)!.unsigned
    return { overdue, dueNow, unsigned, open: issues.filter(isUnresolved).length }
  }, [active, contracts, stats, issues])

  const q = search.trim().toLowerCase()
  const filteredContracts = contracts.filter(
    (c) => !q || [c.name, c.client, c.site, c.contract_ref].some((v) => v?.toLowerCase().includes(q))
  )
  const filteredIssues = issues.filter((i) => {
    if (issueStatus === "UNRESOLVED" ? !isUnresolved(i) : issueStatus !== "ALL" && i.status !== issueStatus) return false
    if (severity !== "ALL" && i.severity !== severity) return false
    if (q && ![i.title, i.description, i.location, ws.contractsById.get(i.contract_id)?.name].some((v) => v?.toLowerCase().includes(q))) return false
    return true
  })

  const setTab = (t: string) => setParams((p) => { p.set("tab", t); return p }, { replace: true })

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="SLA" subtitle="Maintenance contracts, monthly visits, signed reports and issues.">
        {ws.canManage && (
          <ActionButton icon={Plus} label="New contract" primary onClick={() => setCreateOpen(true)} />
        )}
      </PageHeader>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <StatTile label="Active contracts" value={active.length} icon={CalendarCheck2} onClick={() => setTab("contracts")} />
        <StatTile label="Due this month" value={totals.dueNow} icon={CalendarClock} onClick={() => setTab("month")} />
        <StatTile
          label="Overdue visits"
          value={totals.overdue}
          icon={AlertTriangle}
          tone={totals.overdue ? "danger" : "default"}
          onClick={() => setTab("month")}
        />
        <StatTile
          label="Unsigned reports"
          value={totals.unsigned}
          icon={FileWarning}
          tone={totals.unsigned ? "warning" : "default"}
          hint="Completed visits awaiting signature"
        />
        <StatTile
          label="Open issues"
          value={totals.open}
          icon={ListChecks}
          tone={totals.open ? "warning" : "default"}
          onClick={() => { setIssueStatus("UNRESOLVED"); setTab("issues") }}
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <TabsList>
            <TabsTrigger value="month">This month</TabsTrigger>
            <TabsTrigger value="contracts">Contracts <Badge variant="secondary" className="ml-1">{contracts.length}</Badge></TabsTrigger>
            <TabsTrigger value="issues">Issues <Badge variant="secondary" className="ml-1">{totals.open}</Badge></TabsTrigger>
          </TabsList>
          {tab !== "month" && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-8" />
            </div>
          )}
        </div>

        {ws.isLoading ? (
          <div className="flex justify-center py-16"><Spinner className="size-6" /></div>
        ) : contracts.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={CalendarCheck2}
            title="No SLA contracts yet"
            description={ws.canManage ? "Create a contract to start tracking visits." : "An SLA manager needs to add contracts."}
          />
        ) : (
          <>
            {/* ── This month ─────────────────────────────────────────── */}
            <TabsContent value="month" className="mt-4">
              {monthRows.length === 0 ? (
                <EmptyState icon={CalendarCheck2} title="Nothing due" description="No active contracts owe a visit right now." compact />
              ) : (
                <div className="flex flex-col gap-2">
                  {monthRows.map(({ contract: c, period, state }) => {
                    const v = ws.visitFor(c.id, period)
                    const s = stats.get(c.id)!
                    return (
                      <button
                        key={`${c.id}:${period}`}
                        type="button"
                        onClick={() => ws.openVisit({ contract: c, period })}
                        className={cn(
                          "flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/40",
                          state === "overdue" && "border-destructive/40"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-medium">{c.name}</span>
                            <span className="text-xs text-muted-foreground">{periodLabel(period)}</span>
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {[c.client, c.site].filter(Boolean).join(" · ") || "—"}
                            {v?.scheduled_date && state !== "completed" && ` · scheduled ${v.scheduled_date}`}
                            {v?.visited_on && ` · visited ${v.visited_on}`}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {s.openIssues > 0 && (
                            <Badge variant="outline" className="text-xs">{s.openIssues} open issue{s.openIssues > 1 ? "s" : ""}</Badge>
                          )}
                          {v?.status === "completed" && <SignatureBadge signed={!!v.signed_storage_path} />}
                          <PeriodStateBadge state={state} />
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            {/* ── Contracts ──────────────────────────────────────────── */}
            <TabsContent value="contracts" className="mt-4">
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Contract</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>This period</TableHead>
                      <TableHead>Last visit</TableHead>
                      <TableHead className="text-right">Compliance</TableHead>
                      <TableHead className="text-right">Open issues</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContracts.map((c) => {
                      const s = stats.get(c.id)!
                      return (
                        <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/sla/${c.id}`)}>
                          <TableCell>
                            <div className="font-medium">{c.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {[c.client, c.site, c.contract_ref].filter(Boolean).join(" · ") || "—"}
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{SLA_FREQUENCY_LABELS[c.frequency_months]}</TableCell>
                          <TableCell><ContractStatusBadge status={c.status} /></TableCell>
                          <TableCell>
                            {s.currentState ? <PeriodStateBadge state={s.overdue.length ? "overdue" : s.currentState} /> : <span className="text-xs text-muted-foreground">Not started</span>}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {s.lastVisit ? periodLabel(s.lastVisit.period) : "—"}
                          </TableCell>
                          <TableCell className={cn("text-right tabular-nums", s.compliance !== null && s.compliance < 80 && "text-destructive")}>
                            {s.compliance === null ? "—" : `${s.compliance}%`}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{s.openIssues || "—"}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* ── Issues ─────────────────────────────────────────────── */}
            <TabsContent value="issues" className="mt-4 flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <Select value={issueStatus} onValueChange={setIssueStatus}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNRESOLVED">Unresolved</SelectItem>
                    <SelectItem value="ALL">All statuses</SelectItem>
                    {SLA_ISSUE_STATUSES.map((s) => <SelectItem key={s} value={s}>{SLA_ISSUE_STATUS_LABELS[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All severities</SelectItem>
                    {SLA_SEVERITIES.map((s) => <SelectItem key={s} value={s}>{SLA_SEVERITY_LABELS[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {filteredIssues.length === 0 ? (
                <EmptyState icon={ListChecks} title="No issues match" compact />
              ) : (
                filteredIssues.map((i) => (
                  <SlaIssueRow
                    key={i.id}
                    issue={i}
                    subtitle={[ws.contractsById.get(i.contract_id)?.name, i.location].filter(Boolean).join(" · ")}
                    onOpen={() => ws.openIssue(i)}
                    onStatus={(s) => ws.setIssueStatus(i, s)}
                  />
                ))
              )}
            </TabsContent>
          </>
        )}
      </Tabs>

      <SlaContractDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        contract={null}
        onSaved={(id) => navigate(`/sla/${id}`)}
      />
      {ws.dialogs}
    </div>
  )
}
