import { useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  AlertTriangle,
  ExternalLink,
  Pencil,
  Trash2,
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
import { DataTable } from "@/components/ui/data-table"
import { useConfirm } from "@/components/ui/confirm-dialog"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { useDeleteSlaContract } from "@/hooks/useSla"
import { ContractStatusBadge, PeriodStateBadge } from "@/components/sla/SlaBadges"
import { SlaContractDialog } from "@/components/sla/SlaContractDialog"
import { SlaIssueRow } from "@/components/sla/SlaIssueRow"
import { useSlaWorkspace } from "@/components/sla/useSlaWorkspace"
import { contractStats, isUnresolved, periodLabel, periodState, type PeriodState } from "@/lib/sla"
import { cn, errorMessage } from "@/lib/utils"
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
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editContract, setEditContract] = useState<SlaContract | null>(null)
  const delContract = useDeleteSlaContract()
  const confirm = useConfirm()

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

  const contractColumns: ColumnDef<SlaContract, unknown>[] = [
    {
      id: "contract",
      accessorFn: (c) => c.name,
      header: "Contract",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">
            {[row.original.client, row.original.site, row.original.contract_ref].filter(Boolean).join(" · ") || "—"}
          </div>
        </div>
      ),
    },
    { id: "frequency", accessorFn: (c) => c.frequency_months, header: "Frequency", cell: ({ row }) => <span className="whitespace-nowrap">{SLA_FREQUENCY_LABELS[row.original.frequency_months]}</span> },
    { id: "status", accessorFn: (c) => c.status, header: "Status", cell: ({ row }) => <ContractStatusBadge status={row.original.status} /> },
    {
      id: "period",
      header: "This period",
      enableSorting: false,
      cell: ({ row }) => {
        const st = stats.get(row.original.id)!
        return st.currentState ? <PeriodStateBadge state={st.overdue.length ? "overdue" : st.currentState} /> : <span className="text-xs text-muted-foreground">Not started</span>
      },
    },
    {
      id: "last_visit",
      accessorFn: (c) => stats.get(c.id)?.lastVisit?.period ?? "",
      header: "Last visit",
      cell: ({ row }) => {
        const st = stats.get(row.original.id)!
        return <span className="whitespace-nowrap text-muted-foreground">{st.lastVisit ? periodLabel(st.lastVisit.period) : "—"}</span>
      },
    },
    {
      id: "compliance",
      accessorFn: (c) => stats.get(c.id)?.compliance ?? -1,
      header: "Compliance",
      cell: ({ row }) => {
        const v = stats.get(row.original.id)!.compliance
        return <span className={cn("tabular-nums", v !== null && v < 80 && "text-destructive")}>{v === null ? "—" : `${v}%`}</span>
      },
    },
    {
      id: "open_issues",
      accessorFn: (c) => stats.get(c.id)?.openIssues ?? 0,
      header: "Open issues",
      cell: ({ row }) => <span className="tabular-nums">{stats.get(row.original.id)!.openIssues || "—"}</span>,
    },
  ]

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
              <DataTable
                tableId="sla-contracts"
                columns={contractColumns}
                data={filteredContracts}
                getRowId={(c) => c.id}
                noun="contract"
                pageSize={50}
                emptyMessage="No contracts match."
                onRowClick={(c) => navigate(`/sla/${c.id}`)}
                selection={ws.canManage ? { selected, onChange: setSelected } : undefined}
                onBulkDelete={ws.canManage ? async (rows) => {
                  try {
                    await Promise.all(rows.map((c) => delContract.mutateAsync(c.id)))
                    toast.success(`Deleted ${rows.length} contract${rows.length > 1 ? "s" : ""}`)
                  } catch (e) {
                    toast.error("Could not delete some contracts", { description: errorMessage(e) })
                  }
                } : undefined}
                rowActions={(c) => [
                  { label: "Open", icon: ExternalLink, onClick: () => navigate(`/sla/${c.id}`) },
                  { label: "Edit", icon: Pencil, onClick: () => setEditContract(c), hidden: !ws.canManage },
                  {
                    label: "Delete",
                    icon: Trash2,
                    destructive: true,
                    separator: true,
                    hidden: !ws.canManage,
                    onClick: async () => {
                      const ok = await confirm({
                        title: `Delete ${c.name}?`,
                        description: "Its visits, reports and issues are deleted too. This can't be undone.",
                        confirmText: "Delete",
                        destructive: true,
                      })
                      if (!ok) return
                      try {
                        await delContract.mutateAsync(c.id)
                        toast.success("Contract deleted")
                      } catch (e) {
                        toast.error("Could not delete", { description: errorMessage(e) })
                      }
                    },
                  },
                ]}
              />
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

      <SlaContractDialog open={!!editContract} onOpenChange={(o) => !o && setEditContract(null)} contract={editContract} />
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
