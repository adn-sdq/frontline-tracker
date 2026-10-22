import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Archive,
  ArchiveRestore,
  ArrowRight,
  Building2,
  ClipboardList,
  FileText,
  FolderOpen,
  Hash,
  LifeBuoy,
  Maximize2,
  MapPin,
  MoreHorizontal,
  Package,
  Pencil,
  Pin,
  PinOff,
  Phone,
  Plus,
  Search,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { useConfirm } from "@/components/ui/confirm-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { avatarColor, UserAvatar } from "@/components/UserAvatar"
import { ProjectDialog, blankProjectInput } from "@/components/admin/ProjectDialog"
import { ProjectFullView } from "@/components/admin/ProjectFullView"
import { ProjectLogo } from "@/components/ProjectLogo"
import { displayName } from "@/components/profile/shared"
import { useProject } from "@/contexts/ProjectContext"
import { useAllProfiles } from "@/hooks/useAdmin"
import { useAllProjectMembers, useAllProjects, useProjectStats, useUpdateProject } from "@/hooks/useProjects"
import { useAllProjectSystems, useSystems } from "@/hooks/useSystems"
import { cn, errorMessage } from "@/lib/utils"
import type { Profile, Project } from "@/lib/types"

type Filter = "active" | "archived" | "all"
const MAX_AVATARS = 5

function Stat({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: number | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <Icon className="size-3" /> {label}
      </span>
      {value === undefined ? <Skeleton className="h-5 w-7" /> : <span className="text-base font-semibold tabular-nums">{value}</span>}
    </div>
  )
}

