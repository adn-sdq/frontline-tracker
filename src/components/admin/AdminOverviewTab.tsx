import { useState } from "react"
import { differenceInDays } from "date-fns"
import { AlertCircle, FolderOpen, ShieldCheck, UserX, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { StatTile } from "@/components/ui/stat-tile"
import { ProfileDialog } from "@/components/ProfileDialog"
import { displayName, roleOf } from "@/components/profile/shared"
import { useAllProfiles } from "@/hooks/useAdmin"
import { useAllProjectMembers, useAllProjects } from "@/hooks/useProjects"
import type { Profile } from "@/lib/types"

const STALE_DAYS = 30

function AttentionGroup({
  title,
  hint,
  people,
  onOpen,
}: {
  title: string
  hint: string
  people: Profile[]
  onOpen: (p: Profile) => void
}) {
  if (people.length === 0) return null
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-2 flex items-center gap-2">
        <AlertCircle className="size-4 text-amber-600" />
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">({people.length})</span>
      </div>
      <p className="mb-2 text-xs text-muted-foreground">{hint}</p>
      <div className="flex flex-wrap gap-1.5">
        {people.map((p) => (
          <Button key={p.id} variant="outline" size="sm" className="h-7 text-xs" onClick={() => onOpen(p)}>
            {displayName(p)}
          </Button>
        ))}
      </div>
    </div>
  )
}

export function AdminOverviewTab({ onTab }: { onTab: (tab: string) => void }) {
  const { data: profiles = [] } = useAllProfiles()
  const { data: projects = [] } = useAllProjects()
  const { data: memberships = [] } = useAllProjectMembers()
  const [open, setOpen] = useState<{ p: Profile; tab: "access" | "security" } | null>(null)

  const active = profiles.filter((p) => p.status !== "suspended")
  const suspended = profiles.filter((p) => p.status === "suspended")
  const admins = active.filter((p) => roleOf(p) === "admin")
  const activeProjects = projects.filter((p) => p.active)
  const hasProject = new Set(memberships.map((m) => m.user_id))
  const staffed = new Set(memberships.map((m) => m.project_id))

  const noProjects = active.filter((p) => roleOf(p) !== "admin" && !hasProject.has(p.id))
  const stale = active.filter(
    (p) => !p.last_seen_at || differenceInDays(new Date(), new Date(p.last_seen_at)) > STALE_DAYS
  )
  const emptyProjects = activeProjects.filter((p) => !staffed.has(p.id))
  const recentlyActive = active.filter(
    (p) => p.last_seen_at && differenceInDays(new Date(), new Date(p.last_seen_at)) <= 7
  ).length

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatTile label="Active accounts" value={active.length} icon={Users} hint={`${recentlyActive} active this week`} onClick={() => onTab("users")} />
        <StatTile label="Admins" value={admins.length} icon={ShieldCheck} onClick={() => onTab("users")} />
        <StatTile label="Suspended" value={suspended.length} icon={UserX} tone={suspended.length ? "warning" : "default"} onClick={() => onTab("users")} />
        <StatTile label="Active projects" value={activeProjects.length} icon={FolderOpen} hint={`${projects.length - activeProjects.length} archived`} onClick={() => onTab("projects")} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Needs attention</h2>
        {noProjects.length + stale.length + emptyProjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing to follow up on.</p>
        ) : (
          <>
            <AttentionGroup
              title="Members without a project"
              hint="They can sign in but won't see any project data."
              people={noProjects}
              onOpen={(p) => setOpen({ p, tab: "access" })}
            />
            <AttentionGroup
              title={`Inactive for ${STALE_DAYS}+ days`}
              hint="Consider suspending accounts that are no longer needed."
              people={stale}
              onOpen={(p) => setOpen({ p, tab: "security" })}
            />
            {emptyProjects.length > 0 && (
              <div className="rounded-lg border bg-card p-3">
                <div className="mb-2 flex items-center gap-2">
                  <AlertCircle className="size-4 text-amber-600" />
                  <span className="text-sm font-medium">Projects with no members</span>
                  <span className="text-xs text-muted-foreground">({emptyProjects.length})</span>
                </div>
                <p className="mb-2 text-xs text-muted-foreground">Only admins can see these.</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {emptyProjects.map((p) => <span key={p.id} className="rounded-sm bg-muted px-2 py-0.5 text-xs">{p.name}</span>)}
                  <Button variant="link" size="sm" className="h-7 text-xs" onClick={() => onTab("access")}>Assign people →</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ProfileDialog profile={open?.p ?? null} open={!!open} defaultTab={open?.tab} onClose={() => setOpen(null)} />
    </div>
  )
}
