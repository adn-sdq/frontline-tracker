import { createClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !anonKey) {
  // Surfaced clearly in the console/UI rather than failing with a cryptic error.
  console.error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. " +
      "Set them in .env (local) or repo secrets (deploy)."
  )
}

// Usernames are mapped to a synthetic email so users sign in with just a name.
export const EMAIL_DOMAIN = "ilmi.local"
export const usernameToEmail = (username: string) =>
  `${username.trim().toLowerCase()}@${EMAIL_DOMAIN}`

export const supabase = createClient(url ?? "", anonKey ?? "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "frontline-tracker-auth",
  },
})

export const hasSupabaseConfig = Boolean(url && anonKey)
