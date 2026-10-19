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

// Accounts are work emails (see src/lib/email.ts); sign-in accepts the username part.
export { signInEmail as usernameToEmail } from "@/lib/email"

export const supabase = createClient(url ?? "", anonKey ?? "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "frontline-tracker-auth",
  },
})

export const hasSupabaseConfig = Boolean(url && anonKey)
