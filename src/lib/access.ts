import type { AccessRole, AppPage, PageAccess, Profile } from "@/lib/types"

/**
 * Effective access to a page. The access role is the only source of access —
 * mirrors `public.page_access()` (migration 0023), which enforces it.
 */
export function pageAccessFor(
  p: Profile | null,
  role: AccessRole | null | undefined,
  page: AppPage
): PageAccess {
  if (!p) return "none"
  if (p.is_admin) return "edit"
  if (p.status === "suspended") return "none"
  return role?.permissions[page] ?? "none"
}

export function roleFor(p: Profile, roles: AccessRole[] | undefined) {
  return p.access_role_id ? roles?.find((r) => r.id === p.access_role_id) : undefined
}

/** Built-in roles first, then by sort order and name. */
export function sortRoles(roles: AccessRole[]) {
  return [...roles].sort((a, b) => Number(b.is_system) - Number(a.is_system) || a.sort - b.sort || a.name.localeCompare(b.name))
}
