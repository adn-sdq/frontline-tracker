import { useState, type ReactNode } from "react"
import { useLocation } from "react-router-dom"
import { Eye } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { pageForPath } from "@/lib/navigation"

import { PageActionsContext } from "@/contexts/PageActionsContext"
import { AppSidebar } from "@/components/shell/AppSidebar"
import { TopBar } from "@/components/shell/TopBar"
import { Breadcrumbs } from "@/components/shell/Breadcrumbs"
import { FetchProgressBar, PageGate } from "@/components/shell/PageGate"

/**
 * App shell — fixed left sidebar + top bar + scrollable content canvas.
 * Provides the PageActionsContext so each page can portal its primary CTAs
 * into the top-bar action slot via <PageActions>.
 */
export function AppLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const [actionsEl, setActionsEl] = useState<HTMLDivElement | null>(null)
  const { pageAccess } = useAuth()
  const page = pageForPath(pathname)
  const viewOnly = !!page && pageAccess(page) === "view"

  return (
    <PageActionsContext.Provider value={actionsEl}>
      <div className="flex h-svh overflow-hidden bg-background">
        <AppSidebar />

        <div className="relative flex min-w-0 flex-1 flex-col">
          <FetchProgressBar />
          <TopBar actionsContainerRef={setActionsEl} />
          <main className="app-canvas flex-1 overflow-y-auto p-4 md:p-6">
            {/* keyed by route so content animates in on every navigation */}
            <div key={pathname} className="animate-page-enter mx-auto max-w-350">
              <Breadcrumbs />
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
    </PageActionsContext.Provider>
  )
}
