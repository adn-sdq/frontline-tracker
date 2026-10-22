import { useMemo, useState, type ReactNode } from "react"
import { useLocation } from "react-router-dom"
import { Eye } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { ShellContext, type ShellState } from "@/contexts/ShellContext"
import { pageForPath } from "@/lib/navigation"

import { PageActionsContext } from "@/contexts/PageActionsContext"
import { AppSidebar, SidebarContent } from "@/components/shell/AppSidebar"
import { TopBar } from "@/components/shell/TopBar"
import { SettingsDialog, type SettingsSection } from "@/components/shell/SettingsDialog"
import { FetchProgressBar, PageGate } from "@/components/shell/PageGate"
import { Sheet, SheetContent } from "@/components/ui/sheet"

const COLLAPSE_KEY = "sidebar_collapsed"

/**
 * App shell — a rounded sidebar panel beside the page, a top bar (breadcrumb,
 * search, page actions, New) and the scrollable page. Also hosts Settings.
 */
export function AppLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const [actionsEl, setActionsEl] = useState<HTMLDivElement | null>(null)
  const { pageAccess } = useAuth()
  const page = pageForPath(pathname)
  const viewOnly = !!page && pageAccess(page) === "view"

  const [collapsed, setCollapsedState] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1"
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [settings, setSettings] = useState<{ open: boolean; section: SettingsSection }>({ open: false, section: "appearance" })

  const shell = useMemo<ShellState>(() => {
    const setCollapsed = (v: boolean) => {
      setCollapsedState(v)
      try {
        localStorage.setItem(COLLAPSE_KEY, v ? "1" : "0")
      } catch {
        /* preference just won't stick */
      }
    }
    return {
      collapsed,
      setCollapsed,
      toggleSidebar: () => {
        if (window.matchMedia("(min-width: 768px)").matches) setCollapsed(!collapsed)
        else setMobileOpen(true)
      },
      openSettings: (section) => {
        setMobileOpen(false)
        setSettings({ open: true, section: (section as SettingsSection) ?? "appearance" })
      },
    }
  }, [collapsed])

  return (
    <ShellContext.Provider value={shell}>
      <PageActionsContext.Provider value={actionsEl}>
        <div className="flex h-svh gap-2 overflow-hidden bg-background p-0 md:p-2">
          <AppSidebar />

          <div className="relative flex min-w-0 flex-1 flex-col">
            <FetchProgressBar />
            <TopBar actionsContainerRef={setActionsEl} />
            <main className="app-canvas flex-1 overflow-y-auto px-4 pt-2 pb-6 md:px-5">
              {/* keyed by route so content animates in on every navigation */}
              <div key={pathname} className="animate-page-enter mx-auto max-w-350">
                {viewOnly && (
                  <div className="mb-3 flex items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200">
                    <Eye className="size-3.5 shrink-0" />
                    You have view-only access to this page. Changes are disabled.
                  </div>
                )}
                <PageGate>{children}</PageGate>
              </div>
            </main>
          </div>
        </div>

        {/* Mobile drawer */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 bg-sidebar p-0">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <SettingsDialog
          open={settings.open}
          onOpenChange={(open) => setSettings((s) => ({ ...s, open }))}
          section={settings.section}
          onSection={(section) => setSettings((s) => ({ ...s, section }))}
        />
      </PageActionsContext.Provider>
    </ShellContext.Provider>
  )
}
