import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { displayName, roleOf, withToast } from "@/components/profile/shared"
import { useAllProfiles, useUpdateProfile } from "@/hooks/useAdmin"
import {
  useAllProjectMembers,
  useAllProjects,
  useAssignProject,
  useUnassignProject,
} from "@/hooks/useProjects"
import { allowedPagesFor } from "@/lib/navigation"
import { APP_PAGE_LABELS, APP_PAGES, type AppPage, type Profile } from "@/lib/types"

const STICKY = "sticky left-0 z-10 bg-background"

/**
 * Bulk access management: who can open which page, who holds which manager
 * capability, and who belongs to which project — one grid each.
 * Admins (full access) and Firstfix users (Documents only) are listed below
 * the grids instead, since their access isn't configurable.
 */
export function AdminAccessTab() {
  const { data: profiles = [], isLoading } = useAllProfiles()
  const { data: projects = [] } = useAllProjects()
  const { data: memberships = [] } = useAllProjectMembers()
  const update = useUpdateProfile()
  const assign = useAssignProject()
  const unassign = useUnassignProject()

  const configurable = profiles.filter((p) => roleOf(p) !== "admin" && p.org !== "firstfix" && p.status !== "suspended")
  const fixed = profiles.filter((p) => !configurable.includes(p))
  const isMember = (uid: string, pid: string) => memberships.some((m) => m.user_id === uid && m.project_id === pid)

  function togglePage(p: Profile, page: AppPage) {
    const current = [...allowedPagesFor(p)] as AppPage[]
    const next = current.includes(page) ? current.filter((x) => x !== page) : [...current, page]
    void withToast(
      () => update.mutateAsync({ id: p.id, patch: { allowed_pages: next.length === APP_PAGES.length ? null : next } }),
      `${displayName(p)}: ${APP_PAGE_LABELS[page]} ${current.includes(page) ? "removed" : "granted"}`
    )
  }

  function toggleFlag(p: Profile, key: "is_tech_manager" | "is_sla_manager") {
    void withToast(() => update.mutateAsync({ id: p.id, patch: { [key]: !p[key] } }), "Capability updated")
  }

  function toggleProject(p: Profile, projectId: string) {
    const args = { projectId, userId: p.id }
    const on = isMember(p.id, projectId)
    void withToast(() => (on ? unassign.mutateAsync(args) : assign.mutateAsync(args)), on ? "Removed from project" : "Added to project")
  }

  if (isLoading) return <div className="flex justify-center py-10"><Spinner className="size-5" /></div>

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <div>
          <h2 className="text-sm font-semibold">Pages & capabilities</h2>
          <p className="text-xs text-muted-foreground">Changes save instantly. Granting every page stores “all”, so new pages are included automatically.</p>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className={`${STICKY} bg-muted/40`}>User</TableHead>
                {APP_PAGES.map((pg) => <TableHead key={pg} className="text-center whitespace-nowrap">{APP_PAGE_LABELS[pg]}</TableHead>)}
                <TableHead className="border-l text-center whitespace-nowrap">Tech mgr</TableHead>
                <TableHead className="text-center whitespace-nowrap">SLA mgr</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configurable.map((p) => {
                const allowed = allowedPagesFor(p)
                return (
                  <TableRow key={p.id}>
                    <TableCell className={`${STICKY} font-medium whitespace-nowrap`}>{displayName(p)}</TableCell>
                    {APP_PAGES.map((pg) => (
                      <TableCell key={pg} className="text-center">
                        <Checkbox aria-label={`${displayName(p)} — ${APP_PAGE_LABELS[pg]}`} checked={allowed.has(pg)} onCheckedChange={() => togglePage(p, pg)} />
                      </TableCell>
                    ))}
                    <TableCell className="border-l text-center">
                      <Checkbox aria-label="Technicians manager" checked={p.is_tech_manager} onCheckedChange={() => toggleFlag(p, "is_tech_manager")} />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox aria-label="SLA manager" checked={p.is_sla_manager} onCheckedChange={() => toggleFlag(p, "is_sla_manager")} />
                    </TableCell>
                  </TableRow>
                )
              })}
              {configurable.length === 0 && (
                <TableRow><TableCell colSpan={APP_PAGES.length + 3} className="h-16 text-center text-muted-foreground">No configurable members.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {projects.length > 0 && (
        <section className="flex flex-col gap-2">
          <div>
            <h2 className="text-sm font-semibold">Project membership</h2>
            <p className="text-xs text-muted-foreground">Members only see data for projects they belong to.</p>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className={`${STICKY} bg-muted/40`}>User</TableHead>
                  {projects.map((pr) => (
                    <TableHead key={pr.id} className="max-w-32 text-center">
                      <span className="block truncate" title={pr.name}>{pr.name}</span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles
                  .filter((p) => roleOf(p) !== "admin" && p.status !== "suspended")
                  .map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className={`${STICKY} font-medium whitespace-nowrap`}>{displayName(p)}</TableCell>
                      {projects.map((pr) => (
                        <TableCell key={pr.id} className="text-center">
                          <Checkbox
                            aria-label={`${displayName(p)} — ${pr.name}`}
                            checked={isMember(p.id, pr.id)}
                            onCheckedChange={() => toggleProject(p, pr.id)}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {fixed.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Not shown above: {fixed.map((p) => `${displayName(p)} (${roleOf(p) === "admin" ? "admin — full access" : p.status === "suspended" ? "suspended" : "Firstfix — Documents only"})`).join(", ")}.
        </p>
      )}
    </div>
  )
}
