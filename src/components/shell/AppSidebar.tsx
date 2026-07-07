import { useState } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"
import {
  Check,
  ChevronsUpDown,
  ClipboardList,
  FileText,
  FolderOpen,
  LayoutGrid,
  LifeBuoy,
  LogOut,
  Moon,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Sun,
  UserCircle,
} from "lucide-react"
import { toast } from "sonner"

import { FitLogo } from "@/components/FitLogo"
import { ProfileDialog } from "@/components/ProfileDialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/contexts/AuthContext"
import { useProject } from "@/contexts/ProjectContext"
import { useTheme } from "@/hooks/useTheme"
import { navSectionsFor, type NavItem } from "@/lib/navigation"
import { APP_VERSION } from "@/lib/version"
import { cn } from "@/lib/utils"

const COLLAPSE_KEY = "sidebar_collapsed"

function initials(name?: string | null) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase()
}

// ── Project switcher ──────────────────────────────────────────────────────────

function ProjectSwitcher({ collapsed }: { collapsed?: boolean }) {
  const { projects, currentProject, currentProjectId, setCurrentProject } = useProject()

  function switchProject(id: string) {
    const p = projects.find((p) => p.id === id)
    setCurrentProject(id)
    if (p) toast.success(`Switched to ${p.name}`)
  }

  const menu = (
    <DropdownMenuContent align="start" side={collapsed ? "right" : "bottom"} className="w-56">
      <DropdownMenuLabel>Switch project</DropdownMenuLabel>
      <DropdownMenuSeparator />
      {projects.map((p) => (
        <DropdownMenuItem key={p.id} onClick={() => switchProject(p.id)} className="gap-2">
          <FolderOpen className="size-4 text-muted-foreground" />
          <span className="flex-1 truncate">{p.name}</span>
          {p.id === currentProjectId && <Check className="size-4 text-primary" />}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  )

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={currentProject?.name ?? "Select project"}
            className="grid size-9 place-items-center rounded-sm border border-input bg-background transition-colors hover:bg-accent"
          >
            <FolderOpen className="size-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        {menu}
      </DropdownMenu>
    )
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
      {menu}
    </DropdownMenu>
  )
}

// ── "New" quick-create CTA ────────────────────────────────────────────────────

function NewMenu({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
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
        {collapsed ? (
          <button
            type="button"
            aria-label="New"
            className="grid size-9 place-items-center rounded-md bg-brand-muted text-brand-muted-foreground transition-colors hover:bg-brand/15"
          >
            <Plus className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            className="flex h-9 w-full items-center gap-2 rounded-md bg-brand-muted px-3 text-sm font-semibold text-brand-muted-foreground transition-colors hover:bg-brand/15"
          >
            <Plus className="size-4" /> New
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side={collapsed ? "right" : "bottom"} className="w-52">
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

// ── Nav row ───────────────────────────────────────────────────────────────────

function NavRow({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const Icon = item.icon

  if (collapsed) {
    if (item.soon) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="grid size-9 cursor-default place-items-center rounded-md text-sidebar-foreground/40">
              <Icon className="size-4.5" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">{item.label} · Soon</TooltipContent>
        </Tooltip>
      )
    }
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <NavLink
            to={item.to}
            end={item.to === "/"}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "grid size-9 place-items-center rounded-md transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )
            }
          >
            <Icon className="size-4.5" />
          </NavLink>
        </TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    )
  }

  if (item.soon) {
    return (
      <div className="flex cursor-default items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-sidebar-foreground/45">
        <Icon className="size-4 shrink-0" />
        <span className="flex-1 truncate">{item.label}</span>
        <Badge
          variant="outline"
          className="h-4 px-1.5 text-[10px] font-normal text-muted-foreground"
        >
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

// ── Footer profile (dropdown: my profile + sign out) ──────────────────────────

function FooterProfile({ collapsed }: { collapsed?: boolean }) {
  const { profile, signOut } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)

  if (!profile) return null
  const displayName = profile.full_name ?? profile.username ?? "Me"

  const avatar = (
    <Avatar className="size-7 shrink-0">
      {profile.avatar_url && (
        <AvatarImage src={profile.avatar_url} alt={displayName} className="object-cover" />
      )}
      <AvatarFallback className="bg-primary/10 text-[10px] font-semibold uppercase text-primary">
        {initials(displayName)}
      </AvatarFallback>
    </Avatar>
  )

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {collapsed ? (
            <button
              type="button"
              aria-label={displayName}
              className="grid size-9 place-items-center rounded-md transition-colors hover:bg-sidebar-accent/50"
            >
              {avatar}
            </button>
          ) : (
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent/50"
            >
              {avatar}
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-xs font-semibold text-sidebar-foreground">
                  {displayName}
                </div>
                {profile.username && (
                  <div className="truncate text-[10px] text-muted-foreground">
                    @{profile.username}
                  </div>
                )}
              </div>
              <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground/50" />
            </button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={collapsed ? "start" : "end"}
          side={collapsed ? "right" : "top"}
          className="w-56"
        >
          <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              // Defer until the dropdown has fully closed to avoid the Radix
              // Dialog + DropdownMenu focus-trap race.
              setTimeout(() => setProfileOpen(true), 0)
            }}
          >
            <UserCircle className="size-4" /> My profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              toast.success("Signed out")
              void signOut()
            }}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="size-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileDialog
        profile={profile}
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        canEditSelf
        isAdmin={profile.is_admin}
      />
    </>
  )
}

// ── Sidebar content (shared by desktop rail and mobile sheet) ─────────────────

export function SidebarContent({
  onNavigate,
  collapsed,
  onToggleCollapse,
}: {
  onNavigate?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}) {
  const { profile } = useAuth()
  const { dark, toggle } = useTheme()
  const sections = navSectionsFor(profile)

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand + collapse toggle */}
      {collapsed ? (
        <div className="flex h-14 shrink-0 flex-col items-center justify-center">
          <FitLogo size={28} />
        </div>
      ) : (
        <div className="flex h-14 shrink-0 items-center gap-2.5 px-3">
          <FitLogo size={30} />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="text-sm font-semibold">FIT</div>
            <div className="truncate text-[10px] text-muted-foreground">Frontline Tracker</div>
          </div>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Collapse sidebar"
              className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-foreground"
            >
              <PanelLeftClose className="size-4" />
            </button>
          )}
        </div>
      )}

      {collapsed && onToggleCollapse && (
        <div className="flex justify-center pb-1">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-foreground"
          >
            <PanelLeftOpen className="size-4" />
          </button>
        </div>
      )}

      {/* Project + quick create */}
      <div className={cn("flex flex-col gap-2 pb-2", collapsed ? "items-center px-2" : "px-3")}>
        <ProjectSwitcher collapsed={collapsed} />
        <NewMenu collapsed={collapsed} onNavigate={onNavigate} />
      </div>

      {/* Nav sections */}
      <nav className={cn("flex-1 overflow-y-auto py-2", collapsed ? "px-2" : "px-3")}>
        {sections.map((section, i) => (
          <div key={section.label ?? i} className={cn(i > 0 && "mt-4")}>
            {section.label && !collapsed && (
              <p className="mb-1 px-2.5 text-xs font-normal text-muted-foreground">
                {section.label}
              </p>
            )}
            {section.label && collapsed && i > 0 && (
              <div className="mx-auto mb-2 h-px w-6 bg-sidebar-border" />
            )}
            <div className={cn("flex flex-col gap-0.5", collapsed && "items-center")}>
              {section.items.map((item) => (
                <NavRow
                  key={item.to}
                  item={item}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        className={cn(
          "shrink-0 space-y-0.5 border-t border-sidebar-border py-2.5",
          collapsed ? "flex flex-col items-center gap-0.5 px-2" : "px-3"
        )}
      >
        <FooterProfile collapsed={collapsed} />

        {/* Updates */}
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink
                to="/updates"
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "grid size-9 place-items-center rounded-md transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )
                }
              >
                <Newspaper className="size-4.5" />
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">Updates</TooltipContent>
          </Tooltip>
        ) : (
          <NavLink
            to="/updates"
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )
            }
          >
            <Newspaper className="size-4 shrink-0" /> Updates
          </NavLink>
        )}

        {/* Meta row — theme toggle sits minimally alongside Docs + version */}
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggle}
                aria-label={dark ? "Light mode" : "Dark mode"}
                className="grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-foreground"
              >
                {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{dark ? "Light mode" : "Dark mode"}</TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-2 px-2.5 py-1 text-[11px] text-muted-foreground">
            <Link to="/docs" onClick={onNavigate} className="transition-colors hover:text-foreground">
              Docs
            </Link>
            <button
              type="button"
              onClick={toggle}
              aria-label={dark ? "Light mode" : "Dark mode"}
              className="grid size-6 place-items-center rounded transition-colors hover:text-foreground"
            >
              {dark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            </button>
            <span className="ml-auto font-mono">{APP_VERSION}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Desktop rail ──────────────────────────────────────────────────────────────

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(COLLAPSE_KEY) === "1"
  )

  function toggleCollapse() {
    setCollapsed((c) => {
      const next = !c
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0")
      return next
    })
  }

  return (
    <aside
      className={cn(
        "hidden shrink-0 border-r border-sidebar-border transition-[width] duration-200 md:block",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <SidebarContent collapsed={collapsed} onToggleCollapse={toggleCollapse} />
    </aside>
  )
}
