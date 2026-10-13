import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { supabase } from "@/lib/supabase"
import type { AccountStatus, Org, Profile, ProfileHistoryRow, Role } from "@/lib/types"

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
        .select("id, title, description, submitted_by, submitted_at, status, upvotes")
        .order("upvotes", { ascending: false })
        .order("submitted_at", { ascending: false })
      if (error) throw error
      return (data ?? []) as FeatureRequest[]
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

export function useUpvoteFeatureRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("upvote_feature_request", { request_id: id })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: FR_KEY }),
  })
}

export function useDeleteFeatureRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("feature_requests")
        .delete()
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: FR_KEY }),
  })
}

const PROFILES_KEY = ["profiles", "all"]

// Prefix match refreshes both the admin list and the id→profile map, plus audit.
function invalidateProfiles(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["profiles"] })
  qc.invalidateQueries({ queryKey: ["profile_history"] })
}

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
      role?: Role
      job_title?: string
      department?: string
      phone?: string
      contact_email?: string
      allowed_pages?: string[] | null
    }) => callAdmin({ action: "create", ...args }) as Promise<{ ok: boolean; id: string }>,
    onSuccess: () => invalidateProfiles(qc),
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
    onSuccess: () => invalidateProfiles(qc),
  })
}

/** Profile columns writable through RLS. The DB guard strips privileged ones for non-admins. */
export type ProfilePatch = Partial<
  Omit<Profile, "id" | "username" | "created_at" | "updated_at" | "last_seen_at" | "status" | "status_reason">
>

// Details, org, access flags, avatar go straight through RLS (admins may update any profile).
export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: string; patch: ProfilePatch }) => {
      const { error } = await supabase
        .from("profiles")
        .update(args.patch)
        .eq("id", args.id)
      if (error) throw error
    },
    onSuccess: () => invalidateProfiles(qc),
  })
}

export function useUploadAvatar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, file }: { userId: string; file: File }) => {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
      const path = `${userId}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from("avatars").getPublicUrl(path)
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", userId)
      if (updateError) throw updateError
      return data.publicUrl
    },
    onSuccess: () => invalidateProfiles(qc),
  })
}

/** Clear a profile photo and delete the stored image. */
export function useRemoveAvatar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, avatarUrl }: { userId: string; avatarUrl: string | null }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", userId)
      if (error) throw error
      const path = avatarUrl?.split("/avatars/").pop()?.split("?")[0]
      if (path) await supabase.storage.from("avatars").remove([path])
    },
    onSuccess: () => invalidateProfiles(qc),
  })
}

export function useChangeRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: Role }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ role, is_admin: role === "admin" })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => invalidateProfiles(qc),
  })
}

/** Suspend (auth-level ban) or reactivate an account. Admin only. */
export function useSetAccountStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; status: AccountStatus; reason?: string }) =>
      callAdmin({ action: "set_status", ...args }),
    onSuccess: () => invalidateProfiles(qc),
  })
}

export function useProfileHistory(profileId: string | null) {
  return useQuery<ProfileHistoryRow[]>({
    queryKey: ["profile_history", profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_history")
        .select("*")
        .eq("profile_id", profileId)
        .order("changed_at", { ascending: false })
        .limit(100)
      if (error) throw error
      return (data ?? []) as ProfileHistoryRow[]
    },
  })
}

// Username / full_name edits — goes through edge function because username also changes auth email.
export function useUpdateUserDetails() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; username?: string; full_name?: string }) =>
      callAdmin({ action: "update_profile", ...args }),
    onSuccess: () => invalidateProfiles(qc),
  })
}
