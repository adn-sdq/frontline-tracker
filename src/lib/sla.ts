import { addMonths, differenceInCalendarMonths, format, parseISO, startOfMonth } from "date-fns"

import type { SlaContract, SlaIssue, SlaVisit } from "@/lib/types"

/** First day of the month as yyyy-MM-01 — the key for a visit period. */
export function periodKey(d: Date): string {
  return format(startOfMonth(d), "yyyy-MM-01")
}

export function periodLabel(period: string): string {
  return format(parseISO(period), "MMM yyyy")
}

/**
 * Every period a visit is owed for, from the contract start up to `until`
 * (inclusive) or the contract end, stepping by the visit frequency.
 */
export function expectedPeriods(c: SlaContract, until: Date): string[] {
  const start = startOfMonth(parseISO(c.start_date))
  const endCap = c.end_date ? startOfMonth(parseISO(c.end_date)) : null
  const last = endCap && endCap < startOfMonth(until) ? endCap : startOfMonth(until)
  const step = Math.max(1, c.frequency_months)
  const out: string[] = []
  for (let d = start; d <= last; d = addMonths(d, step)) out.push(periodKey(d))
  return out
}

/** The most recent period owed on or before `today`, or null if not started. */
export function currentPeriod(c: SlaContract, today = new Date()): string | null {
  const all = expectedPeriods(c, today)
  return all.length ? all[all.length - 1] : null
}

/** The next period owed strictly after `today`'s month. */
export function nextPeriod(c: SlaContract, today = new Date()): string | null {
  const start = startOfMonth(parseISO(c.start_date))
  const step = Math.max(1, c.frequency_months)
  const thisMonth = startOfMonth(today)
  const steps = Math.max(0, Math.floor(differenceInCalendarMonths(thisMonth, start) / step) + 1)
  const next = start > thisMonth ? start : addMonths(start, steps * step)
  if (c.end_date && next > startOfMonth(parseISO(c.end_date))) return null
  return periodKey(next)
}

export type PeriodState =
  | "due" // current period, nothing logged yet
  | "overdue" // past period, never completed
  | "scheduled"
  | "completed"
  | "missed"
  | "cancelled"
  | "upcoming"

export const PERIOD_STATE_LABELS: Record<PeriodState, string> = {
  due: "Due",
  overdue: "Overdue",
  scheduled: "Scheduled",
  completed: "Completed",
  missed: "Missed",
  cancelled: "Cancelled",
  upcoming: "Upcoming",
}

export const PERIOD_STATE_STYLES: Record<PeriodState, string> = {
  due: "bg-blue-100 text-blue-800 border-transparent dark:bg-blue-950 dark:text-blue-300",
  overdue: "bg-red-600 text-white border-transparent",
  scheduled: "bg-sky-100 text-sky-800 border-transparent dark:bg-sky-950 dark:text-sky-300",
  completed: "bg-emerald-600 text-white border-transparent",
  missed: "bg-red-100 text-red-800 border-transparent dark:bg-red-950 dark:text-red-300",
  cancelled: "bg-muted text-muted-foreground border-transparent",
  upcoming: "bg-muted text-muted-foreground border-transparent",
}

export function periodState(period: string, visit: SlaVisit | undefined, today = new Date()): PeriodState {
  const thisMonth = periodKey(today)
  if (visit) {
    if (visit.status === "scheduled" && period < thisMonth) return "overdue"
    return visit.status
  }
  if (period > thisMonth) return "upcoming"
  return period === thisMonth ? "due" : "overdue"
}

export const isUnresolved = (i: SlaIssue) => i.status !== "resolved"

/** Issues to review at a visit: unresolved ones raised before this visit's period. */
export function carriedOverIssues(issues: SlaIssue[], visit: SlaVisit, visitsById: Map<string, SlaVisit>) {
  return issues.filter((i) => {
    if (i.contract_id !== visit.contract_id || i.found_visit_id === visit.id) return false
    // Resolved at this visit — keep showing it so the outcome is visible.
    if (i.status === "resolved") return i.resolved_visit_id === visit.id
    const found = i.found_visit_id ? visitsById.get(i.found_visit_id) : undefined
    if (found) return found.period < visit.period
    // Raised outside a visit: carry it into any visit from its month onward.
    return i.created_at.slice(0, 10) < periodKey(addMonths(parseISO(visit.period), 1))
  })
}

export interface ContractStats {
  current: string | null
  currentState: PeriodState | null
  currentVisit: SlaVisit | undefined
  /** Past periods with no completed / missed / cancelled visit. */
  overdue: string[]
  completed: number
  /** Periods that should have a completed visit by now. */
  owed: number
  /** completed / owed, 0–100; null before the first period is owed. */
  compliance: number | null
  unsigned: number
  lastVisit: SlaVisit | undefined
  next: string | null
  openIssues: number
}

export function contractStats(
  c: SlaContract,
  visitFor: (contractId: string, period: string) => SlaVisit | undefined,
  issues: SlaIssue[],
  today = new Date()
): ContractStats {
  const thisMonth = periodKey(today)
  const periods = expectedPeriods(c, today)
  const current = periods.length ? periods[periods.length - 1] : null
  const currentVisit = current ? visitFor(c.id, current) : undefined

  let completed = 0
  let owed = 0
  let unsigned = 0
  const overdue: string[] = []
  for (const p of periods) {
    const v = visitFor(c.id, p)
    if (v?.status === "completed") {
      completed++
      if (!v.signed_storage_path) unsigned++
    }
    if (v?.status === "cancelled") continue // waived — not owed
    if (p < thisMonth || v?.status === "completed" || v?.status === "missed") owed++
    if (p < thisMonth && (!v || v.status === "scheduled")) overdue.push(p)
  }

  const done = periods
    .map((p) => visitFor(c.id, p))
    .filter((v): v is SlaVisit => v?.status === "completed")
  return {
    current,
    currentState: current ? periodState(current, currentVisit, today) : null,
    currentVisit,
    overdue,
    completed,
    owed,
    compliance: owed ? Math.round((completed / owed) * 100) : null,
    unsigned,
    lastVisit: done[done.length - 1],
    next: nextPeriod(c, today),
    openIssues: issues.filter((i) => i.contract_id === c.id && isUnresolved(i)).length,
  }
}
