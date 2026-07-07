import { useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { supabase } from "@/lib/supabase"
import type {
  Technician,
  TechnicianAssignment,
  TechnicianRequest,
  TechRequestStatus,
} from "@/lib/types"

// ── Roster ───────────────────────────────────────────────────────────────────
const TECHNICIANS_KEY = ["technicians"]
const REQUESTS_KEY = ["technician_requests"]
const ASSIGNMENTS_KEY = ["technician_assignments"]

export function useTechnicians() {
  return useQuery<Technician[]>({
    queryKey: TECHNICIANS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("technicians")
        .select("*")
        .order("active", { ascending: false })
        .order("full_name", { ascending: true })
      if (error) throw error
      return (data ?? []) as Technician[]
    },
  })
}

export type TechnicianInput = {
  full_name: string
  iqama_number?: string | null
  iqama_expiry?: string | null
  phone?: string | null
  nationality?: string | null
  trade?: string | null
  notes?: string | null
  active?: boolean
}

export function useCreateTechnician() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: TechnicianInput) => {
      const { data, error } = await supabase
        .from("technicians")
        .insert({
          full_name: input.full_name,
          iqama_number: input.iqama_number ?? null,
          iqama_expiry: input.iqama_expiry ?? null,
          phone: input.phone ?? null,
          nationality: input.nationality ?? null,
          trade: input.trade ?? null,
          notes: input.notes ?? null,
          active: input.active ?? true,
        })
        .select()
        .single()
      if (error) throw error
      return data as Technician
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TECHNICIANS_KEY }),
  })
}

export function useUpdateTechnician() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: string; patch: Partial<TechnicianInput> }) => {
      const { error } = await supabase
        .from("technicians")
        .update(args.patch)
        .eq("id", args.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TECHNICIANS_KEY }),
  })
}

export function useDeleteTechnician() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("technicians").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TECHNICIANS_KEY })
      qc.invalidateQueries({ queryKey: ASSIGNMENTS_KEY })
    },
  })
}

// ── Requests ─────────────────────────────────────────────────────────────────
export function useTechRequests() {
  return useQuery<TechnicianRequest[]>({
    queryKey: REQUESTS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("technician_requests")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      return (data ?? []) as TechnicianRequest[]
    },
  })
}

export type TechRequestInput = {
  project_id?: string | null
  project_name: string
  quantity: number
  start_date: string
  end_date: string
  start_time?: string | null
  end_time?: string | null
  tags: string[]
  notes?: string | null
}

export function useCreateTechRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: TechRequestInput) => {
      const { data, error } = await supabase
        .from("technician_requests")
        .insert({
          project_id: input.project_id ?? null,
          project_name: input.project_name,
          quantity: input.quantity,
          start_date: input.start_date,
          end_date: input.end_date,
          start_time: input.start_time ?? null,
          end_time: input.end_time ?? null,
          tags: input.tags,
          notes: input.notes ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data as TechnicianRequest
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: REQUESTS_KEY }),
  })
}

// Tech-manager response — approve / change / decline, with an optional note.
export function useRespondTechRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      id: string
      status: TechRequestStatus
      response_note?: string | null
      responded_by: string | null
    }) => {
      const { error } = await supabase
        .from("technician_requests")
        .update({
          status: args.status,
          response_note: args.response_note ?? null,
          responded_by: args.responded_by,
          responded_at: new Date().toISOString(),
        })
        .eq("id", args.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: REQUESTS_KEY }),
  })
}

// Requester cancels their own pending request.
export function useCancelTechRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("technician_requests")
        .update({ status: "cancelled" })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: REQUESTS_KEY }),
  })
}

export function useDeleteTechRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("technician_requests").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: REQUESTS_KEY }),
  })
}

// ── Assignments ──────────────────────────────────────────────────────────────
export function useTechAssignments() {
  return useQuery<TechnicianAssignment[]>({
    queryKey: ASSIGNMENTS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("technician_assignments")
        .select("*")
        .order("start_date", { ascending: true })
      if (error) throw error
      return (data ?? []) as TechnicianAssignment[]
    },
  })
}

export type AssignmentInput = {
  technician_id: string
  project_id?: string | null
  project_name: string
  request_id?: string | null
  start_date: string
  end_date: string
  start_time?: string | null
  end_time?: string | null
  notes?: string | null
}

export function useCreateAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: AssignmentInput) => {
      const { data, error } = await supabase
        .from("technician_assignments")
        .insert({
          technician_id: input.technician_id,
          project_id: input.project_id ?? null,
          project_name: input.project_name,
          request_id: input.request_id ?? null,
          start_date: input.start_date,
          end_date: input.end_date,
          start_time: input.start_time ?? null,
          end_time: input.end_time ?? null,
          notes: input.notes ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data as TechnicianAssignment
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ASSIGNMENTS_KEY }),
  })
}

export function useDeleteAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("technician_assignments").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ASSIGNMENTS_KEY }),
  })
}

// ── Realtime ─────────────────────────────────────────────────────────────────
export function useTechniciansRealtime() {
  const qc = useQueryClient()
  useEffect(() => {
    const ch = supabase
      .channel("technicians-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "technicians" }, () =>
        qc.invalidateQueries({ queryKey: TECHNICIANS_KEY })
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "technician_requests" }, () =>
        qc.invalidateQueries({ queryKey: REQUESTS_KEY })
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "technician_assignments" }, () =>
        qc.invalidateQueries({ queryKey: ASSIGNMENTS_KEY })
      )
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [qc])
}
