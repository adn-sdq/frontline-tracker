import { useState } from "react"
import {
  FolderOpen,
  KeyRound,
  Loader2,
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
  useSetPassword,
  useUpdateProfile,
} from "@/hooks/useAdmin"
import {
  useAllProjectMembers,
  useAllProjects,
  useAssignProject,
  useCreateProject,
  useUnassignProject,
  useUpdateProject,
} from "@/hooks/useProjects"
import { useSystems, useUpsertSystem } from "@/hooks/useSystems"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { APP_PAGES, APP_PAGE_LABELS, ORGS, ORG_LABELS, type AppPage, type Org, type Profile } from "@/lib/types"

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
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Manage team accounts and the system list.
        </p>
      </div>
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

  async function toggleProjectMember(p: Profile, projectId: string) {
    const assigned = memberships.some(
      (m) => m.user_id === p.id && m.project_id === projectId
    )
    try {
      if (assigned) await unassign.mutateAsync({ projectId, userId: p.id })
      else await assign.mutateAsync({ projectId, userId: p.id })
    } catch (e) {
      toast.error("Could not update projects", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    }
  }

  async function changeOrg(p: Profile, org: string) {
    try {
      await updateProfile.mutateAsync({ id: p.id, patch: { org: org as Org } })
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
          <div className="rounded-lg border">
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
                                <Button variant="outline" size="sm" className="h-7 max-w-[180px] text-xs">
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          title="Reset password"
                          onClick={() => setPwUser(p)}
                        >
                          <KeyRound className="size-4" />
                        </Button>
                        {p.id !== user?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive"
                            title="Delete"
                            onClick={() => setDelUser(p)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <CreateAccountDialog open={createOpen} onOpenChange={setCreateOpen} />
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
          <div className="grid grid-cols-2 gap-3">
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
function ProjectsSection() {
  const { data: projects = [], isLoading } = useAllProjects()
  const create = useCreateProject()
  const update = useUpdateProject()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  async function add() {
    if (!name.trim()) {
      toast.error("Project name is required")
      return
    }
    try {
      await create.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        sort: projects.length + 1,
      })
      toast.success(`Project "${name.trim()}" created`)
      setName("")
      setDescription("")
    } catch (e) {
      toast.error("Could not create project", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    }
  }

  async function toggleActive(id: string, active: boolean) {
    try {
      await update.mutateAsync({ id, patch: { active } })
    } catch (e) {
      toast.error("Could not update", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Each project has its own items and documents. Assign people to a
          project in the Accounts table below — they'll only see projects they're
          assigned to. Admins see every project.
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
                className="flex items-center justify-between gap-2 rounded-lg border p-2.5"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate font-medium">{p.name}</span>
                  {p.description && (
                    <span className="hidden truncate text-sm text-muted-foreground sm:inline">
                      — {p.description}
                    </span>
                  )}
                  {!p.active && <Badge variant="secondary">Inactive</Badge>}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleActive(p.id, !p.active)}
                >
                  {p.active ? "Deactivate" : "Activate"}
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-end">
          <div className="grid flex-1 gap-1.5">
            <Label className="text-xs text-muted-foreground">Project name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. NEOM Phase 2"
            />
          </div>
          <div className="grid flex-1 gap-1.5">
            <Label className="text-xs text-muted-foreground">Description (optional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short note"
            />
          </div>
          <Button onClick={add} disabled={create.isPending}>
            {create.isPending ? (
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

// ---------------------------------------------------------------------------
function SystemsSection() {
  const { systems } = useSystems()
  const upsert = useUpsertSystem()
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
      await upsert.mutateAsync({ key: k, active })
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
