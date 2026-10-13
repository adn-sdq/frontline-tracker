import { useSearchParams } from "react-router-dom"
import { Boxes, FolderOpen, KeyRound, Shield, ShieldCheck, Users } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { PageHeader } from "@/components/PageHeader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminUsersTab } from "@/components/admin/AdminUsersTab"
import { AdminRolesTab } from "@/components/admin/AdminRolesTab"
import { AdminAccessTab } from "@/components/admin/AdminAccessTab"
import { AdminProjectsTab } from "@/components/admin/AdminProjectsTab"
import { AdminSystemsTab } from "@/components/admin/AdminSystemsTab"

type AdminTab = "users" | "roles" | "access" | "projects" | "systems"
const ADMIN_TABS: { value: AdminTab; label: string; icon: typeof Users }[] = [
  { value: "users", label: "Users", icon: Users },
  { value: "roles", label: "Roles", icon: ShieldCheck },
  { value: "access", label: "Access", icon: KeyRound },
  { value: "projects", label: "Projects", icon: FolderOpen },
  { value: "systems", label: "Systems", icon: Boxes },
]

export default function AdminPage() {
  const { profile } = useAuth()
  const [params, setParams] = useSearchParams()
  const raw = params.get("tab") as AdminTab | null
  const tab: AdminTab = raw && ADMIN_TABS.some((t) => t.value === raw) ? raw : "users"
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
        subtitle="Accounts, roles, projects and systems."
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
        <TabsContent value="users" className="mt-4"><AdminUsersTab /></TabsContent>
        <TabsContent value="roles" className="mt-4"><AdminRolesTab /></TabsContent>
        <TabsContent value="access" className="mt-4"><AdminAccessTab /></TabsContent>
        <TabsContent value="projects" className="mt-4"><AdminProjectsTab /></TabsContent>
        <TabsContent value="systems" className="mt-4"><AdminSystemsTab /></TabsContent>
      </Tabs>
    </div>
  )
}
