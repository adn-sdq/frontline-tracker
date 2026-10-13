import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Readable message from anything thrown. Supabase's PostgrestError and storage
 * errors carry `message` but PostgrestError isn't an `Error` instance, so a plain
 * `instanceof Error` check shows "Unknown error" and hides the real cause.
 */
export function errorMessage(e: unknown, fallback = "Unknown error"): string {
  if (e instanceof Error && e.message) return e.message
  if (e && typeof e === "object") {
    const o = e as { message?: unknown; details?: unknown; hint?: unknown; error_description?: unknown }
    const parts = [o.message ?? o.error_description, o.details, o.hint].filter((x): x is string => typeof x === "string" && !!x)
    if (parts.length) return parts.join(" — ")
  }
  return typeof e === "string" && e ? e : fallback
}
