import { useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { supabase } from "@/lib/supabase"
import type {
  SlaContract,
  SlaIssue,
  SlaIssueEvent,
  SlaIssueStatus,
  SlaVisit,
} from "@/lib/types"

const CONTRACTS_KEY = ["sla_contracts"]
const VISITS_KEY = ["sla_visits"]
const ISSUES_KEY = ["sla_issues"]

const err = (e: unknown) => {
  if (e) throw e
}

// ── Queries ───────────────────────────────────────────────────────────────────
// The SLA dataset is small (tens of contracts) so lists load whole and are
// filtered client-side; this keeps period/carry-over logic in one place.

export function useSlaContracts() {
  return useQuery<SlaContract[]>({
    queryKey: CONTRACTS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sla_contracts")
        .select("*")
        .order("name", { ascending: true })
      err(error)
      return (data ?? []) as SlaContract[]
    },
  })
}

export function useSlaVisits() {
  return useQuery<SlaVisit[]>({
    queryKey: VISITS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sla_visits")
        .select("*")
        .order("period", { ascending: false })
      err(error)
      return (data ?? []) as SlaVisit[]
    },
  })
}

export function useSlaIssues() {
  return useQuery<SlaIssue[]>({
    queryKey: ISSUES_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sla_issues")
        .select("*")
        .order("created_at", { ascending: false })
      err(error)
      return (data ?? []) as SlaIssue[]
    },
  })
}

export function useSlaIssueEvents(issueId: string | null) {
  return useQuery<SlaIssueEvent[]>({
    queryKey: ["sla_issue_events", issueId],
    enabled: !!issueId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sla_issue_events")
        .select("*")
        .eq("issue_id", issueId)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
      err(error)
      return (data ?? []) as SlaIssueEvent[]
    },
  })
}

export function useSlaRealtime() {
  const qc = useQueryClient()
  useEffect(() => {
    const ch = supabase
      .channel("sla-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "sla_contracts" }, () =>
        qc.invalidateQueries({ queryKey: CONTRACTS_KEY })
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "sla_visits" }, () =>
        qc.invalidateQueries({ queryKey: VISITS_KEY })
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "sla_issues" }, () => {
        qc.invalidateQueries({ queryKey: ISSUES_KEY })
        qc.invalidateQueries({ queryKey: ["sla_issue_events"] })
      })
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [qc])
}

// ── Contracts ─────────────────────────────────────────────────────────────────

export type SlaContractInput = Omit<
  SlaContract,
  "id" | "created_by" | "created_at" | "updated_by" | "updated_at"
>

export function useSaveSlaContract() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id?: string; input: SlaContractInput }) => {
      if (args.id) {
        const { error } = await supabase.from("sla_contracts").update(args.input).eq("id", args.id)
        err(error)
        return args.id
      }
      const { data, error } = await supabase
        .from("sla_contracts")
        .insert(args.input)
        .select("id")
        .single()
      err(error)
      return (data as { id: string }).id
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CONTRACTS_KEY }),
  })
}

export function useDeleteSlaContract() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: visits } = await supabase
        .from("sla_visits")
        .select("signed_storage_path")
        .eq("contract_id", id)
      const { error } = await supabase.from("sla_contracts").delete().eq("id", id)
      err(error)
      const paths = (visits ?? [])
        .map((v) => v.signed_storage_path as string | null)
        .filter((p): p is string => !!p)
      if (paths.length) await supabase.storage.from("documents").remove(paths)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CONTRACTS_KEY })
      qc.invalidateQueries({ queryKey: VISITS_KEY })
      qc.invalidateQueries({ queryKey: ISSUES_KEY })
    },
  })
}

// ── Visits ────────────────────────────────────────────────────────────────────

export type SlaVisitInput = Pick<
  SlaVisit,
  | "contract_id"
  | "period"
  | "scheduled_date"
  | "visited_on"
  | "status"
  | "technician_ids"
  | "lead_by"
  | "work_done"
  | "customer_signatory"
  | "notes"
>

