import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { supabase } from "@/lib/supabase"
import { SYSTEM_LABELS, type SystemRow } from "@/lib/types"

const KEY = ["systems"]

export function useSystems() {
  const query = useQuery<SystemRow[]>({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("systems")
        .select("*")
        .order("sort", { ascending: true })
      if (error) throw error
      return (data ?? []) as SystemRow[]
    },
    staleTime: 60_000,
  })

  const all = query.data ?? []
  const active = all.filter((s) => s.active)
  const labelFor = (key: string | null | undefined) => {
    if (!key) return "—"
    return all.find((s) => s.key === key)?.label ?? SYSTEM_LABELS[key] ?? key
  }

  return { ...query, systems: all, activeSystems: active, labelFor }
}

export function useUpsertSystem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (row: Partial<SystemRow> & { key: string; label: string; sort: number }) => {
      const { error } = await supabase.from("systems").upsert(row)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useToggleSystem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ key, active }: { key: string; active: boolean }) => {
      const { error } = await supabase.from("systems").update({ active }).eq("key", key)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
