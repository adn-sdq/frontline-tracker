import { useEffect, useState } from "react"
import { errorMessage } from "@/lib/utils"
import { Copy, Loader2, MoreHorizontal, Pencil, Plus, ShieldCheck, Trash2, Users } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
  return { name: "", description: null, permissions: {}, is_tech_manager: false, is_sla_manager: false }
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
            is_tech_manager: role.is_tech_manager,
            is_sla_manager: role.is_sla_manager,
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
            Members with this role get exactly these pages. “View” is read-only — enforced by the database, not just hidden.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Role name *</Label>
            <Input autoFocus value={f.name} onChange={(e) => setF((s) => ({ ...s, name: e.target.value }))} placeholder="e.g. Site engineer, Document controller" />
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

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Capabilities</Label>
          {([
            ["is_tech_manager", "Technicians manager", "Run the roster, answer requests, schedule people"],
            ["is_sla_manager", "SLA manager", "Create and edit SLA contracts"],
          ] as const).map(([key, label, hint]) => (
            <label key={key} className="flex cursor-pointer items-start gap-2.5 rounded-md border p-2.5 hover:bg-accent/40">
              <Checkbox className="mt-0.5" checked={f[key]} onCheckedChange={(v) => setF((s) => ({ ...s, [key]: !!v }))} />
              <span>
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-xs text-muted-foreground">{hint}</span>
              </span>
            </label>
          ))}
        </div>

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
  const { data: roles = [], isLoading } = useAccessRoles()
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
        ? `${n} member${n > 1 ? "s" : ""} will fall back to their individual page settings.`
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
          is_tech_manager: r.is_tech_manager,
          is_sla_manager: r.is_sla_manager,
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
          Bundle page access into reusable roles, then assign them to members from the Users or Access tab.
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
                      <ShieldCheck className="size-4 shrink-0 text-primary" />
                      <span className="truncate font-semibold">{r.name}</span>
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
                      <DropdownMenuItem onClick={() => { setEditing(r); setOpen(true) }}>
                        <Pencil className="size-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicate(r)}>
                        <Copy className="size-4" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => remove(r)}>
                        <Trash2 className="size-4" /> Delete
                      </DropdownMenuItem>
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

                {(r.is_tech_manager || r.is_sla_manager) && (
                  <div className="flex flex-wrap gap-1">
                    {r.is_tech_manager && <Badge variant="outline" className="text-[10px]">Technicians manager</Badge>}
                    {r.is_sla_manager && <Badge variant="outline" className="text-[10px]">SLA manager</Badge>}
                  </div>
                )}

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
