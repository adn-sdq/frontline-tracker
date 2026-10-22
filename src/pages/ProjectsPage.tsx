import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  ArrowRight,
  ChevronDown,
  Zap,
  BarChart3,
  Pin,
  Truck,
  Building2,
  ClipboardList,
  FileText,
  FolderOpen,
  Hash,
  LogOut,
  MapPin,
  Package,
  Phone,
  Plus,
  TicketIcon,
  UserCircle,
  Users,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useProject } from "@/contexts/ProjectContext"
import { useAllProjectMembers, useAllProjects, useProjectStats } from "@/hooks/useProjects"
import { useAllProfiles } from "@/hooks/useAdmin"
import { useProjectSystemKeys } from "@/hooks/useSystems"
import { useSystems } from "@/hooks/useSystems"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useHoverMenu } from "@/hooks/useHoverMenu"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FitLogo } from "@/components/FitLogo"
import { ProjectLogo } from "@/components/ProjectLogo"
import { Skeleton } from "@/components/ui/skeleton"
import { FullPageLoader, useMinDelay } from "@/components/shell/PageGate"
import type { AppPage, Project } from "@/lib/types"

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

// ── Project stat card (number + label) ──────────────────────────────────────
function StatCell({ value, label, icon: Icon }: { value: number | undefined; label: string; icon: typeof Package }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5">
        <Icon className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className="text-lg font-semibold tabular-nums">
        {value === undefined ? <Skeleton className="mt-0.5 h-6 w-8" /> : value}
      </span>
    </div>
  )
}

