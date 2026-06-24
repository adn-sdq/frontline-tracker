import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { supabase } from "@/lib/supabase"
import { useProject } from "@/contexts/ProjectContext"
import type { DeliveryNote } from "@/lib/types"

const DN_KEY = ["delivery_notes"]

export function useDeliveryNotes() {
  const { currentProjectId } = useProject()
  return useQuery<DeliveryNote[]>({
    queryKey: [...DN_KEY, currentProjectId],
    enabled: !!currentProjectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_notes")
        .select("*")
        .eq("project_id", currentProjectId)
        .order("seq", { ascending: false })
      if (error) throw error
      return (data ?? []) as DeliveryNote[]
    },
  })
}

export type NewDeliveryNote = Omit<
  DeliveryNote,
  "id" | "project_id" | "seq" | "generated_by" | "generated_at"
>

export function useCreateDeliveryNote() {
  const qc = useQueryClient()
  const { currentProjectId } = useProject()
  return useMutation({
    mutationFn: async (note: NewDeliveryNote) => {
      if (!currentProjectId) throw new Error("No project selected")
      // Reserve the next per-project sequence number atomically.
      const { data: seq, error: seqErr } = await supabase.rpc("next_dn_seq", {
        p_project: currentProjectId,
      })
      if (seqErr) throw seqErr
      const { data: user } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from("delivery_notes")
        .insert({
          ...note,
          project_id: currentProjectId,
          seq,
          dn_number: note.dn_number || String(seq),
          generated_by: user.user?.id ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data as DeliveryNote
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [...DN_KEY, currentProjectId] }),
  })
}

export function useDeleteDeliveryNote() {
  const qc = useQueryClient()
  const { currentProjectId } = useProject()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("delivery_notes")
        .delete()
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [...DN_KEY, currentProjectId] }),
  })
}

// Suggest the next DN number for the form before the row is actually created.
export function useNextDnNumber() {
  const { currentProjectId } = useProject()
  return useQuery<number>({
    queryKey: [...DN_KEY, "next", currentProjectId],
    enabled: !!currentProjectId,
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_notes")
        .select("seq")
        .eq("project_id", currentProjectId)
        .order("seq", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return ((data?.seq as number | undefined) ?? 0) + 1
    },
  })
}
