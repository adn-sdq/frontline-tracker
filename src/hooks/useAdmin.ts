import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { supabase } from "@/lib/supabase"
import type { Org, Profile } from "@/lib/types"

// ── Feature requests (admin-only) ─────────────────────────────────────────────

export interface FeatureRequest {
  id: string
  title: string
  description: string | null
  submitted_by: string | null
  submitted_at: string
  status: "pending" | "planned" | "in_progress" | "done" | "rejected"
  upvotes: number
  submitter_name?: string | null
}

const FR_KEY = ["feature_requests"]

export function useFeatureRequests() {
  return useQuery<FeatureRequest[]>({
    queryKey: FR_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_requests")
        .select("*, profiles(full_name, username)")
        .order("upvotes", { ascending: false })
        .order("submitted_at", { ascending: false })
      if (error) throw error
      return (data ?? []).map((r) => ({
        ...r,
        submitter_name:
          (r.profiles as { full_name?: string; username?: string } | null)?.full_name ??
          (r.profiles as { full_name?: string; username?: string } | null)?.username ??
          null,
        profiles: undefined,
      })) as FeatureRequest[]
    },
  })
}

export function useUpdateFeatureRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      id: string
      patch: Partial<Pick<FeatureRequest, "status" | "upvotes">>
    }) => {
      const { error } = await supabase
        .from("feature_requests")
        .update(args.patch)
        .eq("id", args.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: FR_KEY }),
  })
}

const PROFILES_KEY = ["profiles", "all"]

export function useAllProfiles() {
  return useQuery<Profile[]>({
    queryKey: PROFILES_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true })
      if (error) throw error
      return (data ?? []) as Profile[]
    },
  })
}

async function callAdmin(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("admin-users", {
    body,
  })
  // Edge function returns { error } in the body for handled failures.
  if (error) {
    // Try to surface the function's JSON error message.
    let msg = error.message
    const ctx = (error as { context?: Response }).context
    if (ctx && typeof ctx.json === "function") {
      try {
        const j = await ctx.json()
        if (j?.error) msg = j.error
      } catch {
        /* ignore */
      }
    }
    throw new Error(msg)
  }
  if (data?.error) throw new Error(data.error)
  return data
}

export function useCreateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: {
      username: string
      password: string
      full_name?: string
      org?: Org | null
      is_admin?: boolean
    }) => callAdmin({ action: "create", ...args }),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILES_KEY }),
  })
}

export function useSetPassword() {
  return useMutation({
    mutationFn: (args: { id: string; password: string }) =>
      callAdmin({ action: "set_password", ...args }),
  })
}

export function useDeleteAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => callAdmin({ action: "delete", id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILES_KEY }),
  })
}

// Org / admin-flag / allowed_pages changes go straight through RLS (admins may update profiles).
export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      id: string
      patch: Partial<Pick<Profile, "org" | "is_admin" | "full_name" | "allowed_pages">>
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update(args.patch)
        .eq("id", args.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILES_KEY }),
  })
}

// Username / full_name edits — goes through edge function because username also changes auth email.
export function useUpdateUserDetails() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; username?: string; full_name?: string }) =>
      callAdmin({ action: "update_profile", ...args }),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILES_KEY }),
  })
}
