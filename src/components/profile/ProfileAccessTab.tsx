import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageAccessBadge, PageAccessPicker } from "@/components/admin/PageAccessBadge"
import { useAccessRoles, useChangeRole, useUpdateProfile } from "@/hooks/useAdmin"
import {
  useAllProjectMembers,
  useAllProjects,
  useAssignProject,
  useUnassignProject,
} from "@/hooks/useProjects"
import { pageAccessFor, roleFor } from "@/lib/access"
import { cn } from "@/lib/utils"
import {
  APP_PAGE_LABELS,
  APP_PAGES,
  ORG_LABELS,
  ORGS,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLES,
  type AppPage,
  type Org,
  type PageAccess,
  type Profile,
  type Role,
} from "@/lib/types"
import { roleLabel, roleOf, SectionTitle, withToast, type ProfilePerms } from "./shared"

const CUSTOM = "__custom"

const CAPABILITIES = [
  { key: "is_tech_manager" as const, label: "Technicians manager", hint: "Runs the roster, answers technician requests and schedules people." },
  { key: "is_sla_manager" as const, label: "SLA manager", hint: "Creates and edits SLA contracts; deletes visits and issues." },
]

export function ProfileAccessTab({ profile, perms }: { profile: Profile; perms: ProfilePerms }) {
  const { data: roles = [] } = useAccessRoles()
  const { data: projects = [] } = useAllProjects()
  const { data: memberships = [] } = useAllProjectMembers()
  const accessRole = roleFor(profile, roles)
  const memberOf = new Set(memberships.filter((m) => m.user_id === profile.id).map((m) => m.project_id))
  const level = (pg: AppPage) => pageAccessFor(profile, accessRole, pg)

  if (!perms.editAccess) {
    // Read-only summary — no controls at all for non-admins.
    return (
      <div className="flex flex-col gap-5">
        <dl className="grid gap-x-6 gap-y-2.5 text-sm sm:grid-cols-[8.5rem_1fr]">
          <dt className="text-muted-foreground">Role</dt>
          <dd>{roleLabel(profile)}{accessRole && <span className="text-muted-foreground"> · {accessRole.name}</span>}</dd>
          <dt className="text-muted-foreground">Organisation</dt>
          <dd>{profile.org ? ORG_LABELS[profile.org] : "—"}</dd>
          <dt className="text-muted-foreground">Capabilities</dt>
          <dd>
            {[
              (profile.is_tech_manager || accessRole?.is_tech_manager) && "Technicians manager",
              (profile.is_sla_manager || accessRole?.is_sla_manager) && "SLA manager",
            ].filter(Boolean).join(", ") || "—"}
          </dd>
        </dl>
        <div>
          <SectionTitle>Page access</SectionTitle>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
            {APP_PAGES.map((pg) => (
              <div key={pg} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground">{APP_PAGE_LABELS[pg]}</span>
                <PageAccessBadge level={level(pg)} />
              </div>
            ))}
          </div>
        </div>
        <div>
          <SectionTitle>Projects</SectionTitle>
          {roleOf(profile) === "admin" ? (
            <p className="text-sm text-muted-foreground">All projects.</p>
          ) : memberOf.size === 0 ? (
            <p className="text-sm text-muted-foreground">No projects assigned.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {projects.filter((p) => memberOf.has(p.id)).map((pr) => <Badge key={pr.id} variant="outline">{pr.name}</Badge>)}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Only administrators can change access.</p>
      </div>
    )
  }

  return <AccessEditor profile={profile} />
}

function AccessEditor({ profile }: { profile: Profile }) {
  const update = useUpdateProfile()
  const changeRole = useChangeRole()
  const assign = useAssignProject()
  const unassign = useUnassignProject()
  const { data: roles = [] } = useAccessRoles()
  const { data: projects = [] } = useAllProjects()
  const { data: memberships = [] } = useAllProjectMembers()

  const role = roleOf(profile)
  const isAdminUser = role === "admin"
  const isFirstfix = profile.org === "firstfix"
  const accessRole = roleFor(profile, roles)
  const memberOf = new Set(memberships.filter((m) => m.user_id === profile.id).map((m) => m.project_id))

  /** Individual (no role) setting: full access level per page. */
  function setPage(page: AppPage, lvl: PageAccess) {
    // Individual settings support None / Edit per page; View-only needs a role
    // or the Guest base role.
    const current = APP_PAGES.filter((pg) => pageAccessFor(profile, null, pg) !== "none")
    const next = lvl === "none" ? current.filter((p) => p !== page) : [...new Set([...current, page])]
    void withToast(
      () => update.mutateAsync({ id: profile.id, patch: { allowed_pages: next.length === APP_PAGES.length ? null : next } }),
      "Page access updated"
    )
  }

  function toggleProject(projectId: string) {
    const args = { projectId, userId: profile.id }
    void withToast(
      () => (memberOf.has(projectId) ? unassign.mutateAsync(args) : assign.mutateAsync(args)),
      memberOf.has(projectId) ? "Removed from project" : "Added to project"
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <SectionTitle>Base role</SectionTitle>
          <Select
            value={role}
            onValueChange={(v) =>
              void withToast(() => changeRole.mutateAsync({ id: profile.id, role: v as Role }), `Role changed to ${ROLE_LABELS[v as Role]}`)
            }
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className="mt-1.5 text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
        </div>
        <div>
          <SectionTitle>Organisation</SectionTitle>
          <Select
            value={profile.org ?? ""}
            onValueChange={(v) => void withToast(() => update.mutateAsync({ id: profile.id, patch: { org: v as Org } }), "Organisation updated")}
          >
            <SelectTrigger className="w-full"><SelectValue placeholder="Select org" /></SelectTrigger>
            <SelectContent>
              {ORGS.map((o) => <SelectItem key={o} value={o}>{ORG_LABELS[o]}</SelectItem>)}
            </SelectContent>
          </Select>
          {isFirstfix && <p className="mt-1.5 text-xs text-muted-foreground">Firstfix users only ever see Documents.</p>}
        </div>
      </div>

      {!isAdminUser && !isFirstfix && (
        <>
          <Separator />
          <div>
            <SectionTitle>Access role</SectionTitle>
            <Select
              value={profile.access_role_id ?? CUSTOM}
              onValueChange={(v) =>
                void withToast(
                  () => update.mutateAsync({ id: profile.id, patch: { access_role_id: v === CUSTOM ? null : v } }),
                  v === CUSTOM ? "Switched to individual access" : `Assigned ${roles.find((r) => r.id === v)?.name}`
                )
              }
            >
              <SelectTrigger className="w-full sm:w-72"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={CUSTOM}>Individual (set per page below)</SelectItem>
                {roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {roles.length === 0 && (
              <p className="mt-1.5 text-xs text-muted-foreground">Create reusable roles in Admin Console → Roles.</p>
            )}
          </div>
        </>
      )}

      <Separator />

      <div>
        <SectionTitle>Page access</SectionTitle>
        {isAdminUser || isFirstfix ? (
          <p className="text-sm text-muted-foreground">
            {isAdminUser ? "Admins can open and edit every page." : "Fixed to Documents for Firstfix users."}
          </p>
        ) : accessRole ? (
          <>
            <p className="mb-2 text-xs text-muted-foreground">Managed by the “{accessRole.name}” role.</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
              {APP_PAGES.map((pg) => (
                <div key={pg} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">{APP_PAGE_LABELS[pg]}</span>
                  <PageAccessBadge level={accessRole.permissions[pg] ?? "none"} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="divide-y rounded-lg border">
            {APP_PAGES.map((pg) => {
              const lvl = pageAccessFor(profile, null, pg)
              return (
                <div key={pg} className="flex items-center justify-between gap-3 px-3 py-1.5">
                  <span className="text-sm">{APP_PAGE_LABELS[pg]}</span>
                  {role === "guest" ? (
                    <div className="flex items-center gap-2">
                      <PageAccessBadge level={lvl} />
                      <Checkbox checked={lvl !== "none"} onCheckedChange={(v) => setPage(pg, v ? "view" : "none")} aria-label={APP_PAGE_LABELS[pg]} />
                    </div>
                  ) : (
                    <PageAccessPicker
                      value={lvl}
                      onChange={(v) => {
                        if (v === "view") {
                          toast.info("Assign an access role to give view-only access per page, or set the base role to Guest.")
                          return
                        }
                        setPage(pg, v)
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Separator />

      <div>
        <SectionTitle>Capabilities</SectionTitle>
        <div className="flex flex-col gap-2">
          {CAPABILITIES.map((c) => {
            const fromRole = !!accessRole?.[c.key]
            return (
              <label key={c.key} className={cn("flex items-start gap-2.5 rounded-md border p-2.5", !isAdminUser && !fromRole && "cursor-pointer hover:bg-accent/40")}>
                <Checkbox
                  className="mt-0.5"
                  checked={isAdminUser || fromRole || profile[c.key]}
                  disabled={isAdminUser || fromRole}
                  onCheckedChange={(v) =>
                    void withToast(() => update.mutateAsync({ id: profile.id, patch: { [c.key]: !!v } }), v ? `Granted ${c.label}` : `Removed ${c.label}`)
                  }
                />
                <span>
                  <span className="block text-sm font-medium">{c.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {isAdminUser ? "Included with the Admin role." : fromRole ? `Included with the “${accessRole?.name}” role.` : c.hint}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </div>

      <Separator />

      <div>
        <SectionTitle>Projects</SectionTitle>
        {isAdminUser ? (
          <p className="text-sm text-muted-foreground">Admins can access every project.</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No projects exist yet.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {projects.map((pr) => (
              <label key={pr.id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent/40">
                <Checkbox checked={memberOf.has(pr.id)} onCheckedChange={() => toggleProject(pr.id)} />
                <span className="flex-1 truncate">{pr.name}</span>
                {!pr.active && <Badge variant="outline" className="text-[10px]">Archived</Badge>}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
