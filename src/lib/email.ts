/**
 * Every account is a work email. The part before "@" is the username.
 *
 * Only these domains are allowed today. When external users or clients need
 * accounts later, add their domains here (and in the admin-users edge
 * function) — nothing else hard-codes the domain.
 */
export const ALLOWED_EMAIL_DOMAINS = ["frontline.sa"] as const
export const PRIMARY_EMAIL_DOMAIN = ALLOWED_EMAIL_DOMAINS[0]

const LOCAL_PART = /^[a-z0-9._-]+$/

/** Parse what an admin typed ("khalid" or "khalid@frontline.sa") into a username + email. */
export function parseWorkEmail(input: string): { username: string; email: string } | { error: string } {
  const raw = input.trim().toLowerCase()
  if (!raw) return { error: "Email is required" }
  const [local, domain = PRIMARY_EMAIL_DOMAIN, ...rest] = raw.split("@")
  if (rest.length) return { error: "That isn't a valid email" }
  if (!(ALLOWED_EMAIL_DOMAINS as readonly string[]).includes(domain))
    return { error: `Only @${ALLOWED_EMAIL_DOMAINS.join(", @")} emails are allowed` }
  if (!LOCAL_PART.test(local)) return { error: "Use letters, numbers, dot, dash or underscore before the @" }
  return { username: local, email: `${local}@${domain}` }
}

/** Sign-in accepts a username or a full email. */
export function signInEmail(input: string): string {
  const raw = input.trim().toLowerCase()
  return raw.includes("@") ? raw : `${raw}@${PRIMARY_EMAIL_DOMAIN}`
}
