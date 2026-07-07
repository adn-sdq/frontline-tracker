import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { ChevronRight, LogOut, Menu, Search, UserCircle } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/contexts/AuthContext"
import { useProject } from "@/contexts/ProjectContext"
import { pageLabelFor } from "@/lib/navigation"
import { ORG_LABELS, ROLE_LABELS } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarContent } from "@/components/shell/AppSidebar"
import { CommandPalette } from "@/components/shell/CommandPalette"
import { ProfileDialog } from "@/components/ProfileDialog"

function initials(name?: string | null) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase()
}

function UserMenu() {
  const { profile, user, signOut } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const name = profile?.full_name ?? profile?.username ?? user?.email ?? "User"

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 px-1.5">
            <Avatar className="size-7">
              {profile?.avatar_url && (
                <AvatarImage src={profile.avatar_url} alt={name} className="object-cover" />
              )}
              <AvatarFallback className="bg-primary/10 text-primary text-xs uppercase">
                {initials(name)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col gap-1">
            <span className="truncate">{name}</span>
            <div className="flex flex-wrap items-center gap-1">
              {profile?.org && (
                <Badge variant="outline" className="h-4 w-fit px-1.5 text-[10px] font-normal">
                  {ORG_LABELS[profile.org] ?? profile.org}
                </Badge>
              )}
              {profile?.role && (
                <Badge variant="secondary" className="h-4 w-fit px-1.5 text-[10px] font-normal">
                  {ROLE_LABELS[profile.role] ?? profile.role}
                </Badge>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              // Defer until the dropdown has fully unmounted to avoid
              // Radix focus-trap conflicts between Dialog and DropdownMenu.
              setTimeout(() => setProfileOpen(true), 0)
            }}
          >
            <UserCircle className="size-4" /> My profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => { toast.success("Signed out"); void signOut() }}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="size-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {profile && (
        <ProfileDialog
          profile={profile}
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          canEditSelf
          isAdmin={profile.is_admin}
        />
      )}
    </>
  )
}

export function TopBar({
  actionsContainerRef,
}: {
  actionsContainerRef?: ((el: HTMLDivElement | null) => void) | null
}) {
  const { pathname } = useLocation()
  const { currentProject } = useProject()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const pageLabel = pageLabelFor(pathname)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-3 md:px-4">
        {/* Mobile menu */}
        <Button
          variant="ghost"
          size="icon"
          className="size-8 md:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="size-5" />
        </Button>

        {/* Breadcrumb */}
        <div className="hidden min-w-0 items-center gap-1 text-sm md:flex">
          {currentProject && (
            <>
              <span className="max-w-40 truncate text-muted-foreground">{currentProject.name}</span>
              {pageLabel && (
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />
              )}
            </>
          )}
          {pageLabel && <span className="truncate font-medium">{pageLabel}</span>}
        </div>

        {/* Global search */}
        <div className="flex flex-1 justify-center px-1">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex h-8 w-full max-w-xl items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground transition-colors hover:border-primary-hover"
          >
            <Search className="size-4 shrink-0" />
            <span className="flex-1 truncate text-left">Search pages, projects…</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">⌘ + K</span>
          </button>
        </div>

        {/* Right cluster: page actions + user */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Page-specific action buttons, injected per-page via <PageActions> portal */}
          <div ref={actionsContainerRef} className="flex items-center gap-1.5" />
          <div className="h-4 w-px bg-border/60" />
          <UserMenu />
        </div>
      </header>

      {/* Mobile nav sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  )
}
