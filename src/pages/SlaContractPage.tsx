import { useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { addMonths, format, parseISO } from "date-fns"
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { StatTile } from "@/components/ui/stat-tile"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SignatureBadge } from "@/components/SignatureBadge"
import { ContractStatusBadge, PeriodStateBadge } from "@/components/sla/SlaBadges"
import { SlaContractDialog } from "@/components/sla/SlaContractDialog"
import { SlaIssueRow } from "@/components/sla/SlaIssueRow"
import { useSlaWorkspace } from "@/components/sla/useSlaWorkspace"
import { useDeleteSlaContract } from "@/hooks/useSla"
import { useSystems } from "@/hooks/useSystems"
import { contractStats, expectedPeriods, isUnresolved, periodLabel, periodState } from "@/lib/sla"
import { SLA_FREQUENCY_LABELS } from "@/lib/types"

const UPCOMING_SHOWN = 3

export default function SlaContractPage() {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const ws = useSlaWorkspace()
  const del = useDeleteSlaContract()
  const confirm = useConfirm()
  const { labelFor } = useSystems()
  const [editOpen, setEditOpen] = useState(false)
  const [showResolved, setShowResolved] = useState(false)

  const contract = ws.contractsById.get(id)
  const issues = useMemo(() => (ws.issues.data ?? []).filter((i) => i.contract_id === id), [ws.issues.data, id])
  const stats = contract ? contractStats(contract, ws.visitFor, issues) : null

  // Owed periods so far + the next few upcoming, newest first.
  const periods = useMemo(() => {
    if (!contract) return []
    const until = addMonths(new Date(), contract.frequency_months * UPCOMING_SHOWN)
    return expectedPeriods(contract, until).reverse()
  }, [contract])

  const who = (uid: string | null) => (uid ? ws.profiles[uid]?.full_name ?? ws.profiles[uid]?.username ?? "—" : "—")
  const techNames = (ids: string[]) =>
    ids.map((t) => ws.technicians.find((x) => x.id === t)?.full_name).filter(Boolean).join(", ")

  async function remove() {
    if (!contract) return
    const ok = await confirm({
      title: "Delete SLA contract?",
      description: `${contract.name}, all its visits, signed reports and issues will be permanently deleted. Consider setting the status to "Ended" instead.`,
      confirmText: "Delete contract",
      destructive: true,
    })
    if (!ok) return
    try {
      await del.mutateAsync(contract.id)
      toast.success("Contract deleted")
      navigate("/sla?tab=contracts")
    } catch (e) {
      toast.error("Could not delete", { description: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  if (ws.isLoading) {
    return <div className="flex justify-center py-16"><Spinner className="size-6" /></div>
  }
  if (!contract || !stats) {
    return (
      <EmptyState
        title="Contract not found"
        description="It may have been deleted."
        action={<Button variant="outline" onClick={() => navigate("/sla")}>Back to SLA</Button>}
      />
    )
  }

  const shownIssues = issues.filter((i) => showResolved || isUnresolved(i))

  return (
    <div className="flex flex-col gap-4">
      <Link to="/sla?tab=contracts" className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> All contracts
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{contract.name}</h1>
            <ContractStatusBadge status={contract.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {[contract.client, contract.site, contract.contract_ref].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ws.editable && (
            <Button variant="outline" onClick={() => ws.addIssue(contract.id)}>
              <Plus className="size-4" /> Log issue
            </Button>
          )}
          {ws.canManage && (
            <>
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" /> Edit
              </Button>
              <Button variant="ghost" className="text-destructive" onClick={remove} disabled={del.isPending}>
                <Trash2 className="size-4" /> Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <StatTile
          label="This period"
          value={stats.current ? periodLabel(stats.current) : "—"}
          hint={stats.currentState ? <PeriodStateBadge state={stats.currentState} /> : "Not started"}
        />
        <StatTile
          label="Compliance"
          value={stats.compliance === null ? "—" : `${stats.compliance}%`}
          hint={`${stats.completed} of ${stats.owed} visits done`}
          tone={stats.compliance !== null && stats.compliance < 80 ? "danger" : "default"}
        />
        <StatTile label="Overdue" value={stats.overdue.length} tone={stats.overdue.length ? "danger" : "default"} />
        <StatTile label="Unsigned reports" value={stats.unsigned} tone={stats.unsigned ? "warning" : "default"} />
        <StatTile label="Open issues" value={stats.openIssues} tone={stats.openIssues ? "warning" : "default"} />
      </div>

      <Tabs defaultValue="visits">
        <TabsList>
          <TabsTrigger value="visits">Visits</TabsTrigger>
          <TabsTrigger value="issues">Issues <Badge variant="secondary" className="ml-1">{stats.openIssues}</Badge></TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="visits" className="mt-4 flex flex-col gap-2">
          {periods.length === 0 && (
            <EmptyState title="No visits owed yet" description={`First visit is due ${periodLabel(contract.start_date.slice(0, 8) + "01")}.`} compact />
          )}
          {periods.map((p) => {
            const v = ws.visitFor(contract.id, p)
            const state = periodState(p, v)
            const found = v ? issues.filter((i) => i.found_visit_id === v.id).length : 0
            return (
              <button
                key={p}
                type="button"
                onClick={() => ws.openVisit({ contract, period: p })}
                className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/40"
              >
                <span className="w-20 shrink-0 text-sm font-medium">{periodLabel(p)}</span>
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                  {v
                    ? [
                        v.visited_on ? `Visited ${format(parseISO(v.visited_on), "d MMM")}` : v.scheduled_date ? `Scheduled ${format(parseISO(v.scheduled_date), "d MMM")}` : null,
                        v.lead_by ? `Lead: ${who(v.lead_by)}` : null,
                        techNames(v.technician_ids) || null,
                        found ? `${found} issue${found > 1 ? "s" : ""} found` : null,
                      ].filter(Boolean).join(" · ")
                    : state === "upcoming" ? "Not scheduled yet" : "No visit logged"}
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {v?.status === "completed" && <SignatureBadge signed={!!v.signed_storage_path} />}
                  <PeriodStateBadge state={state} />
                </span>
              </button>
            )
          })}
        </TabsContent>

        <TabsContent value="issues" className="mt-4 flex flex-col gap-2">
          <label className="flex w-fit items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
            Show resolved
          </label>
          {shownIssues.length === 0 ? (
            <EmptyState title={showResolved ? "No issues logged" : "No open issues"} compact />
          ) : (
            shownIssues.map((i) => (
              <SlaIssueRow
                key={i.id}
                issue={i}
                subtitle={[
                  i.found_visit_id && ws.visitsById.get(i.found_visit_id) ? `Found ${periodLabel(ws.visitsById.get(i.found_visit_id)!.period)}` : `Raised ${format(new Date(i.created_at), "d MMM yyyy")}`,
                  i.location,
                ].filter(Boolean).join(" · ")}
                onOpen={() => ws.openIssue(i)}
                onStatus={(s) => ws.setIssueStatus(i, s)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <dl className="grid gap-x-6 gap-y-3 rounded-lg border bg-card p-4 text-sm sm:grid-cols-[10rem_1fr]">
            <dt className="text-muted-foreground">Frequency</dt>
            <dd>{SLA_FREQUENCY_LABELS[contract.frequency_months]}{contract.preferred_day ? ` · around day ${contract.preferred_day}` : ""}</dd>
            <dt className="text-muted-foreground">Term</dt>
            <dd>
              {format(parseISO(contract.start_date), "d MMM yyyy")} – {contract.end_date ? format(parseISO(contract.end_date), "d MMM yyyy") : "open-ended"}
            </dd>
            <dt className="text-muted-foreground">Account manager</dt>
            <dd>{who(contract.account_manager)}</dd>
            <dt className="text-muted-foreground">Client contact</dt>
            <dd>{[contract.contact_name, contract.contact_phone, contract.contact_email].filter(Boolean).join(" · ") || "—"}</dd>
            <dt className="text-muted-foreground">Systems</dt>
            <dd className="flex flex-wrap gap-1">
              {contract.systems.length ? contract.systems.map((s) => <Badge key={s} variant="outline">{labelFor(s)}</Badge>) : "—"}
            </dd>
            <dt className="text-muted-foreground">Scope</dt>
            <dd className="whitespace-pre-wrap">{contract.scope || "—"}</dd>
            <dt className="text-muted-foreground">Notes</dt>
            <dd className="whitespace-pre-wrap">{contract.notes || "—"}</dd>
          </dl>
        </TabsContent>
      </Tabs>

      <SlaContractDialog open={editOpen} onOpenChange={setEditOpen} contract={contract} />
      {ws.dialogs}
    </div>
  )
}
