import { useEffect } from "react"
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { supabase } from "@/lib/supabase"
import type {
  DocStatus,
  DocumentComment,
  DocumentFile,
  DocumentRow,
} from "@/lib/types"

const DOCS_KEY = ["documents"]

export function useDocuments() {
  return useQuery<DocumentRow[]>({
    queryKey: DOCS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("updated_at", { ascending: false })
      if (error) throw error
      return (data ?? []) as DocumentRow[]
    },
  })
}

export function useDocumentsRealtime() {
  const qc = useQueryClient()
  useEffect(() => {
    const ch = supabase
      .channel("documents-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "documents" },
        () => qc.invalidateQueries({ queryKey: DOCS_KEY })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "document_files" },
        (payload) => {
          const docId = (payload.new as { document_id?: string } | null)?.document_id
            ?? (payload.old as { document_id?: string } | null)?.document_id
          if (docId) qc.invalidateQueries({ queryKey: ["document_files", docId] })
          qc.invalidateQueries({ queryKey: ["document_file_counts"] })
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [qc])
}

export function useCreateDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (doc: Partial<DocumentRow>) => {
      const { data, error } = await supabase
        .from("documents")
        .insert(doc)
        .select()
        .single()
      if (error) throw error
      return data as DocumentRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: DOCS_KEY }),
  })
}

export function useUpdateDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: string; patch: Partial<DocumentRow> }) => {
      const { error } = await supabase
        .from("documents")
        .update(args.patch)
        .eq("id", args.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: DOCS_KEY }),
  })
}

export function useSetDocStatus() {
  const update = useUpdateDocument()
  return (id: string, status: DocStatus) =>
    update.mutateAsync({ id, patch: { status } })
}

export function useDeleteDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("documents").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: DOCS_KEY }),
  })
}

export function useDocumentFiles(documentId: string | null) {
  return useQuery<DocumentFile[]>({
    queryKey: ["document_files", documentId],
    enabled: !!documentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_files")
        .select("*")
        .eq("document_id", documentId)
        .order("uploaded_at", { ascending: false })
      if (error) throw error
      return (data ?? []) as DocumentFile[]
    },
  })
}

// Counts of files per document, for list badges.
export function useFileCounts() {
  return useQuery<Record<string, number>>({
    queryKey: ["document_file_counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_files")
        .select("document_id")
      if (error) throw error
      const counts: Record<string, number> = {}
      for (const row of (data ?? []) as { document_id: string }[]) {
        counts[row.document_id] = (counts[row.document_id] ?? 0) + 1
      }
      return counts
    },
  })
}

export function useUploadDocumentFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      documentId: string
      file: File
      revLabel?: string
      note?: string
      dated?: string
    }) => {
      const safe = args.file.name.replace(/[^\w.\-]+/g, "_")
      const path = `${args.documentId}/${Date.now()}_${safe}`
      const up = await supabase.storage
        .from("documents")
        .upload(path, args.file, { upsert: false })
      if (up.error) throw up.error
      const { error } = await supabase.from("document_files").insert({
        document_id: args.documentId,
        storage_path: path,
        file_name: args.file.name,
        file_size: args.file.size,
        rev_label: args.revLabel || null,
        note: args.note || null,
        dated: args.dated || undefined,
      })
      if (error) throw error
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["document_files", vars.documentId] })
      qc.invalidateQueries({ queryKey: ["document_file_counts"] })
    },
  })
}

export function useUpdateFileDate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: string; documentId: string; dated: string }) => {
      const { error } = await supabase
        .from("document_files")
        .update({ dated: args.dated })
        .eq("id", args.id)
      if (error) throw error
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["document_files", vars.documentId] }),
  })
}

export async function getSignedUrl(path: string) {
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
}

export function useDocumentComments(documentId: string | null) {
  return useQuery<DocumentComment[]>({
    queryKey: ["document_comments", documentId],
    enabled: !!documentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_comments")
        .select("*")
        .eq("document_id", documentId)
        .order("created_at", { ascending: true })
      if (error) throw error
      return (data ?? []) as DocumentComment[]
    },
  })
}

export function useAddComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      documentId: string
      body: string
      code?: string | null
    }) => {
      const { error } = await supabase.from("document_comments").insert({
        document_id: args.documentId,
        body: args.body,
        code: args.code ?? null,
      })
      if (error) throw error
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["document_comments", vars.documentId] }),
  })
}
