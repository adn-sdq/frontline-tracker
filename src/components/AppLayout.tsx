import { useEffect, useState, type ReactNode } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import {
  BarChart3,
  Check,
  ChevronsUpDown,
  FileText,
  FolderOpen,
  KeyRound,
  LayoutGrid,
  LogOut,
  Moon,
  PackageCheck,
  Shield,
  Sun,
} from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/contexts/AuthContext"
import { useProject } from "@/contexts/ProjectContext"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { ORG_LABELS, type AppPage } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Loader2 } from "lucide-react"

function useTheme() {
  const [dark, setDark] = useState(
    () => localStorage.getItem("ft-theme") === "dark"
  )
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    localStorage.setItem("ft-theme", dark ? "dark" : "light")
  }, [dark])
  return { dark, toggle: () => setDark((d) => !d) }
}

function initials(name?: string | null) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")
}

// Returns which pages this profile is allowed to see.
// Admins always see everything. Firstfix always only documents.
// Frontline users see allowed_pages (null = all).
function useAllowedPages(profile: ReturnType<typeof useAuth>["profile"]) {
  if (!profile) return new Set<AppPage>()
  if (profile.is_admin) return new Set<AppPage>(["tracker", "documents", "dashboard"])
  if (profile.org === "firstfix") return new Set<AppPage>(["documents"])
  if (!profile.allowed_pages || profile.allowed_pages.length === 0) {
    return new Set<AppPage>(["tracker", "documents", "dashboard"])
  }
  return new Set<AppPage>(profile.allowed_pages as AppPage[])
}

function ChangePasswordDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [newPw, setNewPw] = useState("")
  const [confirm, setConfirm] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (newPw.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    if (newPw !== confirm) {
      toast.error("Passwords do not match")
      return
    }
    setBusy(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) throw error
      toast.success("Password updated")
      setNewPw("")
      setConfirm("")
      onClose()
    } catch (e) {
      toast.error("Could not update password", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>Choose a new password for your account.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">New password</Label>
            <Input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="at least 6 characters"
              autoFocus
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Confirm password</Label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy || newPw.length < 6}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { profile, user, signOut } = useAuth()
  const { dark, toggle } = useTheme()
  const name = profile?.full_name ?? profile?.username ?? user?.email ?? "User"
  const allowedPages = useAllowedPages(profile)
  const [changePwOpen, setChangePwOpen] = useState(false)

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <PackageCheck className="size-5" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Frontline Tracker</div>
              <ProjectSwitcher />
            </div>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {allowedPages.has("tracker") && (
              <NavItem to="/" icon={PackageCheck} label="Procurement" />
            )}
            {allowedPages.has("documents") && (
              <NavItem to="/documents" icon={FileText} label="Documents" />
            )}
            {allowedPages.has("dashboard") && (
              <NavItem to="/dashboard" icon={BarChart3} label="Dashboard" />
            )}
            {profile?.is_admin && (
              <NavItem to="/admin" icon={Shield} label="Admin" />
            )}
          </nav>

          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" onClick={toggle} title="Toggle theme">
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-1.5 sm:px-2">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary uppercase">
                      {initials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:inline">
                    {name}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="flex flex-col gap-1">
                  <span className="truncate">{name}</span>
                  {profile?.org && (
                    <Badge variant="outline" className="w-fit font-normal">
                      {ORG_LABELS[profile.org] ?? profile.org}
                      {profile.is_admin ? " · Admin" : ""}
                    </Badge>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setChangePwOpen(true)}>
                  <KeyRound className="size-4" />
                  Change password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void signOut()}>
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="flex items-center gap-1 overflow-x-auto border-t px-2 py-1.5 md:hidden">
          {allowedPages.has("tracker") && (
            <NavItem to="/" icon={PackageCheck} label="Procurement" />
          )}
          {allowedPages.has("documents") && (
            <NavItem to="/documents" icon={FileText} label="Documents" />
          )}
          {allowedPages.has("dashboard") && (
            <NavItem to="/dashboard" icon={BarChart3} label="Dashboard" />
          )}
          {profile?.is_admin && <NavItem to="/admin" icon={Shield} label="Admin" />}
        </nav>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6">{children}</main>

      <ChangePasswordDialog open={changePwOpen} onClose={() => setChangePwOpen(false)} />
    </div>
  )
}

function ProjectSwitcher() {
  const { projects, currentProject, currentProjectId, setCurrentProject } = useProject()
  const navigate = useNavigate()

  // Nothing to show until a project is active (e.g. admin on /admin pre-select).
  const label = currentProject?.name ?? "Select project"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="max-w-[160px] truncate">{label}</span>
          <ChevronsUpDown className="size-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Projects</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {projects.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onClick={() => setCurrentProject(p.id)}
            className="gap-2"
          >
            <FolderOpen className="size-4 text-muted-foreground" />
            <span className="flex-1 truncate">{p.name}</span>
            {p.id === currentProjectId && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        {projects.length > 1 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/projects")}>
              <LayoutGrid className="size-4" />
              All projects
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NavItem({
  to,
  icon: Icon,
  label,
}: {
  to: string
  icon: typeof PackageCheck
  label: string
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        cn(
          "flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )
      }
    >
      <Icon className="size-4" />
      {label}
    </NavLink>
  )
}
