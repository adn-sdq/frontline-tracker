import { Check, Lock } from "lucide-react"

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
import { useChangeRole, useUpdateProfile } from "@/hooks/useAdmin"
import {
  useAllProjectMembers,
  useAllProjects,
  useAssignProject,
  useUnassignProject,
} from "@/hooks/useProjects"
import { allowedPagesFor } from "@/lib/navigation"
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
  type Profile,
  type Role,
} from "@/lib/types"
import { roleOf, SectionTitle, withToast, type ProfilePerms } from "./shared"

const CAPABILITIES = [
  {
    key: "is_tech_manager" as const,
    label: "Technicians manager",
    hint: "Runs the roster, answers technician requests and schedules people.",
  },
  {
    key: "is_sla_manager" as const,
    label: "SLA manager",
    hint: "Creates and edits SLA contracts; deletes visits and issues.",
  },
]

export function ProfileAccessTab({ profile, perms }: { profile: Profile; perms: ProfilePerms }) {
  const update = useUpdateProfile()
  const changeRole = useChangeRole()
  const assign = useAssignProject()
  const unassign = useUnassignProject()
  const { data: projects = [] } = useAllProjects()
  const { data: memberships = [] } = useAllProjectMembers()

  const role = roleOf(profile)
  const isAdminUser = role === "admin"
  const isFirstfix = profile.org === "firstfix"
  const effectivePages = allowedPagesFor(profile)
  const memberOf = new Set(memberships.filter((m) => m.user_id === profile.id).map((m) => m.project_id))
  const can = perms.editAccess

  function togglePage(page: AppPage) {
    const current = (profile.allowed_pages as AppPage[] | null) ?? [...APP_PAGES]
    const next = current.includes(page) ? current.filter((p) => p !== page) : [...current, page]
    // Everything selected is stored as null = "all pages, including future ones".
    const patch = next.length === APP_PAGES.length ? null : next
    void withToast(() => update.mutateAsync({ id: profile.id, patch: { allowed_pages: patch } }), "Page access updated")
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
      {!can && (
        <p className="flex items-center gap-1.5 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <Lock className="size-3.5" />
          {perms.isSelf && perms.viewerAdmin ? "You can't change your own access." : "Only administrators can change access."}
        </p>
      )}

      {/* Role + team */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <SectionTitle>Role</SectionTitle>
          <Select
            value={role}
            disabled={!can}
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
            disabled={!can}
            onValueChange={(v) =>
              void withToast(() => update.mutateAsync({ id: profile.id, patch: { org: v as Org } }), "Organisation updated")
            }
          >
            <SelectTrigger className="w-full"><SelectValue placeholder="Select org" /></SelectTrigger>
            <SelectContent>
              {ORGS.map((o) => <SelectItem key={o} value={o}>{ORG_LABELS[o]}</SelectItem>)}
            </SelectContent>
          </Select>
          {isFirstfix && <p className="mt-1.5 text-xs text-muted-foreground">Firstfix users only ever see Documents.</p>}
        </div>
      </div>

      <Separator />

      {/* Capabilities */}
      <div>
        <SectionTitle>Capabilities</SectionTitle>
        <div className="flex flex-col gap-2">
          {CAPABILITIES.map((c) => (
            <label key={c.key} className={cn("flex items-start gap-2.5 rounded-md border p-2.5", can && !isAdminUser && "cursor-pointer hover:bg-accent/40")}>
              <Checkbox
                className="mt-0.5"
                checked={isAdminUser || profile[c.key]}
                disabled={!can || isAdminUser}
                onCheckedChange={(v) =>
                  void withToast(
                    () => update.mutateAsync({ id: profile.id, patch: { [c.key]: !!v } }),
                    v ? `Granted ${c.label}` : `Removed ${c.label}`
                  )
                }
              />
              <span>
                <span className="block text-sm font-medium">{c.label}</span>
                <span className="block text-xs text-muted-foreground">
                  {isAdminUser ? "Included with the Admin role." : c.hint}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Pages */}
      <div>
        <SectionTitle>Page access</SectionTitle>
        {isAdminUser || isFirstfix ? (
          <p className="text-sm text-muted-foreground">
            {isAdminUser ? "Admins can open every page." : "Fixed to Documents for Firstfix users."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {APP_PAGES.map((pg) => {
              const on = effectivePages.has(pg)
              return (
                <button
                  key={pg}
                  type="button"
                  disabled={!can}
                  onClick={() => togglePage(pg)}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-sm transition-colors disabled:cursor-default",
                    on ? "border-primary/50 bg-primary/5" : "text-muted-foreground",
                    can && "hover:bg-accent/50"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-4 shrink-0 place-items-center rounded-sm border",
                      on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                    )}
                  >
                    {on && <Check className="size-3" />}
                  </span>
                  {APP_PAGE_LABELS[pg]}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <Separator />

      {/* Projects */}
      <div>
        <SectionTitle>Projects</SectionTitle>
        {isAdminUser ? (
          <p className="text-sm text-muted-foreground">Admins can access every project.</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No projects exist yet.</p>
        ) : can ? (
          <div className="flex flex-col gap-1">
            {projects.map((pr) => (
              <label key={pr.id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent/40">
                <Checkbox checked={memberOf.has(pr.id)} onCheckedChange={() => toggleProject(pr.id)} />
                <span className="flex-1 truncate">{pr.name}</span>
                {!pr.active && <Badge variant="outline" className="text-[10px]">Archived</Badge>}
              </label>
            ))}
          </div>
        ) : memberOf.size === 0 ? (
          <p className="text-sm text-muted-foreground">No projects assigned.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {projects.filter((p) => memberOf.has(p.id)).map((pr) => <Badge key={pr.id} variant="outline">{pr.name}</Badge>)}
          </div>
        )}
      </div>
    </div>
  )
}
