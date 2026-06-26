import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { Session, User } from "@supabase/supabase-js"

import { supabase, usernameToEmail } from "@/lib/supabase"
import type { Profile } from "@/lib/types"

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (username: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
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

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
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
    [session, profile, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
