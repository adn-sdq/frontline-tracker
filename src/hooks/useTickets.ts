import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { Ticket, TicketComment, TicketCategory, TicketPriority, TicketStatus } from "@/lib/types"

// Derive ticket prefix from project name (first letter of each word, max 5 uppercase chars)
export function computeTicketPrefix(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .join("")
    .slice(0, 5)
  return initials || "GEN"
}

export interface TicketInput {
  title: string
  description?: string
  project_id?: string | null
  project_name: string
  category: TicketCategory
  priority: TicketPriority
  site_contact?: string
  site_phone?: string
  site_location?: string
  assigned_to?: string | null
}

const TICKETS_KEY = ["tickets"] as const
const TICKET_COMMENTS_KEY = (id: string) => ["ticket_comments", id] as const

export function useTickets() {
  return useQuery<Ticket[]>({
    queryKey: TICKETS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      return data as Ticket[]
    },
  })
}

export function useTicket(id: string | null) {
  return useQuery<Ticket | null>({
    queryKey: ["ticket", id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("id", id)
        .single()
      if (error) throw error
      return data as Ticket
    },
    enabled: !!id,
  })
}

export function useTicketComments(ticketId: string | null) {
  return useQuery<TicketComment[]>({
    queryKey: TICKET_COMMENTS_KEY(ticketId ?? ""),
    queryFn: async () => {
      if (!ticketId) return []
      const { data, error } = await supabase
        .from("ticket_comments")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true })
      if (error) throw error
      return data as TicketComment[]
    },
    enabled: !!ticketId,
  })
}

export function useCreateTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: TicketInput) => {
      const prefix = computeTicketPrefix(input.project_name)
      const year = new Date().getFullYear()
      // Atomic sequence reservation via advisory-locked RPC
      const { data: seqData, error: seqErr } = await supabase.rpc("next_ticket_seq", {
        p_prefix: prefix,
        p_year: year,
      })
      if (seqErr) throw seqErr
      const seq = seqData as number
      const ticketNumber = `${prefix}-TKT-${year}-${String(seq).padStart(3, "0")}`
      const { data, error } = await supabase
        .from("tickets")
        .insert({
          ticket_prefix: prefix,
          ticket_year: year,
          seq,
          ticket_number: ticketNumber,
          title: input.title,
          description: input.description ?? null,
          project_id: input.project_id ?? null,
          project_name: input.project_name,
          category: input.category,
          priority: input.priority,
          site_contact: input.site_contact ?? null,
          site_phone: input.site_phone ?? null,
          site_location: input.site_location ?? null,
          assigned_to: input.assigned_to ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data as Ticket
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TICKETS_KEY }),
  })
}

export function useUpdateTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string
      patch: Partial<TicketInput> & { status?: TicketStatus }
    }) => {
      const { data, error } = await supabase
        .from("tickets")
        .update(patch)
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      return data as Ticket
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: TICKETS_KEY })
      qc.invalidateQueries({ queryKey: ["ticket", data.id] })
    },
  })
}

export function useDeleteTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tickets").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TICKETS_KEY }),
  })
}

export function useAddTicketComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ ticketId, body }: { ticketId: string; body: string }) => {
      const { data, error } = await supabase
        .from("ticket_comments")
        .insert({ ticket_id: ticketId, body })
        .select()
        .single()
      if (error) throw error
      return data as TicketComment
    },
    onSuccess: (_d, { ticketId }) =>
      qc.invalidateQueries({ queryKey: TICKET_COMMENTS_KEY(ticketId) }),
  })
}
