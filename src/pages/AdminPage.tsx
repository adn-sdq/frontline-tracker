import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  Boxes,
  FolderOpen,
  History,
  KeyRound,
  LayoutDashboard,
  Users,
  Loader2,
  Plus,
  Shield,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/contexts/AuthContext"
import {
  useSystems,
  useToggleSystem,
  useUpsertSystem,
} from "@/hooks/useSystems"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/PageHeader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminOverviewTab } from "@/components/admin/AdminOverviewTab"
import { AdminUsersTab } from "@/components/admin/AdminUsersTab"
import { AdminAccessTab } from "@/components/admin/AdminAccessTab"
import { AdminAuditTab } from "@/components/admin/AdminAuditTab"
import { AdminProjectsTab } from "@/components/admin/AdminProjectsTab"
import { AdminRolesTab } from "@/components/admin/AdminRolesTab"

type AdminTab = "overview" | "users" | "roles" | "access" | "projects" | "systems" | "audit"
const ADMIN_TABS: { value: AdminTab; label: string; icon: typeof Users }[] = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "users", label: "Users", icon: Users },
  { value: "roles", label: "Roles", icon: ShieldCheck },
  { value: "access", label: "Access", icon: KeyRound },
  { value: "projects", label: "Projects", icon: FolderOpen },
  { value: "systems", label: "Systems", icon: Boxes },
  { value: "audit", label: "Audit log", icon: History },
]

export default function AdminPage() {
  const { profile } = useAuth()
  const [params, setParams] = useSearchParams()
  const raw = params.get("tab") as AdminTab | null
  const tab: AdminTab = raw && ADMIN_TABS.some((t) => t.value === raw) ? raw : "overview"
  const setTab = (t: string) => setParams((p) => { p.set("tab", t); return p }, { replace: true })

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
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Admin Console"
        subtitle="Accounts, access, projects, systems and the audit trail."
      />
      <Tabs value={tab} onValueChange={setTab}>
        <div className="overflow-x-auto">
          <TabsList>
            {ADMIN_TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className="gap-1.5">
                <Icon className="size-4" /> {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="overview" className="mt-4"><AdminOverviewTab onTab={setTab} /></TabsContent>
        <TabsContent value="users" className="mt-4"><AdminUsersTab /></TabsContent>
        <TabsContent value="roles" className="mt-4"><AdminRolesTab /></TabsContent>
        <TabsContent value="access" className="mt-4"><AdminAccessTab /></TabsContent>
        <TabsContent value="projects" className="mt-4"><AdminProjectsTab /></TabsContent>
        <TabsContent value="systems" className="mt-4"><SystemsSection /></TabsContent>
        <TabsContent value="audit" className="mt-4"><AdminAuditTab /></TabsContent>
      </Tabs>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

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
