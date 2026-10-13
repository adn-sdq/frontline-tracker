import { useMemo, useState } from "react"
import { KeyRound, MoreHorizontal, Search, ShieldCheck, UserCircle, UserPlus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { UserAvatar } from "@/components/UserAvatar"
import { ProfileDialog } from "@/components/ProfileDialog"
import { CreateAccountDialog } from "@/components/admin/CreateAccountDialog"
import { displayName } from "@/components/profile/shared"
import { useAuth } from "@/contexts/AuthContext"
import { useAccessRoles, useAllProfiles } from "@/hooks/useAdmin"
import { roleFor, sortRoles } from "@/lib/access"
import { useAllProjectMembers } from "@/hooks/useProjects"
import { cn } from "@/lib/utils"
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
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Projects</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => {
                const suspended = p.status === "suspended"
                const accessRole = roleFor(p, accessRoles)
                const isAdminUser = accessRole?.key === "admin"
                return (
                  <TableRow key={p.id} className={cn("cursor-pointer", suspended && "opacity-60")} onClick={() => setOpen({ profile: p, tab: "overview" })}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <UserAvatar name={displayName(p)} src={p.avatar_url} seed={p.id} className="size-7" fallbackClassName="text-[10px]" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-medium">{displayName(p)}</span>
                            {p.id === user?.id && <Badge variant="secondary" className="text-[10px]">You</Badge>}
                            {suspended && <Badge className="border-transparent bg-red-600 text-[10px] text-white">Suspended</Badge>}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            @{p.username}{p.job_title ? ` · ${p.job_title}` : ""}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isAdminUser ? "default" : "outline"} className="font-normal">
                        {accessRole?.name ?? "No access"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{p.org ? ORG_LABELS[p.org] : "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{isAdminUser ? "All" : projectCount[p.id] ?? 0}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7" aria-label="Account actions">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setOpen({ profile: p, tab: "overview" })}>
                            <UserCircle className="size-4" /> View profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setOpen({ profile: p, tab: "access" })}>
                            <ShieldCheck className="size-4" /> View access
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setOpen({ profile: p, tab: "security" })}>
                            <KeyRound className="size-4" /> Password & status
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">No accounts match.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
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
