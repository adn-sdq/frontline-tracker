import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { ChevronRight, LogOut, Menu, Moon, Search, Sun, UserCircle } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/contexts/AuthContext"
import { useProject } from "@/contexts/ProjectContext"
import { useTheme } from "@/hooks/useTheme"
import { pageLabelFor } from "@/lib/navigation"
import { ORG_LABELS, ROLE_LABELS } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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
                <Badge variant="outline" className="w-fit text-[10px] font-normal h-4 px-1.5">
                  {ORG_LABELS[profile.org] ?? profile.org}
                </Badge>
              )}
              {profile?.role && (
                <Badge variant="secondary" className="w-fit text-[10px] font-normal h-4 px-1.5">
                  {ROLE_LABELS[profile.role] ?? profile.role}
                </Badge>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setProfileOpen(true)}>
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

      {profile && (
        <ProfileDialog
          profile={profile}
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          canEditSelf
        />
      )}
    </>
  )
}

export function TopBar({ onRequestFeature }: { onRequestFeature?: () => void }) {
  const { pathname } = useLocation()
  const { currentProject } = useProject()
  const { dark, toggle } = useTheme()
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
        <Button variant="ghost" size="icon" className="size-8 md:hidden" onClick={() => setMobileOpen(true)}>
          <Menu className="size-5" />
        </Button>

        {/* Breadcrumb */}
        <div className="hidden min-w-0 items-center gap-1 text-sm md:flex">
          {currentProject && (
            <>
              <span className="max-w-40 truncate text-muted-foreground">{currentProject.name}</span>
              {pageLabel && <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />}
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

        {/* Right cluster */}
        <div className="flex shrink-0 items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={toggle}>
                {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{dark ? "Switch to light mode" : "Switch to dark mode"}</TooltipContent>
          </Tooltip>
          <UserMenu />
        </div>
      </header>

      {/* Mobile nav sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent
            onNavigate={() => setMobileOpen(false)}
            onRequestFeature={() => {
              setMobileOpen(false)
              onRequestFeature?.()
            }}
          />
        </SheetContent>
      </Sheet>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  )
}
