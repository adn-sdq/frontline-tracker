import { useEffect, useState, type ReactNode } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import {
  BarChart3,
  Check,
  ChevronsUpDown,
  ClipboardList,
  FileText,
  FolderOpen,
  KeyRound,
  LayoutGrid,
  LogOut,
  Menu,
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
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
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
  if (profile.is_admin) return new Set<AppPage>(["tracker", "documents", "dashboard"])
  if (profile.org === "firstfix") return new Set<AppPage>(["documents"])
  if (!profile.allowed_pages || profile.allowed_pages.length === 0) {
    return new Set<AppPage>(["tracker", "documents", "dashboard"])
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

// ── Sidebar inner content (shared between desktop + mobile sheet) ─────────────

function SidebarContent({
  onNavigate,
}: {
  onNavigate?: () => void
}) {
  const { profile, user, signOut } = useAuth()
  const { dark, toggle } = useTheme()
  const [changePwOpen, setChangePwOpen] = useState(false)
  const name = profile?.full_name ?? profile?.username ?? user?.email ?? "User"
  const allowedPages = useAllowedPages(profile)

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <PackageCheck className="size-5" />
        </div>
        <div className="min-w-0 leading-tight">
          <div className="text-sm font-semibold">Frontline Tracker</div>
          <ProjectSwitcher />
        </div>
      </div>

      <Separator />

      {/* Nav links */}
      <nav className="flex flex-col gap-0.5 p-2 flex-1">
        {allowedPages.has("tracker") && (
          <NavItem to="/" icon={PackageCheck} label="Procurement" onClick={onNavigate} />
        )}
        {allowedPages.has("tracker") && (
          <NavItem to="/delivery-notes" icon={ClipboardList} label="Delivery notes" onClick={onNavigate} indent />
        )}
        {allowedPages.has("documents") && (
          <NavItem to="/documents" icon={FileText} label="Documents" onClick={onNavigate} />
        )}
        {allowedPages.has("dashboard") && (
          <NavItem to="/dashboard" icon={BarChart3} label="Dashboard" onClick={onNavigate} />
        )}
        {profile?.is_admin && (
          <NavItem to="/admin" icon={Shield} label="Admin" onClick={onNavigate} />
        )}
      </nav>

      <Separator />

      {/* Bottom: theme + user */}
      <div className="p-3 flex flex-col gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={toggle}
        >
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          {dark ? "Light mode" : "Dark mode"}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 px-2">
              <Avatar className="size-6">
                <AvatarFallback className="bg-primary/10 text-primary text-xs uppercase">
                  {initials(name)}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">{name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-52">
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
              <KeyRound className="size-4" /> Change password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void signOut()}>
              <LogOut className="size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ChangePasswordDialog open={changePwOpen} onClose={() => setChangePwOpen(false)} />
    </div>
  )
}

// ── Main layout ───────────────────────────────────────────────────────────────

export function AppLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-svh bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 border-r bg-card md:flex md:flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile: thin top bar with hamburger */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <PackageCheck className="size-4" />
            </div>
            <span className="text-sm font-semibold">Frontline Tracker</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-350">{children}</div>
        </main>
      </div>

      {/* Mobile sidebar sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ── Project switcher ──────────────────────────────────────────────────────────

function ProjectSwitcher() {
  const { projects, currentProject, currentProjectId, setCurrentProject } = useProject()
  const navigate = useNavigate()
  const label = currentProject?.name ?? "Select project"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="max-w-35 truncate">{label}</span>
          <ChevronsUpDown className="size-3 shrink-0" />
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
  icon: typeof PackageCheck
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
          "flex items-center gap-3 rounded-md py-1.5 text-sm transition-colors",
          indent ? "pl-9 pr-3 font-normal" : "px-3 font-medium",
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
