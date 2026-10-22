import { useMemo, useState } from "react"
import { KeyRound, Search, ShieldCheck, Trash2, UserCircle, UserPlus } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { UserAvatar } from "@/components/UserAvatar"
import { ProfileDialog } from "@/components/ProfileDialog"
import { CreateAccountDialog } from "@/components/admin/CreateAccountDialog"
import { displayName } from "@/components/profile/shared"
import { useAuth } from "@/contexts/AuthContext"
import { useAccessRoles, useAllProfiles, useDeleteAccount } from "@/hooks/useAdmin"
import { roleFor, sortRoles } from "@/lib/access"
import { useAllProjectMembers } from "@/hooks/useProjects"
import { errorMessage } from "@/lib/utils"
import { ORG_LABELS, ORGS, type Profile } from "@/lib/types"

type DialogTab = "overview" | "access" | "security"

export function AdminUsersTab() {
  const { user } = useAuth()
  const { data: profiles = [], isLoading } = useAllProfiles()
  const { data: memberships = [] } = useAllProjectMembers()
  const { data: accessRoles = [] } = useAccessRoles()
  const [search, setSearch] = useState("")
  const [role, setRole] = useState("ALL")
  const [org, setOrg] = useState("ALL")
  const [status, setStatus] = useState("ALL")
  const [createOpen, setCreateOpen] = useState(false)
  const [open, setOpen] = useState<{ profile: Profile; tab: DialogTab } | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const deleteAccount = useDeleteAccount()
  const confirm = useConfirm()

  const projectCount = useMemo(() => {
    const m: Record<string, number> = {}
    for (const r of memberships) m[r.user_id] = (m[r.user_id] ?? 0) + 1
    return m
  }, [memberships])

  const q = search.trim().toLowerCase()
  const rows = profiles.filter((p) => {
    if (role !== "ALL" && p.access_role_id !== role) return false
    if (org !== "ALL" && p.org !== org) return false
    if (status !== "ALL" && (p.status ?? "active") !== status) return false
    if (!q) return true
    return [p.full_name, p.username, p.job_title, p.department, p.contact_email].some((v) => v?.toLowerCase().includes(q))
  })

  const filtered = role !== "ALL" || org !== "ALL" || status !== "ALL" || !!q

  const columns = useMemo<ColumnDef<Profile, unknown>[]>(
    () => [
      {
        id: "user",
        accessorFn: (p) => displayName(p),
        header: "User",
        cell: ({ row }) => {
          const p = row.original
          return (
            <div className="flex max-w-80 items-center gap-2.5">
              <UserAvatar name={displayName(p)} src={p.avatar_url} seed={p.id} className="size-7" fallbackClassName="text-[10px]" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-medium">{displayName(p)}</span>
                  {p.id === user?.id && <Badge variant="secondary" className="text-[10px]">You</Badge>}
                  {p.status === "suspended" && <Badge className="border-transparent bg-red-600 text-[10px] text-white">Suspended</Badge>}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {p.username}@frontline.sa{p.job_title ? ` · ${p.job_title}` : ""}
                </div>
              </div>
            </div>
          )
        },
      },
      {
        id: "role",
        accessorFn: (p) => roleFor(p, accessRoles)?.name ?? "No access",
        header: "Role",
        cell: ({ row }) => {
          const r = roleFor(row.original, accessRoles)
          return (
            <Badge variant={r?.key === "admin" ? "default" : "outline"} className="font-normal">
              {r?.name ?? "No access"}
            </Badge>
          )
        },
      },
      { id: "team", accessorFn: (p) => (p.org ? ORG_LABELS[p.org] : "—"), header: "Team" },
      {
        id: "projects",
        accessorFn: (p) => (roleFor(p, accessRoles)?.key === "admin" ? Infinity : projectCount[p.id] ?? 0),
        header: "Projects",
        cell: ({ row }) => (
          <span className="tabular-nums">
            {roleFor(row.original, accessRoles)?.key === "admin" ? "All" : projectCount[row.original.id] ?? 0}
          </span>
        ),
      },
    ],
    [accessRoles, projectCount, user?.id]
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, username, title…" className="pl-8" />
        </div>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All roles</SelectItem>
            {sortRoles(accessRoles).map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={org} onValueChange={setOrg}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All teams</SelectItem>
            {ORGS.map((o) => <SelectItem key={o} value={o}>{ORG_LABELS[o]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Any status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="size-4" /> Add account
        </Button>
      </div>

      {filtered && <p className="text-xs text-muted-foreground">{rows.length} of {profiles.length} accounts</p>}

      {isLoading ? (
        <div className="flex justify-center py-10"><Spinner className="size-5" /></div>
      ) : (
        <DataTable
          tableId="admin-users"
          columns={columns}
          data={rows}
          getRowId={(p) => p.id}
          noun="account"
          pageSize={50}
          emptyMessage="No accounts match."
          onRowClick={(p) => setOpen({ profile: p, tab: "overview" })}
          rowClassName={(p) => (p.status === "suspended" ? "opacity-60" : undefined)}
          selection={{ selected, onChange: setSelected }}
          onBulkDelete={async (list) => {
            const deletable = list.filter((p) => p.id !== user?.id && !p.is_super_admin)
            const skipped = list.length - deletable.length
            try {
              await Promise.all(deletable.map((p) => deleteAccount.mutateAsync(p.id)))
              toast.success(`Deleted ${deletable.length} account${deletable.length === 1 ? "" : "s"}`, {
                description: skipped ? "Your own account was skipped." : undefined,
              })
            } catch (e) {
              toast.error("Could not delete some accounts", { description: errorMessage(e) })
            }
          }}
          rowActions={(p) => [
            { label: "View profile", icon: UserCircle, onClick: () => setOpen({ profile: p, tab: "overview" }) },
            { label: "View access", icon: ShieldCheck, onClick: () => setOpen({ profile: p, tab: "access" }) },
            { label: "Password & status", icon: KeyRound, onClick: () => setOpen({ profile: p, tab: "security" }) },
            {
              label: "Delete account",
              icon: Trash2,
              destructive: true,
              separator: true,
              hidden: p.id === user?.id || !!p.is_super_admin,
              onClick: async () => {
                const ok = await confirm({
                  title: `Delete ${displayName(p)}?`,
                  description: "Their login is removed permanently. Records they created stay.",
                  confirmText: "Delete",
                  destructive: true,
                })
                if (!ok) return
                try {
                  await deleteAccount.mutateAsync(p.id)
                  toast.success("Account deleted")
                } catch (e) {
                  toast.error("Could not delete", { description: errorMessage(e) })
                }
              },
            },
          ]}
        />
      )}

      <CreateAccountDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ProfileDialog
        profile={open?.profile ?? null}
        open={!!open}
        defaultTab={open?.tab}
        onClose={() => setOpen(null)}
      />
    </div>
  )
}