export function useSaveSlaVisit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id?: string; input: SlaVisitInput }) => {
      if (args.id) {
        const { data, error } = await supabase
          .from("sla_visits")
          .update(args.input)
          .eq("id", args.id)
          .select()
          .single()
        err(error)
        return data as SlaVisit
      }
      const { data, error } = await supabase.from("sla_visits").insert(args.input).select().single()
      err(error)
      return data as SlaVisit
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: VISITS_KEY }),
  })
}

export function useDeleteSlaVisit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (visit: SlaVisit) => {
      const { error } = await supabase.from("sla_visits").delete().eq("id", visit.id)
      err(error)
      if (visit.signed_storage_path) {
        await supabase.storage.from("documents").remove([visit.signed_storage_path])
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: VISITS_KEY })
      qc.invalidateQueries({ queryKey: ISSUES_KEY })
    },
  })
}

/** Attach (or replace) the customer-signed visit report. */
export function useUploadVisitReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { visit: SlaVisit; file: File }) => {
      const safe = args.file.name.replace(/[^\w.-]+/g, "_")
      const path = `sla/${args.visit.contract_id}/${args.visit.id}/${Date.now()}_${safe}`
      const up = await supabase.storage.from("documents").upload(path, args.file, { upsert: false })
      err(up.error)
      const { data: user } = await supabase.auth.getUser()
      const { error } = await supabase
        .from("sla_visits")
        .update({
          signed_storage_path: path,
          signed_file_name: args.file.name,
          signed_file_size: args.file.size,
          signed_uploaded_by: user.user?.id ?? null,
          signed_uploaded_at: new Date().toISOString(),
        })
        .eq("id", args.visit.id)
      if (error) {
        await supabase.storage.from("documents").remove([path])
        throw error
      }
      if (args.visit.signed_storage_path) {
        await supabase.storage.from("documents").remove([args.visit.signed_storage_path])
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: VISITS_KEY }),
  })
}

export function useRemoveVisitReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (visit: SlaVisit) => {
      const { error } = await supabase
        .from("sla_visits")
        .update({
          signed_storage_path: null,
          signed_file_name: null,
          signed_file_size: null,
          signed_uploaded_by: null,
          signed_uploaded_at: null,
        })
        .eq("id", visit.id)
      err(error)
      if (visit.signed_storage_path) {
        await supabase.storage.from("documents").remove([visit.signed_storage_path])
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: VISITS_KEY }),
  })
}

// ── Issues ────────────────────────────────────────────────────────────────────

export type SlaIssueInput = Pick<
  SlaIssue,
  "contract_id" | "found_visit_id" | "title" | "description" | "location" | "system" | "severity"
>

export function useSaveSlaIssue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id?: string; input: Partial<SlaIssueInput> }) => {
      if (args.id) {
        const { error } = await supabase.from("sla_issues").update(args.input).eq("id", args.id)
        err(error)
        return
      }
      const { error } = await supabase.from("sla_issues").insert(args.input)
      err(error)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ISSUES_KEY })
      qc.invalidateQueries({ queryKey: ["sla_issue_events"] })
    },
  })
}

/**
 * Move an issue's status. The DB trigger writes the timeline event using the
 * visit + note carried on the same update, so the change is atomic.
 */
export function useSetSlaIssueStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      issue: SlaIssue
      status: SlaIssueStatus
      visitId?: string | null
      note?: string | null
    }) => {
      const { data: user } = await supabase.auth.getUser()
      const resolving = args.status === "resolved"
      const { error } = await supabase
        .from("sla_issues")
        .update({
          status: args.status,
          status_note: args.note?.trim() || null,
          last_visit_id: args.visitId ?? null,
          resolution: resolving ? args.note?.trim() || args.issue.resolution : args.issue.resolution,
          resolved_visit_id: resolving ? args.visitId ?? null : null,
          resolved_by: resolving ? user.user?.id ?? null : null,
          resolved_at: resolving ? new Date().toISOString() : null,
        })
        .eq("id", args.issue.id)
      err(error)
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ISSUES_KEY })
      qc.invalidateQueries({ queryKey: ["sla_issue_events", vars.issue.id] })
    },
  })
}

export function useDeleteSlaIssue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sla_issues").delete().eq("id", id)
      err(error)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ISSUES_KEY }),
  })
}
