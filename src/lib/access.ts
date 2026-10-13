import type { AccessRole, AppPage, PageAccess, Profile } from "@/lib/types"

/**
 * Effective access to a page. Mirrors `public.page_access()` in the database
 * (migration 0021), which is what actually enforces it — keep them in sync.
 */
export function pageAccessFor(
  p: Profile | null,
  role: AccessRole | null | undefined,
  page: AppPage
): PageAccess {
  if (!p) return "none"
  if (p.is_admin) return "edit"
  if (p.status === "suspended") return "none"
  if (p.org === "firstfix") return page === "documents" ? "edit" : "none"
  if (role) return role.permissions[page] ?? "none"
  if (p.allowed_pages && !p.allowed_pages.includes(page)) return "none"
  if (p.role === "guest") return "view"
  return "edit"
}

export function roleFor(p: Profile, roles: AccessRole[] | undefined) {
  return p.access_role_id ? roles?.find((r) => r.id === p.access_role_id) : undefined
}
