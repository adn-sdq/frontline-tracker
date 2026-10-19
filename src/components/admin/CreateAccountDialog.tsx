import { useEffect, useState } from "react"
import { errorMessage } from "@/lib/utils"
import { Copy, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { WorkEmailInput } from "@/components/admin/WorkEmailInput"
import { parseWorkEmail } from "@/lib/email"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAccessRoles, useCreateAccount } from "@/hooks/useAdmin"
import { sortRoles } from "@/lib/access"
import { useAllProjects, useAssignProject } from "@/hooks/useProjects"
import { ORG_LABELS, ORGS, type Org } from "@/lib/types"

function generatePassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789"
  const bytes = crypto.getRandomValues(new Uint32Array(12))
  return Array.from(bytes, (b) => chars[b % chars.length]).join("")
}

const EMPTY = {
  username: "",
  fullName: "",
  jobTitle: "",
  department: "",
  phone: "",
  email: "",
}

export function CreateAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const create = useCreateAccount()
  const assign = useAssignProject()
  const { data: projects = [] } = useAllProjects()
  const [f, setF] = useState(EMPTY)
  const [password, setPassword] = useState("")
  const [org, setOrg] = useState<Org>("frontline")
  const { data: rawRoles = [] } = useAccessRoles()
  const roles = sortRoles(rawRoles)
  const noAccessId = roles.find((r) => r.key === "none")?.id ?? ""
  const [roleId, setRoleId] = useState("")
  const selectedRole = roles.find((r) => r.id === (roleId || noAccessId))
  const isAdminRole = selectedRole?.key === "admin"
  const [projectIds, setProjectIds] = useState<string[]>([])

  useEffect(() => {
    if (!open) return
    setF(EMPTY)
    setPassword(generatePassword())
    setOrg("frontline")
    setRoleId("")
    setProjectIds([])
  }, [open])

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }))

  async function submit() {
    const parsed = parseWorkEmail(f.username)
    if ("error" in parsed) return toast.error(parsed.error)
    const { username, email } = parsed
    if (!password.trim()) return toast.error("Password is required")
    if (password.length < 8) return toast.error("Password must be at least 8 characters")
    try {
      const res = await create.mutateAsync({
        username,
        password,
        full_name: f.fullName.trim() || username,
        org,
        access_role_id: roleId || noAccessId || null,
        job_title: f.jobTitle,
        department: f.department,
        phone: f.phone,
        contact_email: email,
      })
      if (!isAdminRole && res?.id) {
        for (const projectId of projectIds) await assign.mutateAsync({ projectId, userId: res.id })
      }
      toast.success(`Account ${email} created`, {
        description: "Share the email and password with them securely.",
      })
      onOpenChange(false)
    } catch (e) {
      toast.error("Could not create account", { description: errorMessage(e) })
    }
  }

  const busy = create.isPending || assign.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add account</DialogTitle>
          <DialogDescription>They sign in with their work email (or just the part before @) and this password.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Work email *</Label>
            <WorkEmailInput autoFocus value={f.username} onChange={(v) => setF((s) => ({ ...s, username: v }))} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Full name</Label>
            <Input value={f.fullName} onChange={set("fullName")} />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Temporary password *</Label>
            <div className="flex gap-1.5">
              <Input value={password} onChange={(e) => setPassword(e.target.value)} className="font-mono" />
              <Button type="button" variant="outline" size="icon" aria-label="Generate password" onClick={() => setPassword(generatePassword())}>
                <RefreshCw className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Copy password"
                onClick={() => navigator.clipboard.writeText(password).then(() => toast.success("Password copied"))}
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Role</Label>
            <Select value={roleId || noAccessId} onValueChange={setRoleId}>
              <SelectTrigger className="w-full"><SelectValue placeholder="No access" /></SelectTrigger>
              <SelectContent>
                {roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {selectedRole?.description && <p className="text-xs text-muted-foreground">{selectedRole.description}</p>}
          </div>
          <div className="grid content-start gap-1.5">
            <Label className="text-xs text-muted-foreground">Team</Label>
            <Select value={org} onValueChange={(v) => setOrg(v as Org)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ORGS.map((o) => <SelectItem key={o} value={o}>{ORG_LABELS[o]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Job title</Label>
            <Input value={f.jobTitle} onChange={set("jobTitle")} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Department</Label>
            <Input value={f.department} onChange={set("department")} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Phone</Label>
            <Input type="tel" value={f.phone} onChange={set("phone")} />
          </div>
        </div>

        {!isAdminRole && projects.length > 0 && (
          <>
            <Separator />
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Projects</Label>
              <div className="grid max-h-40 gap-1 overflow-y-auto sm:grid-cols-2">
                {projects.map((p) => (
                  <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent/40">
                    <Checkbox
                      checked={projectIds.includes(p.id)}
                      onCheckedChange={(on) =>
                        setProjectIds((ids) => (on ? [...ids, p.id] : ids.filter((x) => x !== p.id)))
                      }
                    />
                    <span className="truncate">{p.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            Create account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
