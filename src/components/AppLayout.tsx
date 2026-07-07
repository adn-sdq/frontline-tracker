import { useState, type ReactNode } from "react"
import { useLocation } from "react-router-dom"

import { PageActionsContext } from "@/contexts/PageActionsContext"
import { AppSidebar } from "@/components/shell/AppSidebar"
import { TopBar } from "@/components/shell/TopBar"

/**
 * App shell — fixed left sidebar + top bar + scrollable content canvas.
 * Provides the PageActionsContext so each page can portal its primary CTAs
 * into the top-bar action slot via <PageActions>.
 */
export function AppLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const [actionsEl, setActionsEl] = useState<HTMLDivElement | null>(null)

  return (
    <PageActionsContext.Provider value={actionsEl}>
      <div className="flex h-svh overflow-hidden bg-background">
        <AppSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar actionsContainerRef={setActionsEl} />
          <main className="app-canvas flex-1 overflow-y-auto p-4 md:p-6">
            {/* keyed by route so content animates in on every navigation */}
            <div key={pathname} className="animate-page-enter mx-auto max-w-350">
              {children}
            </div>
          </main>
        </div>
      </div>
    </PageActionsContext.Provider>
  )
}
