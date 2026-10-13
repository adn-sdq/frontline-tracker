import { useEffect, useState } from "react"
import { errorMessage } from "@/lib/utils"
import { Copy, Loader2, Lock, MoreHorizontal, Pencil, Plus, ShieldCheck, Trash2, Users } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { useConfirm } from "@/components/ui/confirm-dialog"
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
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageAccessBadge, PageAccessPicker } from "@/components/admin/PageAccessBadge"
import { displayName } from "@/components/profile/shared"
import { sortRoles } from "@/lib/access"
import {
  useAccessRoles,
  useAllProfiles,
  useDeleteAccessRole,
  useSaveAccessRole,
  type AccessRoleInput,
} from "@/hooks/useAdmin"
import { APP_PAGE_LABELS, APP_PAGES, type AccessRole, type PageAccess } from "@/lib/types"

const PRESETS: { label: string; perms: PageAccess }[] = [
  { label: "All view", perms: "view" },
  { label: "All edit", perms: "edit" },
  { label: "Clear", perms: "none" },
]

function blank(): AccessRoleInput {
  return { name: "", description: null, permissions: {} }
}

function RoleDialog({
  open,
  onOpenChange,
  role,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  role: AccessRole | null
}) {
  const save = useSaveAccessRole()
  const [f, setF] = useState<AccessRoleInput>(blank())

  useEffect(() => {
    if (!open) return
    setF(
      role
        ? {
            name: role.name,
            description: role.description,
            permissions: { ...role.permissions },
          }
        : blank()
    )
  }, [open, role])

  const setPerm = (page: string, lvl: PageAccess) =>
    setF((s) => ({ ...s, permissions: { ...s.permissions, [page]: lvl } }))

  async function submit() {
    if (!f.name.trim()) return toast.error("Give the role a name")
    try {
      await save.mutateAsync({ id: role?.id, input: { ...f, name: f.name.trim(), description: f.description?.trim() || null } })
      toast.success(role ? "Role updated" : "Role created")
      onOpenChange(false)
    } catch (e) {
      toast.error("Could not save role", { description: errorMessage(e) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{role ? "Edit role" : "New role"}</DialogTitle>
          <DialogDescription>
            Everyone with this role gets exactly these pages. View-only is enforced by the database, not just hidden.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Role name *</Label>
            <Input autoFocus value={f.name} disabled={!!role?.is_system} onChange={(e) => setF((s) => ({ ...s, name: e.target.value }))} placeholder="e.g. Site engineer, Document controller" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea rows={2} value={f.description ?? ""} onChange={(e) => setF((s) => ({ ...s, description: e.target.value }))} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Page access</Label>
            <div className="flex gap-1">
              {PRESETS.map((p) => (
                <Button
                  key={p.label}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setF((s) => ({ ...s, permissions: Object.fromEntries(APP_PAGES.map((pg) => [pg, p.perms])) }))}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="divide-y rounded-lg border">
            {APP_PAGES.map((pg) => (
              <div key={pg} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="text-sm">{APP_PAGE_LABELS[pg]}</span>
                <PageAccessPicker value={f.permissions[pg] ?? "none"} onChange={(v) => setPerm(pg, v)} />
              </div>
            ))}
          </div>
        </div>

        <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <strong className="text-foreground">View</strong> — can open the page and read everything on it.{" "}
          <strong className="text-foreground">Edit</strong> — can also create, change and delete. Edit on Technicians
          includes managing the roster; Edit on SLA includes managing contracts.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>Cancel</Button>
          <Button onClick={submit} disabled={save.isPending}>
            {save.isPending && <Loader2 className="size-4 animate-spin" />}
            {role ? "Save role" : "Create role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AdminRolesTab() {
  const { data: rawRoles = [], isLoading } = useAccessRoles()
  const roles = sortRoles(rawRoles)
  const { data: profiles = [] } = useAllProfiles()
  const del = useDeleteAccessRole()
  const save = useSaveAccessRole()
  const confirm = useConfirm()
  const [editing, setEditing] = useState<AccessRole | null>(null)
  const [open, setOpen] = useState(false)

  const membersOf = (id: string) => profiles.filter((p) => p.access_role_id === id)

  async function remove(r: AccessRole) {
    const n = membersOf(r.id).length
    const ok = await confirm({
      title: `Delete “${r.name}”?`,
      description: n
        ? `${n} member${n > 1 ? "s" : ""} will move to “No access” until given another role.`
        : "No one is assigned this role.",
      confirmText: "Delete role",
      destructive: true,
    })
    if (!ok) return
    try {
      await del.mutateAsync(r.id)
      toast.success("Role deleted")
    } catch (e) {
      toast.error("Could not delete", { description: errorMessage(e) })
    }
  }

  async function duplicate(r: AccessRole) {
    try {
      await save.mutateAsync({
        input: {
          name: `${r.name} (copy)`,
          description: r.description,
          permissions: r.permissions,
        },
      })
      toast.success("Role duplicated")
    } catch (e) {
      toast.error("Could not duplicate", { description: errorMessage(e) })
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Roles are the only way to grant access. Assign them to people in the Access tab.
        </p>
        <Button onClick={() => { setEditing(null); setOpen(true) }}>
          <Plus className="size-4" /> New role
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Spinner className="size-5" /></div>
      ) : roles.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No custom roles yet"
          description="Create roles like “Site engineer — Tracker edit, Documents view” and assign them to members."
          action={<Button onClick={() => { setEditing(null); setOpen(true) }}><Plus className="size-4" /> New role</Button>}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {roles.map((r) => {
            const members = membersOf(r.id)
            return (
              <div key={r.id} className="flex flex-col gap-3 rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {r.is_system ? <Lock className="size-4 shrink-0 text-muted-foreground" /> : <ShieldCheck className="size-4 shrink-0 text-primary" />}
                      <span className="truncate font-semibold">{r.name}</span>
                      {r.is_system && <Badge variant="secondary" className="text-[10px]">Built-in</Badge>}
                    </div>
                    {r.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.description}</p>}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-7 shrink-0" aria-label="Role actions">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {r.key !== "admin" && r.key !== "none" && (
                        <DropdownMenuItem onClick={() => { setEditing(r); setOpen(true) }}>
                          <Pencil className="size-4" /> {r.is_system ? "Edit pages" : "Edit"}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => duplicate(r)}>
                        <Copy className="size-4" /> Duplicate
                      </DropdownMenuItem>
                      {!r.is_system && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => remove(r)}>
                            <Trash2 className="size-4" /> Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                  {APP_PAGES.map((pg) => (
                    <div key={pg} className="flex items-center justify-between gap-2">
                      <span className="truncate text-muted-foreground">{APP_PAGE_LABELS[pg]}</span>
                      <PageAccessBadge level={r.permissions[pg] ?? "none"} />
                    </div>
                  ))}
                </div>


                <div className="mt-auto flex items-center gap-1.5 border-t pt-2.5 text-xs text-muted-foreground">
                  <Users className="size-3.5" />
                  {members.length === 0 ? "Not assigned" : (
                    <span className="truncate" title={members.map(displayName).join(", ")}>
                      {members.length} member{members.length > 1 ? "s" : ""}: {members.map(displayName).join(", ")}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <RoleDialog open={open} onOpenChange={setOpen} role={editing} />
    </div>
  )
}
