import type { ReactNode } from "react"
import { useLocation } from "react-router-dom"

import { AppSidebar } from "@/components/shell/AppSidebar"
import { TopBar } from "@/components/shell/TopBar"

/**
 * App shell — fixed left sidebar (nav) + top bar (breadcrumb, global search,
 * account) + scrollable content canvas. On mobile the sidebar collapses into
 * a sheet opened from the top bar.
 */
export function AppLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="app-canvas flex-1 overflow-y-auto p-4 md:p-6">
          <div key={pathname} className="animate-page-enter mx-auto max-w-350">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
