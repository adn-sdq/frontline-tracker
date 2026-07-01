import { useEffect } from "react"
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { supabase } from "@/lib/supabase"
import type { Project, ProjectMember } from "@/lib/types"

const PROJECTS_KEY = ["projects"]

// Projects the signed-in user can access (RLS returns all for admins,
// assigned-only for members).
//
// userId is included in the query key so the cache is scoped per user —
// this prevents a pre-login empty result from polluting the post-login fetch.
export function useProjects(userId?: string | null) {
  return useQuery<Project[]>({
    queryKey: [...PROJECTS_KEY, userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("active", true)
        .order("sort", { ascending: true })
        .order("created_at", { ascending: true })
      if (error) throw error
      return (data ?? []) as Project[]
    },
  })
}

// All projects incl. inactive — for the Admin panel.
export function useAllProjects() {
  return useQuery<Project[]>({
    queryKey: ["projects", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("sort", { ascending: true })
        .order("created_at", { ascending: true })
      if (error) throw error
      return (data ?? []) as Project[]
    },
  })
}

export function useProjectsRealtime() {
  const qc = useQueryClient()
  useEffect(() => {
    const ch = supabase
      .channel("projects-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => qc.invalidateQueries({ queryKey: PROJECTS_KEY })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "project_members" },
        () => {
          qc.invalidateQueries({ queryKey: PROJECTS_KEY })
          qc.invalidateQueries({ queryKey: ["project_members"] })
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [qc])
}

export type ProjectInput = {
  name: string
  description?: string | null
  sort?: number
  client_name?: string | null
  client_po?: string | null
  our_po?: string | null
  site_location?: string | null
  site_contact?: string | null
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: ProjectInput) => {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          name: p.name,
          description: p.description ?? null,
          sort: p.sort ?? 0,
          client_name: p.client_name ?? null,
          client_po: p.client_po ?? null,
          our_po: p.our_po ?? null,
          site_location: p.site_location ?? null,
          site_contact: p.site_contact ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data as Project
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: string; patch: Partial<Project> }) => {
      const { error } = await supabase
        .from("projects")
        .update(args.patch)
        .eq("id", args.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  })
}

// All membership rows — admin only (RLS).
export function useAllProjectMembers() {
  return useQuery<ProjectMember[]>({
    queryKey: ["project_members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("project_members").select("*")
      if (error) throw error
      return (data ?? []) as ProjectMember[]
    },
  })
}

export function useAssignProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { projectId: string; userId: string }) => {
      const { error } = await supabase
        .from("project_members")
        .insert({ project_id: args.projectId, user_id: args.userId })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project_members"] })
      qc.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}

export function useUnassignProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { projectId: string; userId: string }) => {
      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("project_id", args.projectId)
        .eq("user_id", args.userId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project_members"] })
      qc.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}