function ProjectCard({
  project: p,
  systems,
  members,
  onEdit,
  onToggleActive,
  onView,
  onOpenWorkspace,
  onTogglePin,
}: {
  project: Project
  systems: string[]
  members: Profile[]
  onEdit: () => void
  onToggleActive: () => void
  onView: () => void
  onOpenWorkspace: () => void
  onTogglePin: () => void
}) {
  const { data: stats } = useProjectStats(p.id)
  const { labelFor } = useSystems()

  const details = [
    { icon: Building2, label: "Client", value: p.client_name },
    { icon: MapPin, label: "Location", value: p.site_location },
    { icon: Phone, label: "Site contact", value: p.site_contact },
    { icon: Hash, label: "Our PO", value: p.our_po },
    { icon: Hash, label: "Client PO", value: p.client_po },
  ].filter((d) => d.value)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onView}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault()
          onView()
        }
      }}
      className={cn(
        "group flex cursor-pointer flex-col overflow-hidden rounded-lg border bg-card text-left transition-shadow outline-none hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring",
        !p.active && "opacity-75"
      )}
    >
      {/* Accent strip — colour derived from the project id so each card is recognisable */}
      <div className={cn("h-1", avatarColor(p.id).split(" ").find((c) => c.startsWith("bg-")))} />

      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-3">
            <ProjectLogo project={p} size={40} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="truncate font-semibold">{p.name}</h3>
                {p.pinned_at && <Pin className="size-3.5 shrink-0 fill-current text-primary" aria-label="Pinned" />}
                {p.code && <Badge variant="outline" className="px-1.5 py-0 font-mono text-[10px]" title="SKU abbreviation">{p.code}</Badge>}
                <Badge
                  className={cn(
                    "border-transparent text-[10px]",
                    p.active
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {p.active ? "Active" : "Archived"}
                </Badge>
              </div>
              {p.description ? (
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
              ) : (
                <p className="mt-0.5 text-xs text-muted-foreground/60">No description</p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7 shrink-0" aria-label="Project actions" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={onView}><Maximize2 className="size-4" /> View full screen</DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenWorkspace}><ArrowRight className="size-4" /> Open workspace</DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}><Pencil className="size-4" /> Edit details</DropdownMenuItem>
              <DropdownMenuItem onClick={onTogglePin}>
                {p.pinned_at ? <><PinOff className="size-4" /> Unpin from home</> : <><Pin className="size-4" /> Pin to home</>}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onToggleActive}>
                {p.active ? <><Archive className="size-4" /> Archive</> : <><ArchiveRestore className="size-4" /> Restore</>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 rounded-md bg-muted/40 px-3 py-2.5">
          <Stat icon={Package} label="Items" value={stats?.items} />
          <Stat icon={FileText} label="Docs" value={stats?.documents} />
          <Stat icon={ClipboardList} label="DNs" value={stats?.deliveryNotes} />
          <Stat icon={LifeBuoy} label="Tickets" value={stats?.tickets} />
        </div>

        {/* Details */}
        {details.length > 0 ? (
          <dl className="grid gap-1.5 text-xs">
            {details.map((d) => (
              <div key={d.label} className="flex items-center gap-2 min-w-0">
                <d.icon className="size-3.5 shrink-0 text-muted-foreground" />
                <dt className="w-20 shrink-0 text-muted-foreground">{d.label}</dt>
                <dd className="truncate font-medium">{d.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <button type="button" onClick={(e) => { e.stopPropagation(); onEdit() }} className="rounded-md border border-dashed px-3 py-2 text-left text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground">
            Add client, PO and site details — they pre-fill delivery notes and items.
          </button>
        )}

        {/* Systems */}
        {systems.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {systems.map((k) => (
              <Badge key={k} variant="outline" className="px-1.5 py-0 text-[10px]">{labelFor(k)}</Badge>
            ))}
          </div>
        )}

        {/* Footer: team + open */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
          {members.length === 0 ? (
            <span className="text-xs text-muted-foreground">No members — admins only</span>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <div className="flex -space-x-1.5">
                    {members.slice(0, MAX_AVATARS).map((m) => (
                      <UserAvatar key={m.id} name={displayName(m)} src={m.avatar_url} seed={m.id} className="size-6 ring-2 ring-card" fallbackClassName="text-[9px]" />
                    ))}
                  </div>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {members.length} member{members.length > 1 ? "s" : ""}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-64">{members.map(displayName).join(", ")}</TooltipContent>
            </Tooltip>
          )}
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
            View <Maximize2 className="size-3.5" />
          </span>
        </div>
      </div>
    </div>
  )
}

export function AdminProjectsTab() {
  const navigate = useNavigate()
  const confirm = useConfirm()
  const { setCurrentProject } = useProject()
  const { data: projects = [], isLoading } = useAllProjects()
  const { data: profiles = [] } = useAllProfiles()
  const { data: memberships = [] } = useAllProjectMembers()
  const { data: projectSystems = [] } = useAllProjectSystems()
  const update = useUpdateProject()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<Filter>("active")
  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [viewId, setViewId] = useState<string | null>(null)

  const systemsBy = useMemo(() => {
    const m: Record<string, string[]> = {}
    for (const r of projectSystems) (m[r.project_id] ??= []).push(r.system_key)
    return m
  }, [projectSystems])
  const membersBy = useMemo(() => {
    const byId = new Map(profiles.map((p) => [p.id, p]))
    const m: Record<string, Profile[]> = {}
    for (const r of memberships) {
      const p = byId.get(r.user_id)
      if (p) (m[r.project_id] ??= []).push(p)
    }
    return m
  }, [profiles, memberships])

  const counts = { active: projects.filter((p) => p.active).length, archived: projects.filter((p) => !p.active).length, all: projects.length }
  const q = search.trim().toLowerCase()
  const shown = projects.filter((p) => {
    if (filter === "active" && !p.active) return false
    if (filter === "archived" && p.active) return false
    return !q || [p.name, p.client_name, p.site_location, p.our_po, p.client_po, p.description].some((v) => v?.toLowerCase().includes(q))
  })

  const editProject = projects.find((p) => p.id === editId) ?? null
  const viewProject = projects.find((p) => p.id === viewId) ?? null

  function openWorkspace(id: string) {
    setCurrentProject(id)
    navigate("/")
  }

  const pinnedCount = projects.filter((p) => p.pinned_at).length

  async function togglePin(p: Project) {
    if (!p.pinned_at && pinnedCount >= 5) {
      return toast.error("You can pin up to 5 projects", { description: "Unpin one first." })
    }
    try {
      await update.mutateAsync({ id: p.id, patch: { pinned_at: p.pinned_at ? null : new Date().toISOString() } })
      toast.success(p.pinned_at ? "Unpinned from the home page" : "Pinned to the top of the home page")
    } catch (e) {
      toast.error("Could not update", { description: errorMessage(e) })
    }
  }

  async function toggleActive(p: Project) {
    if (p.active) {
      const ok = await confirm({
        title: `Archive ${p.name}?`,
        description: "It disappears from project pickers. All data is kept and you can restore it any time.",
        confirmText: "Archive",
      })
      if (!ok) return
    }
    try {
      await update.mutateAsync({ id: p.id, patch: { active: !p.active } })
      toast.success(p.active ? "Project archived" : "Project restored")
    } catch (e) {
      toast.error("Could not update", { description: errorMessage(e) })
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, client, PO, location…" className="pl-8" />
        </div>
        <div className="inline-flex rounded-sm border p-0.5" role="radiogroup" aria-label="Project status">
          {(["active", "archived", "all"] as const).map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-[2px] px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f} <span className="opacity-70">({counts[f]})</span>
            </button>
          ))}
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> New project
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Spinner className="size-5" /></div>
      ) : shown.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={projects.length === 0 ? "No projects yet" : "No projects match"}
          description={projects.length === 0 ? "Create a project to start tracking items, documents and deliveries." : undefined}
          action={projects.length === 0 ? <Button onClick={() => setCreateOpen(true)}><Plus className="size-4" /> New project</Button> : undefined}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              systems={systemsBy[p.id] ?? []}
              members={membersBy[p.id] ?? []}
              onEdit={() => setEditId(p.id)}
              onToggleActive={() => toggleActive(p)}
              onView={() => setViewId(p.id)}
              onOpenWorkspace={() => openWorkspace(p.id)}
              onTogglePin={() => togglePin(p)}
            />
          ))}
        </div>
      )}

      <ProjectFullView
        project={viewProject}
        systems={viewProject ? systemsBy[viewProject.id] ?? [] : []}
        members={viewProject ? membersBy[viewProject.id] ?? [] : []}
        onClose={() => setViewId(null)}
        onEdit={() => viewProject && setEditId(viewProject.id)}
        onToggleActive={() => viewProject && toggleActive(viewProject)}
        onOpenWorkspace={() => viewProject && openWorkspace(viewProject.id)}
      />
      <ProjectDialog open={createOpen} onClose={() => setCreateOpen(false)} initial={blankProjectInput()} projectsCount={projects.length} />
      <ProjectDialog
        open={!!editProject}
        onClose={() => setEditId(null)}
        initial={
          editProject
            ? {
                name: editProject.name,
                code: editProject.code ?? "",
                description: editProject.description,
                client_name: editProject.client_name,
                client_po: editProject.client_po,
                our_po: editProject.our_po,
                site_location: editProject.site_location,
                site_contact: editProject.site_contact,
              }
            : blankProjectInput()
        }
        projectId={editId ?? undefined}
        projectsCount={projects.length}
        logoUrl={editProject?.logo_url}
      />
    </div>
  )
}
