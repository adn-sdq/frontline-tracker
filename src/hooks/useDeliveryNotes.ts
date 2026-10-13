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
  | "id"
  | "project_id"
  | "seq"
  | "generated_by"
  | "generated_at"
  | "signed_storage_path"
  | "signed_file_name"
  | "signed_file_size"
  | "signed_uploaded_by"
  | "signed_uploaded_at"
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
    mutationFn: async (note: Pick<DeliveryNote, "id" | "signed_storage_path">) => {
      const { error } = await supabase
        .from("delivery_notes")
        .delete()
        .eq("id", note.id)
      if (error) throw error
      if (note.signed_storage_path) {
        await supabase.storage.from("documents").remove([note.signed_storage_path])
      }
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

const SIGNED_COLS = {
  signed_storage_path: null,
  signed_file_name: null,
  signed_file_size: null,
  signed_uploaded_by: null,
  signed_uploaded_at: null,
}

/** Attach (or replace) the signed scan of a delivery note. */
export function useUploadSignedDn() {
  const qc = useQueryClient()
  const { currentProjectId } = useProject()
  return useMutation({
    mutationFn: async (args: { note: DeliveryNote; file: File }) => {
      const safe = args.file.name.replace(/[^\w.\-]+/g, "_")
      const path = `delivery-notes/${args.note.id}/${Date.now()}_${safe}`
      const up = await supabase.storage
        .from("documents")
        .upload(path, args.file, { upsert: false })
      if (up.error) throw up.error
      const { data: user } = await supabase.auth.getUser()
      const { error } = await supabase
        .from("delivery_notes")
        .update({
          signed_storage_path: path,
          signed_file_name: args.file.name,
          signed_file_size: args.file.size,
          signed_uploaded_by: user.user?.id ?? null,
          signed_uploaded_at: new Date().toISOString(),
        })
        .eq("id", args.note.id)
      if (error) {
        await supabase.storage.from("documents").remove([path])
        throw error
      }
      // Replacing: drop the previous scan.
      if (args.note.signed_storage_path) {
        await supabase.storage.from("documents").remove([args.note.signed_storage_path])
      }
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [...DN_KEY, currentProjectId] }),
  })
}

/** Remove the signed scan — the note reverts to Unsigned. */
export function useRemoveSignedDn() {
  const qc = useQueryClient()
  const { currentProjectId } = useProject()
  return useMutation({
    mutationFn: async (note: DeliveryNote) => {
      const { error } = await supabase
        .from("delivery_notes")
        .update(SIGNED_COLS)
        .eq("id", note.id)
      if (error) throw error
      if (note.signed_storage_path) {
        await supabase.storage.from("documents").remove([note.signed_storage_path])
      }
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [...DN_KEY, currentProjectId] }),
  })
}
