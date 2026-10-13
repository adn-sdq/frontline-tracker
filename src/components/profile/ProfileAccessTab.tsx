import { ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { PageAccessBadge } from "@/components/admin/PageAccessBadge"
import { useAccessRoles } from "@/hooks/useAdmin"
import { useAllProjectMembers, useAllProjects } from "@/hooks/useProjects"
import { pageAccessFor, roleFor } from "@/lib/access"
import { APP_PAGE_LABELS, APP_PAGES, type Profile } from "@/lib/types"
import { SectionTitle, type ProfilePerms } from "./shared"

/**
 * Read-only view of a person's role and what it lets them do. Roles are only
 * assigned by admins in Admin Console → Access.
 */
export function ProfileAccessTab({ profile, perms }: { profile: Profile; perms: ProfilePerms }) {
  const { data: roles = [] } = useAccessRoles()
  const { data: projects = [] } = useAllProjects()
  const { data: memberships = [] } = useAllProjectMembers()
  const role = roleFor(profile, roles)
  const isAdmin = role?.key === "admin"
  const memberOf = new Set(memberships.filter((m) => m.user_id === profile.id).map((m) => m.project_id))

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="text-sm font-semibold">{role?.name ?? "No access"}</p>
          {role?.description && <p className="text-xs text-muted-foreground">{role.description}</p>}
          {profile.status === "suspended" && <p className="mt-1 text-xs text-destructive">Account suspended — no access.</p>}
        </div>
      </div>

      <div>
        <SectionTitle>Access levels</SectionTitle>
        <div className="divide-y rounded-lg border">
          {APP_PAGES.map((pg) => (
            <div key={pg} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span>{APP_PAGE_LABELS[pg]}</span>
              <PageAccessBadge level={pageAccessFor({ ...profile, is_admin: isAdmin }, role, pg)} />
            </div>
          ))}
          {isAdmin && (
            <div className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span>Admin Console</span>
              <PageAccessBadge level="edit" />
            </div>
          )}
        </div>
      </div>

      <div>
        <SectionTitle>Projects</SectionTitle>
        {isAdmin ? (
          <p className="text-sm text-muted-foreground">All projects.</p>
        ) : memberOf.size === 0 ? (
          <p className="text-sm text-muted-foreground">No projects assigned.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {projects.filter((p) => memberOf.has(p.id)).map((pr) => <Badge key={pr.id} variant="outline">{pr.name}</Badge>)}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {perms.viewerAdmin ? "Change roles and projects in Admin Console → Access." : "Only administrators can change roles."}
      </p>
    </div>
  )
}
