import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { supabase } from "@/lib/supabase"
import { SYSTEM_LABELS, type SystemRow } from "@/lib/types"

const KEY = ["systems"]
const PS_KEY = ["project_systems"]

// All global systems (optionally filtered to a project's assigned set).
// Pass projectId to get only the systems that project has enabled.
export function useSystems(projectId?: string | null) {
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

  const projectKeysQuery = useQuery<string[]>({
    queryKey: [...PS_KEY, projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_systems")
        .select("system_key")
        .eq("project_id", projectId!)
      if (error) throw error
      return (data ?? []).map((r: { system_key: string }) => r.system_key)
    },
    staleTime: 30_000,
  })

  const all = query.data ?? []
  const projectKeys = projectKeysQuery.data

  // When projectId is supplied and keys have loaded, filter to that project's systems.
  // Otherwise fall back to all active systems (pre-login, no project, or loading).
  const active =
    projectId && projectKeys !== undefined
      ? all.filter((s) => s.active && projectKeys.includes(s.key))
      : all.filter((s) => s.active)

  const labelFor = (key: string | null | undefined) => {
    if (!key) return "—"
    return all.find((s) => s.key === key)?.label ?? SYSTEM_LABELS[key] ?? key
  }

  return { ...query, systems: all, activeSystems: active, labelFor }
}

// Fetch the system keys assigned to a specific project (admin use).
export function useProjectSystemKeys(projectId: string | null) {
  return useQuery<string[]>({
    queryKey: [...PS_KEY, projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_systems")
        .select("system_key")
        .eq("project_id", projectId!)
      if (error) throw error
      return (data ?? []).map((r: { system_key: string }) => r.system_key)
    },
  })
}

// All project→system mappings — for the admin project list.
export function useAllProjectSystems() {
  return useQuery<{ project_id: string; system_key: string }[]>({
    queryKey: [...PS_KEY, "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_systems")
        .select("project_id, system_key")
      if (error) throw error
      return data ?? []
    },
  })
}

// Replace the full set of systems for a project in one call.
export function useSetProjectSystems() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, keys }: { projectId: string; keys: string[] }) => {
      const { error: delErr } = await supabase
        .from("project_systems")
        .delete()
        .eq("project_id", projectId)
      if (delErr) throw delErr
      if (keys.length > 0) {
        const { error: insErr } = await supabase
          .from("project_systems")
          .insert(keys.map((key) => ({ project_id: projectId, system_key: key })))
        if (insErr) throw insErr
      }
    },
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: [...PS_KEY, projectId] })
      qc.invalidateQueries({ queryKey: [...PS_KEY, "all"] })
    },
  })
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
