import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  Boxes,
  FolderOpen,
  History,
  KeyRound,
  LayoutDashboard,
  Users,
  Loader2,
  Pencil,
  Plus,
  Shield,
} from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/contexts/AuthContext"
import {
  useAllProjects,
  useCreateProject,
  useUpdateProject,
  type ProjectInput,
} from "@/hooks/useProjects"
import {
  useAllProjectSystems,
  useProjectSystemKeys,
  useSetProjectSystems,
  useSystems,
  useToggleSystem,
  useUpsertSystem,
} from "@/hooks/useSystems"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PageHeader } from "@/components/PageHeader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminOverviewTab } from "@/components/admin/AdminOverviewTab"
import { AdminUsersTab } from "@/components/admin/AdminUsersTab"
import { AdminAccessTab } from "@/components/admin/AdminAccessTab"
import { AdminAuditTab } from "@/components/admin/AdminAuditTab"

type AdminTab = "overview" | "users" | "access" | "projects" | "systems" | "audit"
const ADMIN_TABS: { value: AdminTab; label: string; icon: typeof Users }[] = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "users", label: "Users", icon: Users },
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
        <TabsContent value="access" className="mt-4"><AdminAccessTab /></TabsContent>
        <TabsContent value="projects" className="mt-4"><ProjectsSection /></TabsContent>
        <TabsContent value="systems" className="mt-4"><SystemsSection /></TabsContent>
        <TabsContent value="audit" className="mt-4"><AdminAuditTab /></TabsContent>
      </Tabs>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Projects
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
  projectId,
  projectsCount,
}: {
  open: boolean
  onClose: () => void
  initial: ProjectInput
  projectId?: string        // undefined = create, string = edit
  projectsCount: number     // for sort on create
}) {
  const create = useCreateProject()
  const update = useUpdateProject()
  const setProjectSystems = useSetProjectSystems()
  const { systems: allSystems } = useSystems()
  const activeSystems = allSystems.filter((s) => s.active)
  const { data: existingKeys } = useProjectSystemKeys(projectId ?? null)

  const [form, setForm] = useState<ProjectInput>(initial)
  const [selectedSystems, setSelectedSystems] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const isNew = !projectId

  const prevOpenRef = useRef(false)
  const systemsSeededRef = useRef(false)

  // Seed form and systems when dialog opens.
  useEffect(() => {
    const justOpened = open && !prevOpenRef.current
    prevOpenRef.current = open
    if (!open) { systemsSeededRef.current = false; return }
    if (!justOpened) return
    setForm(initial)
    if (!isNew && existingKeys !== undefined) {
      setSelectedSystems(existingKeys)
      systemsSeededRef.current = true
    } else {
      // Default: all active systems. If activeSystems is empty (still loading),
      // leave seeded=false so the second effect can fill in once data arrives.
      setSelectedSystems(activeSystems.map((s) => s.key))
      systemsSeededRef.current = activeSystems.length > 0 && isNew
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial])

  // When active systems or existing keys load after dialog opens, apply them once.
  useEffect(() => {
    if (!open || systemsSeededRef.current) return
    if (isNew) {
      if (activeSystems.length === 0) return  // still loading
      setSelectedSystems(activeSystems.map((s) => s.key))
      systemsSeededRef.current = true
    } else {
      if (existingKeys === undefined) return  // still loading
      setSelectedSystems(existingKeys)
      systemsSeededRef.current = true
    }
  }, [existingKeys, activeSystems, open, isNew])

  const set = (k: keyof ProjectInput, v: string) => setForm((f) => ({ ...f, [k]: v }))

  function toggleSystem(key: string) {
    setSelectedSystems((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  async function save() {
    setBusy(true)
    try {
      let pid: string
      if (isNew) {
        const project = await create.mutateAsync({ ...form, sort: projectsCount + 1 })
        pid = project.id
      } else {
        await update.mutateAsync({
          id: projectId,
          patch: {
            name: form.name.trim(),
            description: form.description?.trim() || null,
            client_name: form.client_name?.trim() || null,
            client_po: form.client_po?.trim() || null,
            our_po: form.our_po?.trim() || null,
            site_location: form.site_location?.trim() || null,
            site_contact: form.site_contact?.trim() || null,
          },
        })
        pid = projectId
      }
      await setProjectSystems.mutateAsync({ projectId: pid, keys: selectedSystems })
      toast.success(isNew ? `Project "${form.name.trim()}" created` : "Project updated")
      onClose()
    } catch (e) {
      toast.error(isNew ? "Could not save project" : "Could not update project", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !busy) onClose() }}>
      <DialogContent className="max-h-[90svh] overflow-x-hidden overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? "New project" : "Edit project"}</DialogTitle>
          <DialogDescription>
            These details pre-fill Delivery Notes and new item forms for this project.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Project name *</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. MiSK Ilmi Phase 2" autoFocus />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Input value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="Short note" />
          </div>

          <Separator />

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

          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Site location</Label>
            <Input value={form.site_location ?? ""} onChange={(e) => set("site_location", e.target.value)} placeholder="e.g. MiSK Ilmi Campus, Riyadh" />
          </div>

          <Separator />

          {/* Systems */}
          <div className="grid gap-2">
            <Label className="text-xs text-muted-foreground">
              Systems enabled for this project
            </Label>
            {activeSystems.length === 0 ? (
              <p className="text-xs text-muted-foreground/60">No systems configured globally yet.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {activeSystems.map((s) => (
                  <label
                    key={s.key}
                    className="flex cursor-pointer items-center gap-2 text-sm select-none"
                  >
                    <Checkbox
                      checked={selectedSystems.includes(s.key)}
                      onCheckedChange={() => toggleSystem(s.key)}
                    />
                    {s.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy || !form.name.trim()}>
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
  const update = useUpdateProject()
  const { data: allProjectSystems = [] } = useAllProjectSystems()
  const { labelFor } = useSystems()
  const [createOpen, setCreateOpen] = useState(false)
  const [editProjectId, setEditProjectId] = useState<string | null>(null)

  const editProject = projects.find((p) => p.id === editProjectId) ?? null

  async function toggleActive(id: string, active: boolean) {
    try {
      await update.mutateAsync({ id, patch: { active } })
      toast.success(active ? "Project activated" : "Project deactivated")
    } catch (e) {
      toast.error("Could not update", { description: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  // Build a map: projectId → system keys for badge display
  const systemsByProject = allProjectSystems.reduce<Record<string, string[]>>((acc, row) => {
    if (!acc[row.project_id]) acc[row.project_id] = []
    acc[row.project_id].push(row.system_key)
    return acc
  }, {})

  return (
    <>
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Projects</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
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
            {projects.map((p) => {
              const sysKeys = systemsByProject[p.id] ?? []
              return (
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
                            onClick={() => setEditProjectId(p.id)}
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

                  {/* Details */}
                  {(p.client_name || p.our_po || p.client_po || p.site_location || p.site_contact) && (
                    <div className="grid grid-cols-1 gap-0.5 pl-6 text-xs text-muted-foreground sm:grid-cols-2">
                      {p.client_name && <span className="truncate">Client: <strong className="text-foreground">{p.client_name}</strong></span>}
                      {p.site_contact && <span className="truncate">Contact: <strong className="text-foreground">{p.site_contact}</strong></span>}
                      {p.our_po && <span className="truncate">Our PO: <strong className="text-foreground">{p.our_po}</strong></span>}
                      {p.client_po && <span className="truncate">Client PO: <strong className="text-foreground">{p.client_po}</strong></span>}
                      {p.site_location && <span className="truncate sm:col-span-2">Location: <strong className="text-foreground">{p.site_location}</strong></span>}
                    </div>
                  )}

                  {/* System badges */}
                  {sysKeys.length > 0 && (
                    <div className="flex flex-wrap gap-1 pl-6">
                      {sysKeys.map((k) => (
                        <Badge key={k} variant="outline" className="text-xs px-1.5 py-0">
                          {labelFor(k)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>

    <ProjectDialog
      open={createOpen}
      onClose={() => setCreateOpen(false)}
      initial={blankProjectInput()}
      projectsCount={projects.length}
    />
    <ProjectDialog
      open={!!editProject}
      onClose={() => setEditProjectId(null)}
      initial={editProject ? {
        name: editProject.name,
        description: editProject.description,
        client_name: editProject.client_name,
        client_po: editProject.client_po,
        our_po: editProject.our_po,
        site_location: editProject.site_location,
        site_contact: editProject.site_contact,
      } : blankProjectInput()}
      projectId={editProjectId ?? undefined}
      projectsCount={projects.length}
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
