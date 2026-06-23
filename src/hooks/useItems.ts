import { useEffect } from "react"
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { supabase } from "@/lib/supabase"
import type { Item, ItemHistory, ItemPatch, Profile } from "@/lib/types"

const ITEMS_KEY = ["items"]

export function useItems() {
  return useQuery<Item[]>({
    queryKey: ITEMS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .order("system", { ascending: true })
        .order("sno", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true })
      if (error) throw error
      return (data ?? []) as Item[]
    },
  })
}

export function useProfiles() {
  return useQuery<Record<string, Profile>>({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*")
      if (error) throw error
      const map: Record<string, Profile> = {}
      for (const p of (data ?? []) as Profile[]) map[p.id] = p
      return map
    },
  })
}

// Live updates: any insert/update/delete to items refreshes the cache so the
// whole team sees changes without reloading.
export function useItemsRealtime() {
  const qc = useQueryClient()
  useEffect(() => {
    const channel = supabase
      .channel("items-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items" },
        () => {
          qc.invalidateQueries({ queryKey: ITEMS_KEY })
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [qc])
}

export class ConflictError extends Error {
  constructor(message = "This row was changed by someone else.") {
    super(message)
    this.name = "ConflictError"
  }
}

export function useUpdateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      id: string
      version: number
      patch: ItemPatch
    }) => {
      const { data, error } = await supabase.rpc("update_item", {
        p_id: args.id,
        p_expected_version: args.version,
        p_patch: args.patch,
      })
      if (error) {
        if (error.message?.includes("conflict") || error.code === "P0001") {
          throw new ConflictError()
        }
        throw error
      }
      return data as Item
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ITEMS_KEY })
    },
  })
}

export function useCreateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (item: Partial<Item>) => {
      const { data, error } = await supabase
        .from("items")
        .insert(item)
        .select()
        .single()
      if (error) throw error
      return data as Item
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ITEMS_KEY }),
  })
}

export function useDeleteItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("items").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ITEMS_KEY }),
  })
}

export function useBulkInsert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (rows: Partial<Item>[]) => {
      const { error } = await supabase.from("items").insert(rows)
      if (error) throw error
      return rows.length
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ITEMS_KEY }),
  })
}

export function useItemHistory(itemId: string | null) {
  return useQuery<ItemHistory[]>({
    queryKey: ["item_history", itemId],
    enabled: !!itemId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("item_history")
        .select("*")
        .eq("item_id", itemId)
        .order("changed_at", { ascending: false })
      if (error) throw error
      return (data ?? []) as ItemHistory[]
    },
  })
}
