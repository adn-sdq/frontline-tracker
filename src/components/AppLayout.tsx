import { useEffect, useState, type ReactNode } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"
import {
  BarChart3,
  Check,
  ChevronsUpDown,
  ClipboardList,
  FileText,
  FolderOpen,
  KeyRound,
  LayoutGrid,
  LifeBuoy,
  LogOut,
  Menu,
  Moon,
  Shield,
  Sun,
  X,
} from "lucide-react"
import { FitLogo } from "@/components/FitLogo"
import { toast } from "sonner"

import { useAuth } from "@/contexts/AuthContext"
import { useProject } from "@/contexts/ProjectContext"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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

function useAllowedPages(profile: ReturnType<typeof useAuth>["profile"]) {
  if (!profile) return new Set<AppPage>()
  if (profile.is_admin) return new Set<AppPage>(["tracker", "documents", "dashboard", "tickets"])
  if (profile.org === "firstfix") return new Set<AppPage>(["documents"])
  if (!profile.allowed_pages || profile.allowed_pages.length === 0) {
    return new Set<AppPage>(["tracker", "documents", "dashboard", "tickets"])
  }
  return new Set<AppPage>(profile.allowed_pages as AppPage[])
}

function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [newPw, setNewPw] = useState("")
  const [confirm, setConfirm] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (newPw.length < 6) { toast.error("Password must be at least 6 characters"); return }
    if (newPw !== confirm) { toast.error("Passwords do not match"); return }
    setBusy(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) throw error
      toast.success("Password updated")
      setNewPw(""); setConfirm(""); onClose()
    } catch (e) {
      toast.error("Could not update password", { description: e instanceof Error ? e.message : "Unknown error" })
    } finally { setBusy(false) }
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
            <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="at least 6 characters" autoFocus />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Confirm password</Label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy || newPw.length < 6}>
            {busy && <Loader2 className="size-4 animate-spin" />} Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Project switcher ──────────────────────────────────────────────────────────

function ProjectSwitcher() {
  const { projects, currentProject, currentProjectId, setCurrentProject } = useProject()
  const navigate = useNavigate()
  const label = currentProject?.name ?? "Select project"

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
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="max-w-28 truncate">{label}</span>
          <ChevronsUpDown className="size-3 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Projects</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {projects.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onClick={() => switchProject(p.id)}
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
              <LayoutGrid className="size-4" /> All projects
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ── Nav item ──────────────────────────────────────────────────────────────────

function NavItem({
  to,
  icon: Icon,
  label,
  onClick,
  indent = false,
}: {
  to: string
  icon: typeof LayoutGrid
  label: string
  onClick?: () => void
  indent?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2 rounded-md py-1.5 text-sm transition-colors",
          indent ? "pl-7 pr-3 font-normal" : "px-3 font-medium",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )
      }
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </NavLink>
  )
}

// ── Top navbar (desktop) ──────────────────────────────────────────────────────

