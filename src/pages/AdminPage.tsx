import { useEffect, useState } from "react"
import {
  ChevronUp,
  FolderOpen,
  Inbox,
  KeyRound,
  Lightbulb,
  Loader2,
  Pencil,
  Plus,
  Shield,
  Trash2,
  UserPlus,
} from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/contexts/AuthContext"
import {
  useAllProfiles,
  useCreateAccount,
  useDeleteAccount,
  useFeatureRequests,
  useSetPassword,
  useUpdateFeatureRequest,
  useUpdateProfile,
  useUpdateUserDetails,
  type FeatureRequest,
} from "@/hooks/useAdmin"
import {
  useAllProjectMembers,
  useAllProjects,
  useAssignProject,
  useCreateProject,
  useUnassignProject,
  useUpdateProject,
  type ProjectInput,
} from "@/hooks/useProjects"
import { useSystems, useToggleSystem, useUpsertSystem } from "@/hooks/useSystems"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { APP_PAGES, APP_PAGE_LABELS, ORGS, ORG_LABELS, type AppPage, type Org, type Profile } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PageHeader } from "@/components/PageHeader"

const STATUS_LABELS: Record<FeatureRequest["status"], string> = {
  pending: "Pending",
  planned: "Planned",
  in_progress: "In Progress",
  done: "Done",
  rejected: "Rejected",
}

const STATUS_STYLES: Record<FeatureRequest["status"], string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  planned: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  done: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  rejected: "bg-muted text-muted-foreground",
}

