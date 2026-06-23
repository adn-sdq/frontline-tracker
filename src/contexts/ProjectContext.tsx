import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { useAuth } from "@/contexts/AuthContext"
import { useProjects, useProjectsRealtime } from "@/hooks/useProjects"
import type { Project } from "@/lib/types"

interface ProjectContextValue {
  projects: Project[]
  currentProjectId: string | null
  currentProject: Project | null
  setCurrentProject: (id: string | null) => void
  loading: boolean
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined)

// Persist the chosen project per-user so switching accounts on one browser
// doesn't leak a selection across people.
function storageKey(userId: string | undefined) {
  return userId ? `ft-project:${userId}` : "ft-project:anon"
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  useProjectsRealtime()
  const { data: projects = [], isLoading } = useProjects()
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)

  const key = storageKey(user?.id)

  // Load the persisted selection when the user changes.
  useEffect(() => {
    const saved = localStorage.getItem(key)
    setCurrentProjectId(saved)
  }, [key])

  // Validate the selection against accessible projects; auto-select when the
  // user has exactly one project (and none chosen yet).
  useEffect(() => {
    if (isLoading) return
    if (projects.length === 0) {
      if (currentProjectId !== null) setCurrentProjectId(null)
      return
    }
    const valid = currentProjectId && projects.some((p) => p.id === currentProjectId)
    if (!valid) {
      if (projects.length === 1) {
        const only = projects[0].id
        setCurrentProjectId(only)
        localStorage.setItem(key, only)
      } else if (currentProjectId !== null) {
        setCurrentProjectId(null)
        localStorage.removeItem(key)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, isLoading])

  const setCurrentProject = (id: string | null) => {
    setCurrentProjectId(id)
    if (id) localStorage.setItem(key, id)
    else localStorage.removeItem(key)
  }

  const currentProject = useMemo(
    () => projects.find((p) => p.id === currentProjectId) ?? null,
    [projects, currentProjectId]
  )

  const value = useMemo<ProjectContextValue>(
    () => ({
      projects,
      currentProjectId,
      currentProject,
      setCurrentProject,
      loading: isLoading,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projects, currentProjectId, currentProject, isLoading]
  )

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProject() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error("useProject must be used within ProjectProvider")
  return ctx
}