function TopNav() {
  const { profile, user, signOut } = useAuth()
  const { dark, toggle } = useTheme()
  const [changePwOpen, setChangePwOpen] = useState(false)
  const name = profile?.full_name ?? profile?.username ?? user?.email ?? "User"
  const allowedPages = useAllowedPages(profile)

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur">
        {/* Logo + project */}
        <div className="flex items-center gap-2.5 shrink-0">
          <FitLogo size={28} />
          <div className="leading-tight">
            <div className="text-sm font-semibold">FIT</div>
            <ProjectSwitcher />
          </div>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1 shrink-0" />

        {/* Nav links */}
        <nav className="flex items-center gap-0.5 overflow-x-auto flex-1 min-w-0">
          {allowedPages.has("tracker") && (
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                cn(
                  "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )
              }
            >
              <LayoutGrid className="size-4" />
              Procurement
            </NavLink>
          )}
          {allowedPages.has("tracker") && (
            <NavLink
              to="/delivery-notes"
              className={({ isActive }) =>
                cn(
                  "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )
              }
            >
              <ClipboardList className="size-4" />
              Delivery Notes
            </NavLink>
          )}
          {allowedPages.has("documents") && (
            <NavLink
              to="/documents"
              className={({ isActive }) =>
                cn(
                  "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )
              }
            >
              <FileText className="size-4" />
              Documents
            </NavLink>
          )}
          {allowedPages.has("dashboard") && (
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                cn(
                  "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )
              }
            >
              <BarChart3 className="size-4" />
              Dashboard
            </NavLink>
          )}
          {allowedPages.has("tickets") && (
            <NavLink
              to="/tickets"
              className={({ isActive }) =>
                cn(
                  "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )
              }
            >
              <LifeBuoy className="size-4" />
              Tickets
            </NavLink>
          )}
          {profile?.is_admin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )
              }
            >
              <Shield className="size-4" />
              Admin
            </NavLink>
          )}
        </nav>

        {/* Right: theme + user */}
        <div className="flex shrink-0 items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={toggle}>
                {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{dark ? "Switch to light mode" : "Switch to dark mode"}</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 px-2">
                    <Avatar className="size-6">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs uppercase">
                        {initials(name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block max-w-24 truncate text-sm font-medium">{name}</span>
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Account &amp; settings</TooltipContent>
            </Tooltip>
            <DropdownMenuContent side="bottom" align="end" className="w-52">
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
              <DropdownMenuItem asChild>
                <Link to="/changelog">Changelog</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/docs">Docs</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setChangePwOpen(true)}>
                <KeyRound className="size-4" /> Change password
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
        </div>
      </header>

      <ChangePasswordDialog open={changePwOpen} onClose={() => setChangePwOpen(false)} />
    </>
  )
}

// ── Mobile nav sheet ──────────────────────────────────────────────────────────

function MobileNav() {
  const { profile, user, signOut } = useAuth()
  const { dark, toggle } = useTheme()
  const [open, setOpen] = useState(false)
  const [changePwOpen, setChangePwOpen] = useState(false)
  const name = profile?.full_name ?? profile?.username ?? user?.email ?? "User"
  const allowedPages = useAllowedPages(profile)

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:hidden">
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
          <Menu className="size-5" />
        </Button>
        <div className="flex items-center gap-2">
          <FitLogo size={28} />
          <span className="text-sm font-semibold">FIT</span>
        </div>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col">
            <div className="flex h-14 shrink-0 items-center justify-between px-4">
              <div className="flex items-center gap-2.5">
                <FitLogo size={28} />
                <div className="leading-tight">
                  <div className="text-sm font-semibold">FIT</div>
                  <ProjectSwitcher />
                </div>
              </div>
              <Button variant="ghost" size="icon" className="size-7" onClick={() => setOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>

            <Separator />

            <nav className="flex flex-col gap-0.5 p-2 flex-1">
              {allowedPages.has("tracker") && (
                <NavItem to="/" icon={LayoutGrid} label="Procurement" onClick={() => setOpen(false)} />
              )}
              {allowedPages.has("tracker") && (
                <NavItem to="/delivery-notes" icon={ClipboardList} label="Delivery notes" onClick={() => setOpen(false)} indent />
              )}
              {allowedPages.has("documents") && (
                <NavItem to="/documents" icon={FileText} label="Documents" onClick={() => setOpen(false)} />
              )}
              {allowedPages.has("dashboard") && (
                <NavItem to="/dashboard" icon={BarChart3} label="Dashboard" onClick={() => setOpen(false)} />
              )}
              {allowedPages.has("tickets") && (
                <NavItem to="/tickets" icon={LifeBuoy} label="Tickets" onClick={() => setOpen(false)} />
              )}
              {profile?.is_admin && (
                <NavItem to="/admin" icon={Shield} label="Admin" onClick={() => setOpen(false)} />
              )}
            </nav>

            <Separator />

            <div className="p-3 flex flex-col gap-1">
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={toggle}>
                {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                {dark ? "Light mode" : "Dark mode"}
              </Button>
              <div className="flex items-center gap-3 px-2 py-1">
                <Link to="/changelog" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Changelog</Link>
                <span className="text-muted-foreground/40 text-xs">·</span>
                <Link to="/docs" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Docs</Link>
              </div>
              <div className="flex items-center gap-2 px-2 py-1">
                <Avatar className="size-6">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs uppercase">
                    {initials(name)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate text-sm font-medium">{name}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-7 text-muted-foreground" onClick={() => setChangePwOpen(true)}>
                      <KeyRound className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Change password</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive"
                      onClick={() => { toast.success("Signed out"); void signOut() }}
                    >
                      <LogOut className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Sign out</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ChangePasswordDialog open={changePwOpen} onClose={() => setChangePwOpen(false)} />
    </>
  )
}

// ── Main layout ───────────────────────────────────────────────────────────────

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Desktop top nav */}
      <div className="hidden md:block">
        <TopNav />
      </div>

      {/* Mobile header + sheet */}
      <MobileNav />

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-350">{children}</div>
      </main>
    </div>
  )
}
