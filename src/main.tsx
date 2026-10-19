import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { HashRouter } from "react-router-dom"

import "./index.css"
import App from "./App.tsx"
import { AuthProvider } from "@/contexts/AuthContext"
import { ProjectProvider } from "@/contexts/ProjectContext"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ConfirmProvider } from "@/components/ui/confirm-dialog"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 10_000 },
  },
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AuthProvider>
          <ProjectProvider>
            <TooltipProvider delayDuration={400}>
              <ConfirmProvider>
                <App />
              </ConfirmProvider>
              <Toaster richColors position="top-right" />
            </TooltipProvider>
          </ProjectProvider>
        </AuthProvider>
      </HashRouter>
    </QueryClientProvider>
  </StrictMode>
)

// Installable app (PWA). Production only, so local dev never serves stale files.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
  })
}
