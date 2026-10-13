import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { Session, User } from "@supabase/supabase-js"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import { supabase, usernameToEmail } from "@/lib/supabase"
import { pageAccessFor } from "@/lib/access"
import type { AccessRole, AppPage, PageAccess, Profile } from "@/lib/types"

interface AuthContextValue {
  session: Session | null
  user: User | null
  /** Effective profile: super-admin mode and role capabilities applied. */
  profile: Profile | null
  /** The custom access role assigned to the current user, if any. */
  accessRole: AccessRole | null
  pageAccess: (page: AppPage) => PageAccess
  canEdit: (page: AppPage) => boolean
  /** Present only for the super admin. */
  superAdmin: { elevated: boolean; setElevated: (on: boolean) => Promise<void> } | null
  loading: boolean
  signIn: (username: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refetchProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const queryClient = useQueryClient()
  const [rawProfile, setProfile] = useState<Profile | null>(null)
  const [accessRole, setAccessRole] = useState<AccessRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      // No session — done loading. With a session, wait for the profile
      // fetch below to clear loading so routes render with full context.
      if (!data.session) setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      if (!next) setLoading(false)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const uid = session?.user.id
    if (!uid) {
      setProfile(null)
      return
    }
    let active = true
    supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle()
      .then(({ data }) => {
        if (active) {
          setProfile((data as Profile) ?? null)
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [session?.user.id])

  // Load the assigned access role whenever it changes.
  const roleId = rawProfile?.access_role_id ?? null
  useEffect(() => {
    if (!roleId) {
      setAccessRole(null)
      return
    }
    let active = true
    supabase
      .from("access_roles")
      .select("*")
      .eq("id", roleId)
      .maybeSingle()
      .then(({ data }) => active && setAccessRole((data as AccessRole) ?? null))
    return () => {
      active = false
    }
  }, [roleId, rawProfile?.updated_at])

  // Super admin: admin rights follow their own elevate/lower switch rather
  // than whatever role others assigned; capabilities merge in from the role.
  const profile = useMemo<Profile | null>(() => {
    if (!rawProfile) return null
    const p = { ...rawProfile }
    if (p.is_super_admin) {
      const elevated = p.super_elevated !== false
      p.is_admin = elevated
      p.role = elevated ? "admin" : p.role === "admin" ? "member" : p.role
    }
    p.is_tech_manager = p.is_tech_manager || !!accessRole?.is_tech_manager
    p.is_sla_manager = p.is_sla_manager || !!accessRole?.is_sla_manager
    return p
  }, [rawProfile, accessRole])

  // Suspended accounts are also banned at the auth layer; this ends any
  // session that was already open when the suspension happened.
  useEffect(() => {
    if (profile?.status !== "suspended") return
    toast.error("Your account has been suspended", {
      description: profile.status_reason ?? "Contact an administrator.",
    })
    void supabase.auth.signOut()
  }, [profile?.status, profile?.status_reason])

  // "Last active" heartbeat — at most every 5 minutes while the tab is open.
  useEffect(() => {
    if (!profile?.id || profile.status === "suspended") return
    const beat = () => {
      if (document.visibilityState === "visible") void supabase.rpc("touch_last_seen")
    }
    beat()
    const t = window.setInterval(beat, 5 * 60_000)
    return () => window.clearInterval(t)
  }, [profile?.id, profile?.status])

  async function refetchProfile() {
    const uid = session?.user.id
    if (!uid) return
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle()
    if (data) setProfile(data as Profile)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      accessRole,
      pageAccess: (page) => pageAccessFor(profile, accessRole, page),
      canEdit: (page) => pageAccessFor(profile, accessRole, page) === "edit",
      superAdmin: rawProfile?.is_super_admin
        ? {
            elevated: rawProfile.super_elevated !== false,
            setElevated: async (on) => {
              const { error } = await supabase.rpc("set_super_mode", { p_elevated: on })
              if (error) throw error
              await refetchProfile()
              // Everything cached was fetched under the previous privileges.
              await queryClient.resetQueries()
            },
          }
        : null,
      loading,
      refetchProfile,
      signIn: async (username, password) => {
        const { error } = await supabase.auth.signInWithPassword({
          email: usernameToEmail(username),
          password,
        })
        if (error) throw error
      },
      signOut: async () => {
        await supabase.auth.signOut()
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, profile, rawProfile, accessRole, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
