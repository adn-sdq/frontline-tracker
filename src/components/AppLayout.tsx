import { useEffect, useState, type ReactNode } from "react"
import { LogOut, Moon, PackageCheck, Sun } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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

          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" onClick={toggle} title="Toggle theme">
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
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
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void signOut()}>
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6">{children}</main>
    </div>
  )
}
