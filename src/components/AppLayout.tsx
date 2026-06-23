import { useEffect, useState, type ReactNode } from "react"
import { NavLink } from "react-router-dom"
import {
  FileText,
  LogOut,
  Moon,
  PackageCheck,
  Shield,
  Sun,
} from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ORG_LABELS } from "@/lib/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

export function AppLayout({ children }: { children: ReactNode }) {
  const { profile, user, signOut } = useAuth()
  const { dark, toggle } = useTheme()
  const name = profile?.full_name ?? profile?.username ?? user?.email ?? "User"

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
              <div className="text-xs text-muted-foreground">MiSK Ilmi</div>
            </div>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            <NavItem to="/" icon={PackageCheck} label="Procurement" />
            <NavItem to="/documents" icon={FileText} label="Documents" />
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
          <NavItem to="/" icon={PackageCheck} label="Procurement" />
          <NavItem to="/documents" icon={FileText} label="Documents" />
          {profile?.is_admin && <NavItem to="/admin" icon={Shield} label="Admin" />}
        </nav>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6">{children}</main>
    </div>
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
