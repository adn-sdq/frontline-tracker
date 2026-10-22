import { Lock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageAccessBadge } from "@/components/admin/PageAccessBadge"
import { displayName, withToast } from "@/components/profile/shared"
import { useAccessRoles, useAllProfiles, useUpdateProfile } from "@/hooks/useAdmin"
import {
  useAllProjectMembers,
  useAllProjects,
  useAssignProject,
  useUnassignProject,
} from "@/hooks/useProjects"
import { roleFor, sortRoles } from "@/lib/access"
import { ORG_LABELS, APP_PAGE_LABELS, APP_PAGES, type Profile } from "@/lib/types"

const STICKY = "sticky left-0 z-10 bg-background"

/**
 * The single place access is granted: pick each person's role. Their page
 * levels come entirely from that role (edit roles in the Roles tab).
 */
export function AdminAccessTab() {
  const { data: profiles = [], isLoading } = useAllProfiles()
  const { data: rawRoles = [] } = useAccessRoles()
  const { data: projects = [] } = useAllProjects()
  const { data: memberships = [] } = useAllProjectMembers()
  const update = useUpdateProfile()
  const assign = useAssignProject()
  const unassign = useUnassignProject()
  const roles = sortRoles(rawRoles)

  // The super admin's access is self-managed, so their row is never listed.
  const people = profiles
    .filter((p) => !p.is_super_admin)
    .sort((a, b) => displayName(a).localeCompare(displayName(b)))
  const isMember = (uid: string, pid: string) => memberships.some((m) => m.user_id === uid && m.project_id === pid)

  function setRole(p: Profile, roleId: string) {
    const r = roles.find((x) => x.id === roleId)
    void withToast(() => update.mutateAsync({ id: p.id, patch: { access_role_id: roleId } }), `${displayName(p)} is now ${r?.name}`)
  }

  function toggleProject(p: Profile, projectId: string) {
    const args = { projectId, userId: p.id }
    const on = isMember(p.id, projectId)
    void withToast(
      () => (on ? unassign.mutateAsync(args) : assign.mutateAsync(args)),
      on ? `Removed ${displayName(p)} from project` : `Added ${displayName(p)} to project`
    )
  }

  if (isLoading) return <div className="flex justify-center py-10"><Spinner className="size-5" /></div>

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <div>
          <h2 className="text-sm font-semibold">Roles</h2>
          <p className="text-xs text-muted-foreground">
            Each person has one role, and it alone decides what they can view or edit. Changes save instantly.
          </p>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className={`${STICKY} bg-muted/40`}>Person</TableHead>
                <TableHead>Role</TableHead>
                {APP_PAGES.map((pg) => <TableHead key={pg} className="whitespace-nowrap">{APP_PAGE_LABELS[pg]}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {people.map((p) => {
                const role = roleFor(p, roles)
                const suspended = p.status === "suspended"
                const admin = role?.key === "admin"
                return (
                  <TableRow key={p.id} className={suspended ? "opacity-60" : undefined}>
                    <TableCell className={`${STICKY} whitespace-nowrap`}>
                      <div className="max-w-48 truncate font-medium">{displayName(p)}</div>
                      <div className="text-xs text-muted-foreground">
                        {[p.org ? ORG_LABELS[p.org] : null, p.job_title].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {suspended ? (
                        <Badge variant="outline" className="gap-1 font-normal"><Lock className="size-3" /> Suspended</Badge>
                      ) : (
                        <Select value={p.access_role_id ?? ""} onValueChange={(v) => setRole(p, v)}>
                          <SelectTrigger size="sm" className="h-7 w-44"><SelectValue placeholder="No access" /></SelectTrigger>
                          <SelectContent>
                            {roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    {APP_PAGES.map((pg) => (
                      <TableCell key={pg}>
                        <PageAccessBadge level={suspended ? "none" : admin ? "edit" : role?.permissions[pg] ?? "none"} />
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </section>

      {projects.length > 0 && (
        <section className="flex flex-col gap-2">
          <div>
            <h2 className="text-sm font-semibold">Project membership</h2>
            <p className="text-xs text-muted-foreground">
              Which projects' data a person sees. It doesn't grant page access — that comes from their role. Admins see every project.
            </p>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className={`${STICKY} bg-muted/40`}>Person</TableHead>
                  {projects.map((pr) => (
                    <TableHead key={pr.id} className="max-w-32 text-center">
                      <span className="block truncate" title={pr.name}>{pr.name}</span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {people
                  .filter((p) => p.status !== "suspended")
                  .map((p) => {
                    const admin = roleFor(p, roles)?.key === "admin"
                    return (
                      <TableRow key={p.id}>
                        <TableCell className={`${STICKY} font-medium whitespace-nowrap`}><span className="block max-w-48 truncate">{displayName(p)}</span></TableCell>
                        {projects.map((pr) => (
                          <TableCell key={pr.id} className="text-center">
                            <Checkbox
                              aria-label={`${displayName(p)} — ${pr.name}`}
                              checked={admin || isMember(p.id, pr.id)}
                              disabled={admin}
                              onCheckedChange={() => toggleProject(p, pr.id)}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          </div>
        </section>
      )}
    </div>
  )
}