// ── Right pane: full project detail ─────────────────────────────────────────
function ProjectDetail({
  project,
  onOpen,
  onGo,
  isAdmin,
  profiles,
  memberships,
}: {
  project: Project
  onOpen: () => void
  onGo: (to: string) => void
  isAdmin: boolean
  profiles: ReturnType<typeof useAllProfiles>["data"]
  memberships: ReturnType<typeof useAllProjectMembers>["data"]
}) {
  const { labelFor } = useSystems()
  const { data: systemKeys = [] } = useProjectSystemKeys(project.id)
  const { data: stats } = useProjectStats(project.id)

  const members = (memberships ?? [])
    .filter((m) => m.project_id === project.id)
    .map((m) => (profiles ?? []).find((p) => p.id === m.user_id))
    .filter(Boolean)

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b px-8 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
          <ProjectLogo project={project} size={52} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="line-clamp-2 min-w-0 text-xl font-semibold tracking-tight break-words">{project.name}</h2>
              {!project.active && (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
            {project.description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
            )}
          </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <QuickActions onGo={onGo} />
            <Button size="sm" onClick={onOpen}>
              Open project <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-8 py-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCell value={stats?.items} label="Items" icon={Package} />
          <StatCell value={stats?.documents} label="Documents" icon={FileText} />
          <StatCell value={stats?.deliveryNotes} label="Delivery Notes" icon={ClipboardList} />
          <StatCell value={stats?.tickets} label="Tickets" icon={TicketIcon} />
        </div>

        <Separator />

        {/* Commercial details */}
        {(project.client_name || project.our_po || project.client_po || project.site_location || project.site_contact) && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Project Details
            </h3>
            <dl className="grid grid-cols-[minmax(80px,7rem)_1fr] gap-x-4 gap-y-2 text-sm">
              {project.client_name && (
                <>
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Building2 className="size-3.5 shrink-0" /> Client
                  </dt>
                  <dd className="font-medium">{project.client_name}</dd>
                </>
              )}
              {project.our_po && (
                <>
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Hash className="size-3.5 shrink-0" /> Our PO
                  </dt>
                  <dd className="font-mono text-xs font-semibold">{project.our_po}</dd>
                </>
              )}
              {project.client_po && (
                <>
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Hash className="size-3.5 shrink-0" /> Client PO
                  </dt>
                  <dd className="font-mono text-xs font-semibold">{project.client_po}</dd>
                </>
              )}
              {project.site_location && (
                <>
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" /> Location
                  </dt>
                  <dd>{project.site_location}</dd>
                </>
              )}
              {project.site_contact && (
                <>
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="size-3.5 shrink-0" /> Contact
                  </dt>
                  <dd>{project.site_contact}</dd>
                </>
              )}
            </dl>
          </div>
        )}

        {/* Systems */}
        {systemKeys.length > 0 && (
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Systems
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {systemKeys.map((k) => (
                <Badge key={k} variant="outline" className="font-mono text-xs">
                  {labelFor(k) || k}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Members — admin only */}
        {isAdmin && members.length > 0 && (
          <div className="space-y-2.5">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Users className="size-3.5" /> Team ({members.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <div
                  key={m!.id}
                  className="flex items-center gap-2 rounded-full border bg-muted/30 px-3 py-1"
                >
                  <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold uppercase text-primary">
                    {(m!.full_name ?? m!.username ?? "?").slice(0, 2)}
                  </div>
                  <span className="text-xs font-medium">{m!.full_name ?? m!.username}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Quick actions for the selected project (hover to see them) ──────────────
function QuickActions({ onGo }: { onGo: (to: string) => void }) {
  const { pageAccess, canEdit } = useAuth()
  const { open, setOpen, hoverProps } = useHoverMenu()
  const can = (p: AppPage) => pageAccess(p) !== "none"
  const groups = [
    {
      label: "Create",
      items: [
        { show: canEdit("tracker"), to: "/?new=1", icon: Plus, label: "Procurement item" },
        { show: canEdit("tracker"), to: "/delivery-notes?new=1", icon: Truck, label: "Delivery note" },
        { show: canEdit("documents"), to: "/documents?new=1", icon: FileText, label: "Document" },
        { show: can("tickets"), to: "/tickets?new=1", icon: TicketIcon, label: "Ticket" },
      ],
    },
    {
      label: "Go to",
      items: [
        { show: can("tracker"), to: "/", icon: Package, label: "Procurement" },
        { show: can("tracker"), to: "/delivery-notes", icon: ClipboardList, label: "Delivery notes" },
        { show: can("documents"), to: "/documents", icon: FileText, label: "Documentation" },
        { show: can("dashboard"), to: "/dashboard", icon: BarChart3, label: "Dashboard" },
      ],
    },
  ]
    .map((g) => ({ ...g, items: g.items.filter((i) => i.show) }))
    .filter((g) => g.items.length)
  if (!groups.length) return null
  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild {...hoverProps}>
        <Button variant="outline" size="sm" className="h-8">
          <Zap className="size-3.5" /> Quick actions <ChevronDown className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56" {...hoverProps}>
        {groups.map((g, gi) => (
          <div key={g.label}>
            {gi > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">{g.label}</DropdownMenuLabel>
            {g.items.map((i) => (
              <DropdownMenuItem key={i.label} onClick={() => onGo(i.to)}>
                <i.icon className="size-4" /> {i.label}
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ── Compact project row in the left list ────────────────────────────────────
function ProjectRow({
  project,
  selected,
  onClick,
}: {
  project: Project
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex h-16 w-full shrink-0 items-center gap-3 rounded-lg border px-3 text-left transition-colors ${
        selected ? "border-primary/30 bg-primary/8" : "border-transparent hover:bg-muted/60"
      }`}
    >
      <ProjectLogo project={project} size={36} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{project.name}</span>
          {!project.active && (
            <Badge variant="secondary" className="shrink-0 text-[10px]">Inactive</Badge>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">{project.description || project.client_name || "\u00a0"}</p>
      </div>
      <ArrowRight className={`size-4 shrink-0 transition-opacity ${selected ? "text-primary opacity-100" : "opacity-0"}`} />
    </button>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const { profile, accessRole, user, signOut } = useAuth()
  const { projects, loading, setCurrentProject } = useProject()
  const navigate = useNavigate()
  const isAdmin = !!profile?.is_admin

  // Admin-only data (silently empty for non-admins)
  const { data: allProjects = [], isLoading: l1 } = useAllProjects()
  const { data: profiles = [], isLoading: l2 } = useAllProfiles()
  const { data: memberships = [], isLoading: l3 } = useAllProjectMembers()
  const minDone = useMinDelay()

  const [pickedId, setPickedId] = useState<string | null>(null)

  const name = profile?.full_name ?? profile?.username ?? user?.email ?? "User"
  const firstName = name.split(" ")[0]

  // For display: admins see all projects, members see assigned projects
  const displayProjects = isAdmin ? allProjects : projects
  // Nothing selected until you pick one; clicking the selected project again clears it.
  // The panes have a fixed height, so selecting or clearing never shifts the layout.
  const selectedProject = displayProjects.find((p) => p.id === pickedId) ?? null
  const selectedId = selectedProject?.id ?? null
  // Admin-pinned projects (max 5) sit at the top, in the order they were pinned.
  const pinned = displayProjects
    .filter((p) => p.pinned_at)
    .sort((a, b) => (a.pinned_at ?? "").localeCompare(b.pinned_at ?? ""))
  const unpinned = displayProjects.filter((p) => !p.pinned_at)

  function go(projectId: string, to: string) {
    setCurrentProject(projectId)
    navigate(to)
  }

  function open(id: string) {
    setCurrentProject(id)
    navigate("/", { replace: true })
  }

  if (loading || !minDone || (isAdmin && (l1 || l2 || l3))) return <FullPageLoader />

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-5">
          <Link to="/projects" aria-label="Home" className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-80">
            <FitLogo size={28} />
            <div className="leading-tight">
              <div className="text-sm font-semibold">FIT</div>
              <div className="hidden text-[10px] text-muted-foreground sm:block">Frontline Internal Tools</div>
            </div>
          </Link>
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            {profile && (
              <div className="flex min-w-0 items-center gap-2 rounded-full border bg-muted/40 px-2.5 py-1 sm:px-3">
                <UserCircle className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 truncate text-xs font-medium">{name}</span>
                <Badge variant="secondary" className="h-4 max-w-24 shrink-0 truncate px-1.5 text-[10px]">
                  {profile.is_admin ? "Admin" : accessRole?.name ?? "No access"}
                </Badge>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 px-2 text-muted-foreground sm:px-3"
              onClick={() => void signOut()}
              aria-label="Sign out"
            >
              <LogOut className="size-4" /> <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-5 py-8">
        {/* Hero */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
              {greeting()}
            </p>
            <h1 className="mt-1.5 text-3xl font-semibold tracking-tight">
              Welcome back, {firstName}.
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Select a project to open its workspace.
            </p>
          </div>
          {isAdmin && (
            <Button
              size="sm"
              onClick={() => navigate("/admin")}
              variant="outline"
            >
              <Plus className="size-4" /> New project
            </Button>
          )}
        </div>

        {displayProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card py-20 text-center">
            <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FolderOpen className="size-7" />
            </div>
            <div>
              <p className="font-semibold">No projects assigned yet</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                An admin needs to assign you to a project before you can start.
                {isAdmin && " Create one in the Admin console."}
              </p>
            </div>
            {isAdmin && (
              <Button size="sm" onClick={() => navigate("/admin")}>
                Go to Admin
              </Button>
            )}
          </div>
        ) : (
          /* Two-pane layout */
          <div className="flex flex-col gap-4 lg:h-[clamp(28rem,calc(100svh-15rem),44rem)] lg:flex-row lg:gap-0 lg:overflow-hidden lg:rounded-xl lg:border">
            {/* Left pane — project list */}
            <div className="flex w-full flex-col lg:min-h-0 lg:w-80 lg:shrink-0 lg:border-r">
              <div className="shrink-0 border-b px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Projects ({displayProjects.length})
                </span>
              </div>
              <div className="flex max-h-80 flex-col gap-1 overflow-y-auto p-2 lg:max-h-none lg:flex-1">
                {pinned.length > 0 && (
                  <div className="flex items-center gap-1.5 px-2 pt-1 pb-0.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                    <Pin className="size-3" /> Pinned
                  </div>
                )}
                {[...pinned, ...unpinned].map((p, i) => (
                  <div key={p.id}>
                    {pinned.length > 0 && i === pinned.length && (
                      <div className="px-2 pt-2 pb-0.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">All projects</div>
                    )}
                    <ProjectRow
                      project={p}
                      selected={selectedId === p.id}
                      onClick={() => setPickedId(p.id === pickedId ? null : p.id)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Right pane — detail or empty state */}
            <div className={`min-w-0 rounded-xl border lg:block lg:min-h-0 lg:flex-1 lg:rounded-none lg:border-0 ${selectedProject ? "" : "hidden"}`}>
              {selectedProject ? (
                <ProjectDetail
                  project={selectedProject}
                  onOpen={() => open(selectedProject.id)}
                  onGo={(to) => go(selectedProject.id, to)}
                  isAdmin={isAdmin}
                  profiles={profiles}
                  memberships={memberships}
                />
              ) : (
                <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                  <FolderOpen className="size-8 opacity-30" />
                  <p className="text-sm">Select a project to see details</p>
                  <p className="text-xs">Click it again to clear the selection.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
