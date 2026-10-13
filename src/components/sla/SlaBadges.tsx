import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { PERIOD_STATE_LABELS, PERIOD_STATE_STYLES, type PeriodState } from "@/lib/sla"
import {
  SLA_CONTRACT_STATUS_LABELS,
  SLA_ISSUE_STATUS_LABELS,
  SLA_ISSUE_STATUS_STYLES,
  SLA_SEVERITY_LABELS,
  SLA_SEVERITY_STYLES,
  type SlaContractStatus,
  type SlaIssueStatus,
  type SlaSeverity,
} from "@/lib/types"

export function PeriodStateBadge({ state, className }: { state: PeriodState; className?: string }) {
  return (
    <Badge className={cn("text-xs", PERIOD_STATE_STYLES[state], className)}>
      {PERIOD_STATE_LABELS[state]}
    </Badge>
  )
}

export function IssueStatusBadge({ status }: { status: SlaIssueStatus }) {
  return <Badge className={cn("text-xs", SLA_ISSUE_STATUS_STYLES[status])}>{SLA_ISSUE_STATUS_LABELS[status]}</Badge>
}

export function SeverityBadge({ severity }: { severity: SlaSeverity }) {
  return <Badge className={cn("text-xs", SLA_SEVERITY_STYLES[severity])}>{SLA_SEVERITY_LABELS[severity]}</Badge>
}

const CONTRACT_STYLES: Record<SlaContractStatus, string> = {
  active: "bg-emerald-100 text-emerald-800 border-transparent dark:bg-emerald-950 dark:text-emerald-300",
  on_hold: "bg-amber-100 text-amber-800 border-transparent dark:bg-amber-950 dark:text-amber-300",
  ended: "bg-muted text-muted-foreground border-transparent",
}

export function ContractStatusBadge({ status }: { status: SlaContractStatus }) {
  return <Badge className={cn("text-xs", CONTRACT_STYLES[status])}>{SLA_CONTRACT_STATUS_LABELS[status]}</Badge>
}
