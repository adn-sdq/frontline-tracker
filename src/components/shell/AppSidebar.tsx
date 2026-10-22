import { useState } from "react"
import { Link, NavLink, useMatch, useResolvedPath } from "react-router-dom"
import {
  BookOpen,
  ChevronsUpDown,
  LogOut,
  MessageSquareText,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCircle,
} from "lucide-react"
import { toast } from "sonner"

import { FitLogo } from "@/components/FitLogo"
import { ProfileDialog } from "@/components/ProfileDialog"
import { UserAvatar } from "@/components/UserAvatar"
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
import { useShell } from "@/contexts/ShellContext"
import { QuickActionsMenu } from "@/components/shell/QuickActionsMenu"
import { navSectionsFor, type NavItem } from "@/lib/navigation"
import { APP_VERSION } from "@/lib/version"
import { cn } from "@/lib/utils"

// ── "New" quick-create CTA ────────────────────────────────────────────────────

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
  // Radix Slot (asChild) merges classNames with string join — passing a function
  // className through it would stringify the function. Compute isActive manually
  // so we can always pass a plain string when inside TooltipTrigger asChild.
  const resolved = useResolvedPath(item.to)
  const match = useMatch({ path: resolved.pathname, end: item.to === "/" })
  const isActive = Boolean(match)

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
            className={cn(
              "grid size-9 place-items-center rounded-lg transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
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
  const { profile, signOut, superAdmin } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)

  if (!profile) return null
  const displayName = profile.full_name ?? profile.username ?? "Me"

  const avatar = (
    <UserAvatar
      name={displayName}
      src={profile.avatar_url}
      seed={profile.id}
      className="size-7 shrink-0"
      fallbackClassName="text-[10px]"
    />
  )

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {collapsed ? (
            <button
              type="button"
              aria-label={displayName}
              className="grid size-9 place-items-center rounded-full transition-colors hover:bg-sidebar-accent/50"
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
          {superAdmin && (
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              onClick={async () => {
                const next = !superAdmin.elevated
                try {
                  await superAdmin.setElevated(next)
                  toast.success(next ? "Admin privileges raised" : "Now browsing as a regular member")
                } catch (e) {
                  toast.error("Could not switch mode", { description: e instanceof Error ? e.message : undefined })
                }
              }}
            >
              <ShieldCheck className="size-4" />
              <span className="flex-1">Admin mode</span>
              <span
                aria-hidden
                className={cn(
                  "relative h-4 w-7 rounded-full transition-colors",
                  superAdmin.elevated ? "bg-primary" : "bg-muted-foreground/30"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 size-3 rounded-full bg-white shadow transition-all",
                    superAdmin.elevated ? "left-3.5" : "left-0.5"
                  )}
                />
              </span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/docs"><BookOpen className="size-4" /> Guides</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/changelog">
              <Sparkles className="size-4" /> <span className="flex-1">What's new</span>
              <span className="font-mono text-[10px] text-muted-foreground">{APP_VERSION}</span>
            </Link>
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
}: {
  onNavigate?: () => void
  collapsed?: boolean
}) {
  const { profile, accessRole } = useAuth()
  const { openSettings } = useShell()
  const sections = navSectionsFor(profile, accessRole)
  const feedbackActive = Boolean(useMatch("/updates"))

  const utility = [
    {
      key: "feedback",
      label: "Feedback",
      icon: MessageSquareText,
      active: feedbackActive,
      to: "/updates?tab=requests",
    },
    { key: "settings", label: "Settings", icon: Settings, active: false, onClick: () => openSettings() },
  ]

  return (
    <div className="flex h-full flex-col text-sidebar-foreground">
      {/* Brand */}
      <div className={cn("flex h-14 shrink-0 items-center", collapsed ? "justify-center" : "px-4")}>
        <Link
          to="/projects"
          onClick={onNavigate}
          aria-label="Home — all projects"
          title="Home"
          className="flex min-w-0 items-center gap-2.5 rounded-md outline-offset-4 transition-opacity hover:opacity-80"
        >
          <FitLogo size={collapsed ? 28 : 30} />
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <div className="text-sm font-semibold">FIT</div>
              <div className="truncate text-[10px] text-muted-foreground">Frontline Internal Tools</div>
            </div>
          )}
        </Link>
      </div>

      {/* Quick actions (create, all projects) */}
      <div className={cn("shrink-0 pb-1", collapsed ? "flex justify-center px-2" : "px-3")}>
        <QuickActionsMenu collapsed={collapsed} onNavigate={onNavigate} />
      </div>

      {/* Nav sections */}
      <nav
        className={cn(
          "flex-1 overflow-x-hidden overflow-y-auto py-2",
          collapsed ? "scrollbar-none flex flex-col items-center gap-1 px-2" : "px-3"
        )}
      >
        {sections.map((section, i) => (
          <div key={section.label ?? i} className={cn(collapsed ? "flex flex-col items-center gap-1" : i > 0 && "mt-5")}>
            {section.label && !collapsed && (
              <p className="mb-1 px-2.5 text-[11px] font-medium tracking-wide text-muted-foreground">{section.label}</p>
            )}
            {collapsed && i > 0 && <div className="my-1 h-px w-6 bg-sidebar-border" />}
            <div className={cn("flex flex-col gap-0.5", collapsed && "items-center gap-1")}>
              {section.items.map((item) => (
                <NavRow key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Feedback + Settings, then the profile */}
      <div className={cn("shrink-0 space-y-0.5 pt-2", collapsed ? "flex flex-col items-center px-2" : "px-3")}>
        {utility.map((u) => {
          const cls = cn(
            "flex items-center rounded-lg text-sm transition-colors",
            collapsed ? "size-9 justify-center" : "w-full gap-2 px-2.5 py-1.5",
            u.active ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50"
          )
          const inner = (
            <>
              <u.icon className={collapsed ? "size-4.5" : "size-4 shrink-0"} />
              {!collapsed && <span className="truncate">{u.label}</span>}
            </>
          )
          const el = u.to ? (
            <Link key={u.key} to={u.to} onClick={onNavigate} className={cls} aria-label={u.label}>{inner}</Link>
          ) : (
            <button key={u.key} type="button" onClick={() => { onNavigate?.(); u.onClick?.() }} className={cls} aria-label={u.label}>{inner}</button>
          )
          return collapsed ? (
            <Tooltip key={u.key}>
              <TooltipTrigger asChild>{el}</TooltipTrigger>
              <TooltipContent side="right">{u.label}</TooltipContent>
            </Tooltip>
          ) : (
            el
          )
        })}
      </div>
      <div className={cn("mt-1 shrink-0 border-t border-sidebar-border py-2.5", collapsed ? "flex justify-center px-2" : "px-3")}>
        <FooterProfile collapsed={collapsed} />
      </div>
    </div>
  )
}

// ── Desktop rail: a rounded panel floating beside the content ─────────────────

export function AppSidebar() {
  const { collapsed } = useShell()
  return (
    <aside
      className={cn(
        "hidden shrink-0 overflow-hidden rounded-xl border bg-sidebar shadow-sm transition-[width] duration-200 md:block",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <SidebarContent collapsed={collapsed} />
    </aside>
  )
}
