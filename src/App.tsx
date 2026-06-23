import type { ReactNode } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { Loader2 } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { useProject } from "@/contexts/ProjectContext"
import { hasSupabaseConfig } from "@/lib/supabase"
import type { AppPage } from "@/lib/types"
import LoginPage from "@/pages/LoginPage"
import TrackerPage from "@/pages/TrackerPage"
import DocumentsPage from "@/pages/DocumentsPage"
import DashboardPage from "@/pages/DashboardPage"
import ProjectsPage from "@/pages/ProjectsPage"
import AdminPage from "@/pages/AdminPage"
import { AppLayout } from "@/components/AppLayout"

function FullScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      {children}
    </div>
  )
}

export default function App() {
  const { session, loading, profile } = useAuth()
  const { currentProjectId, loading: projectsLoading } = useProject()
  const isFirstfix = profile?.org === "firstfix"
  const isAdmin = !!profile?.is_admin

  // Compute allowed pages the same way AppLayout does, so routes match nav.
  function canAccess(page: AppPage) {
    if (!profile) return false
    if (isAdmin) return true
    if (isFirstfix) return page === "documents"
    const pages = profile.allowed_pages
    if (!pages || pages.length === 0) return true
    return pages.includes(page)
  }

  // Where a logged-in user with a selected project should land.
  const pageRedirect = isFirstfix
    ? "/documents"
    : canAccess("tracker")
      ? "/"
      : canAccess("dashboard")
        ? "/dashboard"
        : "/documents"

  // No project chosen yet → the project picker.
  const homeRedirect = currentProjectId ? pageRedirect : "/projects"

  if (!hasSupabaseConfig) {
    return (
      <FullScreen>
        <div className="max-w-md text-center text-sm text-muted-foreground">
          <p className="mb-2 text-base font-semibold text-foreground">
            Backend not configured
          </p>
          Set <code>VITE_SUPABASE_URL</code> and{" "}
          <code>VITE_SUPABASE_ANON_KEY</code> in your environment, then reload.
        </div>
      </FullScreen>
    )
  }

  if (loading || (session && projectsLoading)) {
    return (
      <FullScreen>
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </FullScreen>
    )
  }

  // Gate a data page on having a project selected.
  function withProject(node: ReactNode) {
    if (!session) return <Navigate to="/login" replace />
    if (!currentProjectId) return <Navigate to="/projects" replace />
    return node
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to={homeRedirect} replace /> : <LoginPage />}
      />
      <Route
        path="/projects"
        element={!session ? <Navigate to="/login" replace /> : <ProjectsPage />}
      />
      <Route
        path="/"
        element={withProject(
          !canAccess("tracker") ? (
            <Navigate to={pageRedirect} replace />
          ) : (
            <AppLayout>
              <TrackerPage />
            </AppLayout>
          )
        )}
      />
      <Route
        path="/documents"
        element={withProject(
          !canAccess("documents") ? (
            <Navigate to={pageRedirect} replace />
          ) : (
            <AppLayout>
              <DocumentsPage />
            </AppLayout>
          )
        )}
      />
      <Route
        path="/dashboard"
        element={withProject(
          !canAccess("dashboard") ? (
            <Navigate to={pageRedirect} replace />
          ) : (
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          )
        )}
      />
      <Route
        path="/admin"
        element={
          !session ? (
            <Navigate to="/login" replace />
          ) : !isAdmin ? (
            <Navigate to={homeRedirect} replace />
          ) : (
            <AppLayout>
              <AdminPage />
            </AppLayout>
          )
        }
      />
      <Route path="*" element={<Navigate to={homeRedirect} replace />} />
    </Routes>
  )
}
