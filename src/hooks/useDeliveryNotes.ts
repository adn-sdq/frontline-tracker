import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { supabase } from "@/lib/supabase"
import { useProject } from "@/contexts/ProjectContext"
import type { DeliveryNote, DeliveryNoteFile, DnFileKind } from "@/lib/types"

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
    mutationFn: async (note: Pick<DeliveryNote, "id">) => {
      // Collect stored paths first — file rows cascade away with the note.
      const { data: files } = await supabase
        .from("delivery_note_files")
        .select("storage_path")
        .eq("delivery_note_id", note.id)
      const { error } = await supabase.from("delivery_notes").delete().eq("id", note.id)
      if (error) throw error
      const paths = (files ?? []).map((f) => f.storage_path as string)
      if (paths.length) await supabase.storage.from("documents").remove(paths)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...DN_KEY, currentProjectId] })
      qc.invalidateQueries({ queryKey: FILES_KEY })
    },
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

const FILES_KEY = ["delivery_note_files"]

/** Every uploaded file for the current project's notes, newest first. */
export function useDeliveryNoteFiles() {
  const { currentProjectId } = useProject()
  return useQuery<DeliveryNoteFile[]>({
    queryKey: [...FILES_KEY, currentProjectId],
    enabled: !!currentProjectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_note_files")
        .select("*, delivery_notes!inner(project_id)")
        .eq("delivery_notes.project_id", currentProjectId)
        .order("uploaded_at", { ascending: false })
      if (error) throw error
      return (data ?? []).map(({ delivery_notes: _n, ...f }) => f) as DeliveryNoteFile[]
    },
  })
}

async function uploadOne(noteId: string, file: File, kind: DnFileKind) {
  const safe = file.name.replace(/[^\w.-]+/g, "_")
  const path = `delivery-notes/${noteId}/${Date.now()}_${safe}`
  const up = await supabase.storage.from("documents").upload(path, file, { upsert: false })
  if (up.error) throw up.error
  const { error } = await supabase.from("delivery_note_files").insert({
    delivery_note_id: noteId,
    storage_path: path,
    file_name: file.name,
    file_size: file.size,
    kind,
  })
  if (error) {
    await supabase.storage.from("documents").remove([path])
    throw error
  }
}

/** Upload one or more files to a note, all marked signed or unsigned. */
export function useUploadDnFiles() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { noteId: string; files: File[]; kind: DnFileKind }) => {
      for (const f of args.files) await uploadOne(args.noteId, f, args.kind)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: FILES_KEY }),
  })
}

export function useSetDnFileKind() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: string; kind: DnFileKind }) => {
      const { error } = await supabase.from("delivery_note_files").update({ kind: args.kind }).eq("id", args.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: FILES_KEY }),
  })
}

export function useDeleteDnFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: DeliveryNoteFile) => {
      const { error } = await supabase.from("delivery_note_files").delete().eq("id", file.id)
      if (error) throw error
      await supabase.storage.from("documents").remove([file.storage_path])
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: FILES_KEY }),
  })
}

export interface ManualDnInput {
  dn_number?: string
  dn_date: string
  deliver_to?: string | null
  location?: string | null
  po?: string | null
  notes?: string | null
  files: File[]
  kind: DnFileKind
}

/** A note made outside the app: create the record, then attach what was uploaded. */
export function useCreateManualDn() {
  const qc = useQueryClient()
  const { currentProjectId } = useProject()
  return useMutation({
    mutationFn: async (input: ManualDnInput) => {
      if (!currentProjectId) throw new Error("No project selected")
      const { data: seq, error: seqErr } = await supabase.rpc("next_dn_seq", { p_project: currentProjectId })
      if (seqErr) throw seqErr
      const { data: user } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from("delivery_notes")
        .insert({
          project_id: currentProjectId,
          seq,
          dn_number: input.dn_number?.trim() || String(seq),
          dn_date: input.dn_date,
          deliver_to: input.deliver_to || null,
          location: input.location || null,
          po: input.po || null,
          notes: input.notes || null,
          items: [],
          generated_by: user.user?.id ?? null,
        })
        .select()
        .single()
      if (error) throw error
      const note = data as DeliveryNote
      try {
        for (const f of input.files) await uploadOne(note.id, f, input.kind)
      } catch (e) {
        // Don't leave an empty shell behind if nothing could be attached.
        const { count } = await supabase
          .from("delivery_note_files")
          .select("id", { count: "exact", head: true })
          .eq("delivery_note_id", note.id)
        if (!count) await supabase.from("delivery_notes").delete().eq("id", note.id)
        throw e
      }
      return note
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...DN_KEY, currentProjectId] })
      qc.invalidateQueries({ queryKey: FILES_KEY })
    },
  })
}
