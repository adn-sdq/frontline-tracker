import { useEffect } from "react"
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { supabase } from "@/lib/supabase"
import type { ItemFile } from "@/lib/types"

export function useItemFiles(itemId: string | null) {
  return useQuery<ItemFile[]>({
    queryKey: ["item_files", itemId],
    enabled: !!itemId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("item_files")
        .select("*")
        .eq("item_id", itemId)
        .order("uploaded_at", { ascending: false })
      if (error) throw error
      return (data ?? []) as ItemFile[]
    },
  })
}

export function useItemFilesRealtime(itemId: string | null) {
  const qc = useQueryClient()
  useEffect(() => {
    if (!itemId) return
    const ch = supabase
      .channel(`item_files:${itemId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "item_files", filter: `item_id=eq.${itemId}` },
        () => qc.invalidateQueries({ queryKey: ["item_files", itemId] })
      )
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [qc, itemId])
}

export function useUploadItemFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      itemId: string
      file: File
      note?: string
      dated?: string
    }) => {
      const safe = args.file.name.replace(/[^\w.\-]+/g, "_")
      const path = `item-files/${args.itemId}/${Date.now()}_${safe}`
      const up = await supabase.storage
        .from("documents")
        .upload(path, args.file, { upsert: false })
      if (up.error) throw up.error
      const { error } = await supabase.from("item_files").insert({
        item_id: args.itemId,
        storage_path: path,
        file_name: args.file.name,
        file_size: args.file.size,
        note: args.note || null,
        dated: args.dated || undefined,
      })
      if (error) throw error
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["item_files", vars.itemId] }),
  })
}

export function useDeleteItemFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: string; itemId: string; storagePath: string }) => {
      await supabase.storage.from("documents").remove([args.storagePath])
      const { error } = await supabase.from("item_files").delete().eq("id", args.id)
      if (error) throw error
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["item_files", vars.itemId] }),
  })
}

export async function getItemFileSignedUrl(path: string) {
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
}