function FeatureInbox() {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<"all" | FeatureRequest["status"]>("all")
  const { data: requests = [], isLoading } = useFeatureRequests()
  const update = useUpdateFeatureRequest()

  const visible =
    filter === "all" ? requests : requests.filter((r) => r.status === filter)

  const pendingCount = requests.filter((r) => r.status === "pending").length

  function upvote(r: FeatureRequest) {
    update.mutate({ id: r.id, patch: { upvotes: r.upvotes + 1 } })
  }

  function setStatus(r: FeatureRequest, status: FeatureRequest["status"]) {
    update.mutate(
      { id: r.id, patch: { status } },
      { onSuccess: () => toast.success("Status updated") },
    )
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative size-8 text-muted-foreground/40 hover:text-muted-foreground"
            onClick={() => setOpen(true)}
          >
            <Lightbulb className="size-4" />
            {pendingCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Feature inbox
        </TooltipContent>
      </Tooltip>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col overflow-hidden p-0 sm:max-w-104"
        >
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="size-4 text-primary" />
              Feature Inbox
              {requests.length > 0 && (
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  {requests.length} total
                </span>
              )}
            </SheetTitle>
          </SheetHeader>

          {/* Filter pills */}
          <div className="flex gap-1.5 overflow-x-auto border-b px-4 py-2.5 scrollbar-none">
            {(["all", "pending", "planned", "in_progress", "done", "rejected"] as const).map(
              (s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilter(s)}
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-xs transition-colors",
                    filter === s
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {s === "all" ? "All" : STATUS_LABELS[s]}
                </button>
              ),
            )}
          </div>

          {/* List */}
          <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : visible.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-muted">
                  <Inbox className="size-5 text-muted-foreground" />
                </div>
                <p className="font-display text-lg">All clear</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  No requests here yet.
                </p>
              </div>
            ) : (
              visible.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border bg-card p-3 transition-shadow hover:shadow-sm"
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug">{r.title}</p>
                      {r.description && (
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {r.description}
                        </p>
                      )}
                    </div>
                    {/* Upvote */}
                    <button
                      type="button"
                      onClick={() => upvote(r)}
                      className="flex shrink-0 flex-col items-center gap-0 rounded-lg px-1.5 py-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      <ChevronUp className="size-3.5" />
                      <span className="text-[10px] font-bold tabular-nums">
                        {r.upvotes}
                      </span>
                    </button>
                  </div>

                  {/* Footer */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Select
                      value={r.status}
                      onValueChange={(v) =>
                        setStatus(r, v as FeatureRequest["status"])
                      }
                    >
                      <SelectTrigger
                        className={cn(
                          "h-5 w-auto gap-1 rounded-full border-0 px-2 py-0 text-[10px] font-semibold shadow-none ring-0 focus:ring-0",
                          STATUS_STYLES[r.status],
                        )}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([val, label]) => (
                          <SelectItem key={val} value={val} className="text-xs">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="ml-auto text-[10px] text-muted-foreground/60">
                      {r.submitter_name ?? "Anonymous"} ·{" "}
                      {new Date(r.submitted_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

export default function AdminPage() {
  const { profile } = useAuth()

  if (!profile?.is_admin) {
    return (
      <div className="rounded-xl border bg-card py-16 text-center">
        <Shield className="mx-auto mb-3 size-8 text-muted-foreground" />
        <p className="font-medium">Admins only</p>
        <p className="text-sm text-muted-foreground">
          Ask an admin to grant you access.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Control"
        title="Admin"
        subtitle="Manage team accounts, projects and the system list."
      >
        <FeatureInbox />
      </PageHeader>
      <ProjectsSection />
      <AccountsSection />
      <SystemsSection />
    </div>
  )
}

// ---------------------------------------------------------------------------
function AccountsSection() {
  const { user } = useAuth()
  const { data: profiles = [], isLoading } = useAllProfiles()
  const { data: projects = [] } = useAllProjects()
  const { data: memberships = [] } = useAllProjectMembers()
  const assign = useAssignProject()
  const unassign = useUnassignProject()
  const updateProfile = useUpdateProfile()
  const setPassword = useSetPassword()
  const deleteAccount = useDeleteAccount()

  const [createOpen, setCreateOpen] = useState(false)
  const [pwUser, setPwUser] = useState<Profile | null>(null)
  const [delUser, setDelUser] = useState<Profile | null>(null)
  const [editUser, setEditUser] = useState<Profile | null>(null)

  async function toggleProjectMember(p: Profile, projectId: string) {
    const assigned = memberships.some(
      (m) => m.user_id === p.id && m.project_id === projectId
    )
    try {
      if (assigned) await unassign.mutateAsync({ projectId, userId: p.id })
      else await assign.mutateAsync({ projectId, userId: p.id })
      toast.success(assigned ? "Removed from project" : "Added to project")
    } catch (e) {
      toast.error("Could not update projects", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    }
  }

  async function changeOrg(p: Profile, org: string) {
    try {
      await updateProfile.mutateAsync({ id: p.id, patch: { org: org as Org } })
      toast.success("Organisation updated")
    } catch (e) {
      toast.error("Could not update", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    }
  }

  async function changeAdmin(p: Profile, value: string) {
    try {
      await updateProfile.mutateAsync({
        id: p.id,
        patch: { is_admin: value === "admin" },
      })
      toast.success(value === "admin" ? "Promoted to admin" : "Set to member")
    } catch (e) {
      toast.error("Could not update", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    }
  }

  async function togglePage(p: Profile, page: AppPage) {
    // Admins and firstfix users aren't restricted by allowed_pages.
    const current: AppPage[] = (p.allowed_pages as AppPage[] | null) ?? [...APP_PAGES]
    const next = current.includes(page)
      ? current.filter((pg) => pg !== page)
      : [...current, page]
    // null means "all" — normalise back to null if all pages enabled
    const patch = next.length === APP_PAGES.length ? null : next
    try {
      await updateProfile.mutateAsync({ id: p.id, patch: { allowed_pages: patch } })
      toast.success("Page access updated")
    } catch (e) {
      toast.error("Could not update", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Accounts</CardTitle>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <UserPlus className="size-4" /> Add account
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
          {/* ── Mobile cards (< md) ──────────────────────────────── */}
          <div className="flex flex-col gap-2 md:hidden">
            {profiles.map((p) => {
              const mine = projects.filter((pr) =>
                memberships.some((m) => m.user_id === p.id && m.project_id === pr.id)
              )
              return (
                <div key={p.id} className="rounded-lg border p-3 space-y-2.5">
                  {/* Name + actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium">{p.full_name ?? "—"}</span>
                        {p.id === user?.id && <Badge variant="secondary" className="text-xs">You</Badge>}
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">{p.username}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => setEditUser(p)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => setPwUser(p)}>
                        <KeyRound className="size-3.5" />
                      </Button>
                      {p.id !== user?.id && (
                        <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => setDelUser(p)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Team + Role */}
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={p.org ?? ""} onValueChange={(v) => changeOrg(p, v)}>
                      <SelectTrigger size="sm" className="h-8 w-full"><SelectValue placeholder="Team" /></SelectTrigger>
                      <SelectContent>
                        {ORGS.map((o) => <SelectItem key={o} value={o}>{ORG_LABELS[o]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={p.is_admin ? "admin" : "member"} onValueChange={(v) => changeAdmin(p, v)} disabled={p.id === user?.id}>
                      <SelectTrigger size="sm" className="h-8 w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pages + Projects */}
                  <div className="flex gap-2">
                    {p.org === "firstfix" || p.is_admin ? (
                      <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-1 rounded flex-1 text-center">
                        Pages: {p.is_admin ? "All" : "Docs only"}
                      </span>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 text-xs flex-1 truncate">
                            Pages: {!p.allowed_pages || p.allowed_pages.length === 0 ? "All" : p.allowed_pages.map((pg) => APP_PAGE_LABELS[pg as AppPage] ?? pg).join(", ")}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="p-2">
                          <p className="mb-2 px-1 text-xs text-muted-foreground">Toggle page access</p>
                          {APP_PAGES.map((pg) => {
                            const enabled = !p.allowed_pages || p.allowed_pages.includes(pg)
                            return (
                              <button key={pg} type="button" className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent" onClick={() => togglePage(p, pg)}>
                                <span className={`size-3.5 rounded-sm border flex items-center justify-center shrink-0 ${enabled ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"}`}>
                                  {enabled && <span className="text-[10px] leading-none">✓</span>}
                                </span>
                                {APP_PAGE_LABELS[pg]}
                              </button>
                            )
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    {p.is_admin ? (
                      <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-1 rounded flex-1 text-center">Projects: All</span>
                    ) : projects.length === 0 ? (
                      <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-1 rounded flex-1 text-center">Projects: —</span>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 text-xs flex-1 truncate">
                            {mine.length === 0 ? "No projects" : mine.map((pr) => pr.name).join(", ")}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="p-2">
                          <p className="mb-2 px-1 text-xs text-muted-foreground">Assign projects</p>
                          {projects.map((pr) => {
                            const on = memberships.some((m) => m.user_id === p.id && m.project_id === pr.id)
                            return (
                              <button key={pr.id} type="button" className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent" onClick={() => toggleProjectMember(p, pr.id)}>
                                <span className={`size-3.5 rounded-sm border flex items-center justify-center shrink-0 ${on ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"}`}>
                                  {on && <span className="text-[10px] leading-none">✓</span>}
                                </span>
                                <span className="truncate">{pr.name}</span>
                              </button>
                            )
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Desktop table (≥ md) ─────────────────────────────── */}
          <div className="hidden md:block rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Pages</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.full_name ?? "—"}
                      {p.id === user?.id && (
                        <Badge variant="secondary" className="ml-2">
                          You
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.username}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={p.org ?? ""}
                        onValueChange={(v) => changeOrg(p, v)}
                      >
                        <SelectTrigger size="sm" className="h-7 w-32">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          {ORGS.map((o) => (
                            <SelectItem key={o} value={o}>
                              {ORG_LABELS[o]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={p.is_admin ? "admin" : "member"}
                        onValueChange={(v) => changeAdmin(p, v)}
                        disabled={p.id === user?.id}
                      >
                        <SelectTrigger size="sm" className="h-7 w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {/* Pages are fixed for firstfix and admins */}
                      {p.org === "firstfix" || p.is_admin ? (
                        <span className="text-xs text-muted-foreground">
                          {p.is_admin ? "All" : "Documents only"}
                        </span>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-xs">
                              {!p.allowed_pages || p.allowed_pages.length === 0
                                ? "All"
                                : p.allowed_pages.map((pg) => APP_PAGE_LABELS[pg as AppPage] ?? pg).join(", ")}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="p-2">
                            <p className="mb-2 px-1 text-xs text-muted-foreground">Toggle page access</p>
                            {APP_PAGES.map((pg) => {
                              const enabled = !p.allowed_pages || p.allowed_pages.includes(pg)
                              return (
                                <button
                                  key={pg}
                                  type="button"
                                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
                                  onClick={() => togglePage(p, pg)}
                                >
                                  <span className={`size-3.5 rounded-sm border flex items-center justify-center shrink-0 ${enabled ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"}`}>
                                    {enabled && <span className="text-[10px] leading-none">✓</span>}
                                  </span>
                                  {APP_PAGE_LABELS[pg]}
                                </button>
                              )
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.is_admin ? (
                        <span className="text-xs text-muted-foreground">All</span>
                      ) : projects.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        (() => {
                          const mine = projects.filter((pr) =>
                            memberships.some(
                              (m) => m.user_id === p.id && m.project_id === pr.id
                            )
                          )
                          return (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-7 max-w-45 text-xs">
                                  <span className="truncate">
                                    {mine.length === 0
                                      ? "None"
                                      : mine.map((pr) => pr.name).join(", ")}
                                  </span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="p-2">
                                <p className="mb-2 px-1 text-xs text-muted-foreground">
                                  Assign projects
                                </p>
                                {projects.map((pr) => {
                                  const on = memberships.some(
                                    (m) => m.user_id === p.id && m.project_id === pr.id
                                  )
                                  return (
                                    <button
                                      key={pr.id}
                                      type="button"
                                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
                                      onClick={() => toggleProjectMember(p, pr.id)}
                                    >
                                      <span className={`size-3.5 rounded-sm border flex items-center justify-center shrink-0 ${on ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"}`}>
                                        {on && <span className="text-[10px] leading-none">✓</span>}
                                      </span>
                                      <span className="truncate">{pr.name}</span>
                                    </button>
                                  )
                                })}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )
                        })()
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7" onClick={() => setEditUser(p)}>
                              <Pencil className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit name / username</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7" onClick={() => setPwUser(p)}>
                              <KeyRound className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Reset password</TooltipContent>
                        </Tooltip>
                        {p.id !== user?.id && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => setDelUser(p)}>
                                <Trash2 className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete user</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          </>
        )}
      </CardContent>

      <CreateAccountDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditProfileDialog user={editUser} onClose={() => setEditUser(null)} />
      <ResetPasswordDialog
        user={pwUser}
        onClose={() => setPwUser(null)}
        setPassword={(id, password) => setPassword.mutateAsync({ id, password })}
        busy={setPassword.isPending}
      />
      <DeleteAccountDialog
        user={delUser}
        onClose={() => setDelUser(null)}
        onConfirm={async () => {
          if (!delUser) return
          try {
            await deleteAccount.mutateAsync(delUser.id)
            toast.success("Account deleted")
          } catch (e) {
            toast.error("Could not delete", {
              description: e instanceof Error ? e.message : "Unknown error",
            })
          } finally {
            setDelUser(null)
          }
        }}
        busy={deleteAccount.isPending}
      />
    </Card>
  )
}

function EditProfileDialog({
  user,
  onClose,
}: {
  user: Profile | null
  onClose: () => void
}) {
  const update = useUpdateUserDetails()
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")

  // Sync fields when user changes
  useEffect(() => {
    if (user) {
      setFullName(user.full_name ?? "")
      setUsername(user.username ?? "")
    }
  }, [user])

  async function submit() {
    if (!user) return
    if (!username.trim()) {
      toast.error("Username cannot be empty")
      return
    }
    try {
      await update.mutateAsync({
        id: user.id,
        full_name: fullName.trim() || undefined,
        username: username.trim() !== user.username ? username.trim() : undefined,
      })
      toast.success("Profile updated")
      onClose()
    } catch (e) {
      toast.error("Could not update", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    }
  }

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Change the display name or login username for {user?.full_name ?? user?.username}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Full name</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="First Last"
              autoFocus
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              autoCapitalize="none"
            />
            <p className="text-xs text-muted-foreground">
              Changing the username also changes their login credentials.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={update.isPending}>Cancel</Button>
          <Button onClick={submit} disabled={update.isPending || !username.trim()}>
            {update.isPending && <Loader2 className="size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CreateAccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const create = useCreateAccount()
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [password, setPassword] = useState("")
  const [org, setOrg] = useState<Org>("frontline")
  const [isAdmin, setIsAdmin] = useState("member")

  async function submit() {
    if (!username.trim() || !password.trim()) {
      toast.error("Username and password are required")
      return
    }
    try {
      await create.mutateAsync({
        username: username.trim(),
        password: password.trim(),
        full_name: fullName.trim() || username.trim(),
        org,
        is_admin: isAdmin === "admin",
      })
      toast.success(`Account "${username.trim()}" created`)
      setUsername("")
      setFullName("")
      setPassword("")
      setOrg("frontline")
      setIsAdmin("member")
      onOpenChange(false)
    } catch (e) {
      toast.error("Could not create account", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add account</DialogTitle>
          <DialogDescription>
            They sign in with this username + password (no email needed).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. khalid"
              autoCapitalize="none"
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Full name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Password</Label>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="at least 6 characters"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Team</Label>
              <Select value={org} onValueChange={(v) => setOrg(v as Org)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORGS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {ORG_LABELS[o]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Role</Label>
              <Select value={isAdmin} onValueChange={setIsAdmin}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending && <Loader2 className="size-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ResetPasswordDialog({
  user,
  onClose,
  setPassword,
  busy,
}: {
  user: Profile | null
  onClose: () => void
  setPassword: (id: string, password: string) => Promise<unknown>
  busy: boolean
}) {
  const [pw, setPw] = useState("")
  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            Set a new password for {user?.full_name ?? user?.username}.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="New password"
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={busy || pw.length < 6 || !user}
            onClick={async () => {
              if (!user) return
              try {
                await setPassword(user.id, pw)
                toast.success("Password updated")
                setPw("")
                onClose()
              } catch (e) {
                toast.error("Could not update password", {
                  description: e instanceof Error ? e.message : "Unknown error",
                })
              }
            }}
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteAccountDialog({
  user,
  onClose,
  onConfirm,
  busy,
}: {
  user: Profile | null
  onClose: () => void
  onConfirm: () => void
  busy: boolean
}) {
  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete account?</DialogTitle>
          <DialogDescription>
            {user?.full_name ?? user?.username} will no longer be able to sign in.
            Their past changes stay recorded.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
function blankProjectInput(): ProjectInput {
  return {
    name: "", description: "",
    client_name: "", client_po: "", our_po: "", site_location: "", site_contact: "",
  }
}

function ProjectDialog({
  open,
  onClose,
  initial,
  onSave,
  busy,
}: {
  open: boolean
  onClose: () => void
  initial: ProjectInput
  onSave: (v: ProjectInput) => void
  busy: boolean
}) {
  const [form, setForm] = useState<ProjectInput>(initial)
  useEffect(() => { if (open) setForm(initial) }, [open, initial])
  const set = (k: keyof ProjectInput, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const isNew = !("id" in initial)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? "New project" : "Edit project"}</DialogTitle>
          <DialogDescription>
            These details pre-fill Delivery Notes and new item forms for this project.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Row 1 */}
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Project name *</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. MiSK Ilmi Phase 2" autoFocus />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Input value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="Short note" />
          </div>

          <Separator />

          {/* Row 2 — client */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Client / deliver to</Label>
              <Input value={form.client_name ?? ""} onChange={(e) => set("client_name", e.target.value)} placeholder="e.g. First Fix Team" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Site contact</Label>
              <Input value={form.site_contact ?? ""} onChange={(e) => set("site_contact", e.target.value)} placeholder="e.g. Ahmed Al-Rashid" />
            </div>
          </div>

          {/* Row 3 — POs */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Our PO number</Label>
              <Input value={form.our_po ?? ""} onChange={(e) => set("our_po", e.target.value)} placeholder="e.g. PO-2025-001" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Client PO number</Label>
              <Input value={form.client_po ?? ""} onChange={(e) => set("client_po", e.target.value)} placeholder="e.g. CPO-8821" />
            </div>
          </div>

          {/* Row 4 — location */}
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Site location</Label>
            <Input value={form.site_location ?? ""} onChange={(e) => set("site_location", e.target.value)} placeholder="e.g. MiSK Ilmi Campus, Riyadh" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={() => onSave(form)} disabled={busy || !form.name.trim()}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {isNew ? "Create project" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ProjectsSection() {
  const { data: projects = [], isLoading } = useAllProjects()
  const create = useCreateProject()
  const update = useUpdateProject()
  const [createOpen, setCreateOpen] = useState(false)
  const [editProject, setEditProject] = useState<(ProjectInput & { id: string }) | null>(null)

  async function handleCreate(form: ProjectInput) {
    try {
      await create.mutateAsync({ ...form, sort: projects.length + 1 })
      toast.success(`Project "${form.name.trim()}" created`)
      setCreateOpen(false)
    } catch (e) {
      toast.error("Could not create project", { description: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  async function handleEdit(form: ProjectInput) {
    if (!editProject) return
    try {
      await update.mutateAsync({ id: editProject.id, patch: {
        name: form.name.trim(),
        description: form.description?.trim() || null,
        client_name: form.client_name?.trim() || null,
        client_po: form.client_po?.trim() || null,
        our_po: form.our_po?.trim() || null,
        site_location: form.site_location?.trim() || null,
        site_contact: form.site_contact?.trim() || null,
      }})
      toast.success("Project updated")
      setEditProject(null)
    } catch (e) {
      toast.error("Could not update project", { description: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  async function toggleActive(id: string, active: boolean) {
    try {
      await update.mutateAsync({ id, patch: { active } })
      toast.success(active ? "Project activated" : "Project deactivated")
    } catch (e) {
      toast.error("Could not update", { description: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  return (
    <>
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Projects</CardTitle>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> New project
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Each project has its own items, documents and delivery notes. Fill in
          the project details (PO numbers, client, location) once — they'll
          pre-fill Delivery Notes and new item forms automatically.
        </p>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {projects.map((p) => (
              <div
                key={p.id}
                className="rounded-lg border p-3 space-y-2"
              >
                {/* Header row: name + actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
                    <span className="font-medium truncate">{p.name}</span>
                    {!p.active && <Badge variant="secondary" className="shrink-0">Inactive</Badge>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => setEditProject({
                            id: p.id,
                            name: p.name,
                            description: p.description,
                            client_name: p.client_name,
                            client_po: p.client_po,
                            our_po: p.our_po,
                            site_location: p.site_location,
                            site_contact: p.site_contact,
                          })}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit project details</TooltipContent>
                    </Tooltip>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() => toggleActive(p.id, !p.active)}
                    >
                      {p.active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>

                {/* Details: each on its own line so nothing wraps mid-word */}
                {(p.client_name || p.our_po || p.client_po || p.site_location || p.site_contact) && (
                  <div className="grid grid-cols-1 gap-0.5 pl-6 text-xs text-muted-foreground sm:grid-cols-2">
                    {p.client_name && <span className="truncate">Client: <strong className="text-foreground">{p.client_name}</strong></span>}
                    {p.site_contact && <span className="truncate">Contact: <strong className="text-foreground">{p.site_contact}</strong></span>}
                    {p.our_po && <span className="truncate">Our PO: <strong className="text-foreground">{p.our_po}</strong></span>}
                    {p.client_po && <span className="truncate">Client PO: <strong className="text-foreground">{p.client_po}</strong></span>}
                    {p.site_location && <span className="truncate sm:col-span-2">Location: <strong className="text-foreground">{p.site_location}</strong></span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    <ProjectDialog
      open={createOpen}
      onClose={() => setCreateOpen(false)}
      initial={blankProjectInput()}
      onSave={handleCreate}
      busy={create.isPending}
    />
    <ProjectDialog
      open={!!editProject}
      onClose={() => setEditProject(null)}
      initial={editProject ?? blankProjectInput()}
      onSave={handleEdit}
      busy={update.isPending}
    />
    </>
  )
}

// ---------------------------------------------------------------------------
function SystemsSection() {
  const { systems } = useSystems()
  const upsert = useUpsertSystem()
  const toggleSystem = useToggleSystem()
  const [key, setKey] = useState("")
  const [label, setLabel] = useState("")

  async function add() {
    const k = key.trim().toUpperCase()
    if (!k || !label.trim()) {
      toast.error("Key and label are required")
      return
    }
    try {
      await upsert.mutateAsync({
        key: k,
        label: label.trim(),
        sort: systems.length + 1,
        active: true,
      })
      toast.success(`System "${label.trim()}" added`)
      setKey("")
      setLabel("")
    } catch (e) {
      toast.error("Could not add system", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    }
  }

  async function toggle(k: string, active: boolean) {
    try {
      await toggleSystem.mutateAsync({ key: k, active })
      toast.success(active ? "System enabled" : "System disabled")
    } catch (e) {
      toast.error("Could not update", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Systems</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Categories used across Procurement and Documents. Inactive systems are
          hidden from new entries but kept on existing ones.
        </p>

        <div className="flex flex-col gap-2">
          {systems.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between gap-2 rounded-lg border p-2.5"
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {s.key}
                </Badge>
                <span className="font-medium">{s.label}</span>
                {!s.active && (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggle(s.key, !s.active)}
              >
                {s.active ? "Deactivate" : "Activate"}
              </Button>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-end">
          <div className="grid flex-1 gap-1.5">
            <Label className="text-xs text-muted-foreground">Key (short)</Label>
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="e.g. ELV"
              className="font-mono uppercase"
            />
          </div>
          <div className="grid flex-1 gap-1.5">
            <Label className="text-xs text-muted-foreground">Label</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. ELV Systems"
            />
          </div>
          <Button onClick={add} disabled={upsert.isPending}>
            {upsert.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
