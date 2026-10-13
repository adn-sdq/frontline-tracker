import { useMemo, useState } from "react"

import { SlaIssueDialog, SlaIssueStatusDialog } from "@/components/sla/SlaIssueDialogs"
import { SlaIssueSheet } from "@/components/sla/SlaIssueSheet"
import { SlaVisitSheet, type VisitTarget } from "@/components/sla/SlaVisitSheet"
import { useAuth } from "@/contexts/AuthContext"
import { useProfiles } from "@/hooks/useItems"
import { useTechnicians } from "@/hooks/useTechnicians"
import { useSlaContracts, useSlaIssues, useSlaRealtime, useSlaVisits } from "@/hooks/useSla"
import type { SlaIssue, SlaIssueStatus } from "@/lib/types"

/**
 * Loads the SLA dataset and owns every SLA sheet/dialog, so pages only render
 * lists and call `openVisit` / `openIssue` / `addIssue`. Render `dialogs` once.
 */
export function useSlaWorkspace() {
  useSlaRealtime()
  const { profile } = useAuth()
  const contracts = useSlaContracts()
  const visits = useSlaVisits()
  const issues = useSlaIssues()
  const { data: profiles = {} } = useProfiles()
  const { data: technicians = [] } = useTechnicians()

  const canManage = !!(profile?.is_admin || profile?.is_sla_manager)

  const visitsById = useMemo(() => new Map((visits.data ?? []).map((v) => [v.id, v])), [visits.data])
  const visitFor = useMemo(() => {
    const m = new Map<string, NonNullable<typeof visits.data>[number]>()
    for (const v of visits.data ?? []) m.set(`${v.contract_id}:${v.period}`, v)
    return (contractId: string, period: string) => m.get(`${contractId}:${period}`)
  }, [visits.data])
  const contractsById = useMemo(
    () => new Map((contracts.data ?? []).map((c) => [c.id, c])),
    [contracts.data]
  )

  const [visitTarget, setVisitTarget] = useState<VisitTarget | null>(null)
  const [issueId, setIssueId] = useState<string | null>(null)
  const [issueForm, setIssueForm] = useState<{ contractId: string; visitId?: string | null; issue?: SlaIssue } | null>(null)
  const [statusTarget, setStatusTarget] = useState<{ issue: SlaIssue; status: SlaIssueStatus; visitId?: string | null } | null>(null)

  // Always render the live copy from the cache.
  const openIssueRow = issueId ? (issues.data ?? []).find((i) => i.id === issueId) ?? null : null
  const liveVisitTarget = visitTarget
    ? { ...visitTarget, contract: contractsById.get(visitTarget.contract.id) ?? visitTarget.contract }
    : null

  const dialogs = (
    <>
      <SlaVisitSheet
        target={liveVisitTarget}
        visit={liveVisitTarget ? visitFor(liveVisitTarget.contract.id, liveVisitTarget.period) : undefined}
        issues={issues.data ?? []}
        visitsById={visitsById}
        profiles={profiles}
        technicians={technicians}
        canManage={canManage}
        onClose={() => setVisitTarget(null)}
        onOpenIssue={(i) => setIssueId(i.id)}
        onIssueStatus={(issue, status, visitId) => setStatusTarget({ issue, status, visitId })}
        onAddIssue={(visitId) =>
          liveVisitTarget && setIssueForm({ contractId: liveVisitTarget.contract.id, visitId })
        }
      />
      <SlaIssueSheet
        issue={openIssueRow}
        contractName={openIssueRow ? contractsById.get(openIssueRow.contract_id)?.name : undefined}
        visitsById={visitsById}
        profiles={profiles}
        canManage={canManage}
        onClose={() => setIssueId(null)}
        onEdit={(issue) => setIssueForm({ contractId: issue.contract_id, issue })}
        onStatus={(issue, status) =>
          setStatusTarget({ issue, status, visitId: visitTarget ? visitFor(visitTarget.contract.id, visitTarget.period)?.id : null })
        }
      />
      <SlaIssueDialog
        open={!!issueForm}
        onOpenChange={(o) => !o && setIssueForm(null)}
        contractId={issueForm?.contractId ?? ""}
        visitId={issueForm?.visitId}
        issue={issueForm?.issue}
      />
      <SlaIssueStatusDialog target={statusTarget} onClose={() => setStatusTarget(null)} />
    </>
  )

  return {
    contracts,
    visits,
    issues,
    profiles,
    technicians,
    canManage,
    visitFor,
    visitsById,
    contractsById,
    isLoading: contracts.isLoading || visits.isLoading || issues.isLoading,
    openVisit: (target: VisitTarget) => setVisitTarget(target),
    openIssue: (issue: SlaIssue) => setIssueId(issue.id),
    addIssue: (contractId: string) => setIssueForm({ contractId }),
    setIssueStatus: (issue: SlaIssue, status: SlaIssueStatus) => setStatusTarget({ issue, status }),
    dialogs,
  }
}
