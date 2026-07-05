import { Link, NavLink, useNavigate } from "react-router-dom"
import {
  Check,
  ChevronsUpDown,
  ClipboardList,
  FileText,
  FolderOpen,
  LayoutGrid,
  LifeBuoy,
  Lightbulb,
  Plus,
} from "lucide-react"
import { toast } from "sonner"

import { FitLogo } from "@/components/FitLogo"
import { useAuth } from "@/contexts/AuthContext"
import { useProject } from "@/contexts/ProjectContext"
import { navSectionsFor, type NavItem } from "@/lib/navigation"
import { APP_VERSION } from "@/lib/version"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ── Project switcher (workspace-style, full-width) ───────────────────────────

function ProjectSwitcher() {
  const { projects, currentProject, currentProjectId, setCurrentProject } = useProject()
  const navigate = useNavigate()

  function switchProject(id: string) {
    const p = projects.find((p) => p.id === id)
    setCurrentProject(id)
    if (p) toast.success(`Switched to ${p.name}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-8 w-full items-center gap-2 rounded-sm border border-input bg-background px-2.5 text-left text-sm transition-colors hover:bg-accent"
        >
          <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate font-medium">
            {currentProject?.name ?? "Select project"}
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Projects</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {projects.map((p) => (
          <DropdownMenuItem key={p.id} onClick={() => switchProject(p.id)} className="gap-2">
            <FolderOpen className="size-4 text-muted-foreground" />
            <span className="flex-1 truncate">{p.name}</span>
            {p.id === currentProjectId && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/projects")}>
          <LayoutGrid className="size-4" /> All projects
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ── "New" quick-create CTA ────────────────────────────────────────────────────

function NewMenu({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const sections = navSectionsFor(profile)
  const reachable = new Set(sections.flatMap((s) => s.items.filter((i) => !i.soon).map((i) => i.to)))

  function go(to: string) {
    navigate(to)
    onNavigate?.()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-9 w-full items-center gap-2 rounded-md bg-brand-muted px-3 text-sm font-semibold text-brand-muted-foreground transition-colors hover:bg-brand/15"
        >
          <Plus className="size-4" /> New
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {reachable.has("/") && (
          <DropdownMenuItem onClick={() => go("/")}>
            <LayoutGrid className="size-4" /> Tracker item
          </DropdownMenuItem>
        )}
        {reachable.has("/delivery-notes") && (
          <DropdownMenuItem onClick={() => go("/delivery-notes")}>
            <ClipboardList className="size-4" /> Delivery note
          </DropdownMenuItem>
        )}
        {reachable.has("/documents") && (
          <DropdownMenuItem onClick={() => go("/documents")}>
            <FileText className="size-4" /> Document
          </DropdownMenuItem>
        )}
        {reachable.has("/tickets") && (
          <DropdownMenuItem onClick={() => go("/tickets")}>
            <LifeBuoy className="size-4" /> Ticket
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ── Nav rows ──────────────────────────────────────────────────────────────────

function NavRow({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon
  if (item.soon) {
    return (
      <div className="flex cursor-default items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-sidebar-foreground/45">
        <Icon className="size-4 shrink-0" />
        <span className="flex-1 truncate">{item.label}</span>
        <Badge variant="outline" className="h-4 px-1.5 text-[10px] font-normal text-muted-foreground">
          Soon
        </Badge>
      </div>
    )
  }
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors",
          isActive
            ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
            : "font-normal text-sidebar-foreground hover:bg-sidebar-accent/50"
        )
      }
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </NavLink>
  )
}

// ── Sidebar content (shared by desktop rail and mobile sheet) ─────────────────

export function SidebarContent({
  onNavigate,
  onRequestFeature,
}: {
  onNavigate?: () => void
  onRequestFeature?: () => void
}) {
  const { profile } = useAuth()
  const sections = navSectionsFor(profile)

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 px-4">
        <FitLogo size={30} />
        <div className="leading-tight">
          <div className="text-sm font-semibold">FIT</div>
          <div className="text-[10px] text-muted-foreground">Frontline Tracker</div>
        </div>
      </div>

      {/* Project + quick create */}
      <div className="flex flex-col gap-2 px-3 pb-2">
        <ProjectSwitcher />
        <NewMenu onNavigate={onNavigate} />
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {sections.map((section, i) => (
          <div key={section.label ?? i} className={cn(i > 0 && "mt-4")}>
            {section.label && (
              <p className="mb-1 px-2.5 text-xs font-normal text-muted-foreground">
                {section.label}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <NavRow key={item.to} item={item} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-sidebar-border px-3 py-3">
        {onRequestFeature && (
          <button
            type="button"
            onClick={onRequestFeature}
            className="mb-1 flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            <Lightbulb className="size-4" /> Request a feature
          </button>
        )}
        <div className="flex items-center gap-2 px-2.5 text-[11px] text-muted-foreground">
          <Link to="/docs" onClick={onNavigate} className="transition-colors hover:text-foreground">
            Docs
          </Link>
          <span className="text-muted-foreground/40">·</span>
          <Link to="/changelog" onClick={onNavigate} className="transition-colors hover:text-foreground">
            Changelog
          </Link>
          <span className="ml-auto font-mono">{APP_VERSION}</span>
        </div>
      </div>
    </div>
  )
}

// ── Desktop rail ──────────────────────────────────────────────────────────────

export function AppSidebar({ onRequestFeature }: { onRequestFeature?: () => void }) {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-sidebar-border md:block">
      <SidebarContent onRequestFeature={onRequestFeature} />
    </aside>
  )
}
