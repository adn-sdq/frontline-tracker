import type { ReactNode } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { Loader2 } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { hasSupabaseConfig } from "@/lib/supabase"
import LoginPage from "@/pages/LoginPage"
import TrackerPage from "@/pages/TrackerPage"
import DocumentsPage from "@/pages/DocumentsPage"
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
  const { session, loading } = useAuth()

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

  if (loading) {
    return (
      <FullScreen>
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </FullScreen>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          session ? (
            <AppLayout>
              <TrackerPage />
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/documents"
        element={
          session ? (
            <AppLayout>
              <DocumentsPage />
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/admin"
        element={
          session ? (
            <AppLayout>
              <AdminPage />
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
