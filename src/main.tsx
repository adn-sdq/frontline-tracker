import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { HashRouter } from "react-router-dom"

import "./index.css"
import App from "./App.tsx"
import { AuthProvider } from "@/contexts/AuthContext"
import { ProjectProvider } from "@/contexts/ProjectContext"
import { Toaster } from "@/components/ui/sonner"

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
            <App />
            <Toaster richColors position="top-right" />
          </ProjectProvider>
        </AuthProvider>
      </HashRouter>
    </QueryClientProvider>
  </StrictMode>
)
