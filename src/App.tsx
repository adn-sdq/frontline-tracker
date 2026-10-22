import { lazy, Suspense, type ReactNode } from "react"
import { Navigate, Route, Routes, useLocation } from "react-router-dom"
import { FullPageLoader } from "@/components/shell/PageGate"

import { useAuth } from "@/contexts/AuthContext"
import { useProject } from "@/contexts/ProjectContext"
import { hasSupabaseConfig } from "@/lib/supabase"
import type { AppPage } from "@/lib/types"
import LoginPage from "@/pages/LoginPage"
import TrackerPage from "@/pages/TrackerPage"
import DocumentsPage from "@/pages/DocumentsPage"
import ProjectsPage from "@/pages/ProjectsPage"
import AdminPage from "@/pages/AdminPage"
import DeliveryNotesPage from "@/pages/DeliveryNotesPage"
import ChangelogPage from "@/pages/ChangelogPage"
import DocsPage from "@/pages/DocsPage"
import TicketsPage from "@/pages/TicketsPage"
import TechniciansPage from "@/pages/TechniciansPage"
import UpdatesPage from "@/pages/UpdatesPage"
import SlaPage from "@/pages/SlaPage"
import SlaContractPage from "@/pages/SlaContractPage"
import LegalPage from "@/pages/LegalPage"
import OAuthConsentPage from "@/pages/OAuthConsentPage"
import TrackPage from "@/pages/TrackPage"
import ItemPage from "@/pages/ItemPage"
import { clearReturnTo, peekReturnTo, rememberReturnTo } from "@/lib/returnTo"
import NotFoundPage from "@/pages/NotFoundPage"
import { AppLayout } from "@/components/AppLayout"

// Charts are heavy; load the dashboard only when it is opened.
const DashboardPage = lazy(() => import("@/pages/DashboardPage"))

function FullScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      {children}
    </div>
  )
}

function TrackRoute({ session, canTrack, home }: { session: boolean; canTrack: boolean; home: string }) {
  const location = useLocation()
  if (!session) {
    rememberReturnTo(location.pathname)
    return <Navigate to="/login" replace />
  }
  clearReturnTo()
  if (!canTrack) return <Navigate to={home} replace />
  return (
    <AppLayout>
      <TrackPage />
    </AppLayout>
  )
}

export default function App() {
  const { session, loading, profile, pageAccess } = useAuth()
  const { currentProjectId, loading: projectsLoading } = useProject()
  const isFirstfix = profile?.org === "firstfix"
  const isAdmin = !!profile?.is_admin

  // Same rule the nav and the database use (src/lib/access.ts).
  function canAccess(page: AppPage) {
    return pageAccess(page) !== "none"
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
        <FullPageLoader />
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
        element={session ? <Navigate to={peekReturnTo() ?? homeRedirect} replace /> : <LoginPage />}
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
              <Suspense fallback={null}><DashboardPage /></Suspense>
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
      <Route
        path="/delivery-notes"
        element={withProject(
          !canAccess("tracker") ? (
            <Navigate to={pageRedirect} replace />
          ) : (
            <AppLayout>
              <DeliveryNotesPage />
            </AppLayout>
          )
        )}
      />
      <Route
        path="/item/:id"
        element={withProject(
          !canAccess("tracker") ? (
            <Navigate to={pageRedirect} replace />
          ) : (
            <AppLayout>
              <ItemPage />
            </AppLayout>
          )
        )}
      />
      {/* Scanned FIT labels. Needs a session; RLS limits it to project members. */}
      <Route
        path="/t/:tag"
        element={<TrackRoute session={!!session} canTrack={canAccess("tracker")} home={homeRedirect} />}
      />
      <Route
        path="/tickets"
        element={
          !session ? (
            <Navigate to="/login" replace />
          ) : !canAccess("tickets") ? (
            <Navigate to={homeRedirect} replace />
          ) : (
            <AppLayout>
              <TicketsPage />
            </AppLayout>
          )
        }
      />
      <Route
        path="/technicians"
        element={
          !session ? (
            <Navigate to="/login" replace />
          ) : !canAccess("technicians") ? (
            <Navigate to={homeRedirect} replace />
          ) : (
            <AppLayout>
              <TechniciansPage />
            </AppLayout>
          )
        }
      />
      {["/sla", "/sla/:id"].map((path) => (
        <Route
          key={path}
          path={path}
          element={
            !session ? (
              <Navigate to="/login" replace />
            ) : !canAccess("sla") ? (
              <Navigate to={homeRedirect} replace />
            ) : (
              <AppLayout>
                {path === "/sla" ? <SlaPage /> : <SlaContractPage />}
              </AppLayout>
            )
          }
        />
      ))}
      <Route
        path="/updates"
        element={
          !session ? (
            <Navigate to="/login" replace />
          ) : (
            <AppLayout>
              <UpdatesPage />
            </AppLayout>
          )
        }
      />
      <Route path="/changelog" element={<ChangelogPage />} />
      <Route path="/docs" element={<DocsPage />} />
      <Route path="/legal" element={<LegalPage />} />
      <Route path="/oauth/consent" element={<OAuthConsentPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
