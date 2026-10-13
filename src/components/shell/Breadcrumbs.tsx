import { Link, useLocation } from "react-router-dom"
import { ChevronRight } from "lucide-react"

import { useProject } from "@/contexts/ProjectContext"
import { pageLabelFor } from "@/lib/navigation"

/**
 * Breadcrumb row shown at the top of the page content (below the top bar).
 * Derives the trail from the current route + active project.
 */
export function Breadcrumbs() {
  const { pathname } = useLocation()
  const { currentProject } = useProject()
  const pageLabel = pageLabelFor(pathname)

  if (!pageLabel) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground"
    >
      <Link to="/projects" className="transition-colors hover:text-foreground">
        Projects
      </Link>
      <ChevronRight className="size-3 shrink-0 opacity-60" />
      {currentProject && pathname !== "/projects" && (
        <>
          <span className="max-w-40 truncate">{currentProject.name}</span>
          <ChevronRight className="size-3 shrink-0 opacity-60" />
        </>
      )}
      <span className="font-medium text-foreground/80">{pageLabel}</span>
    </nav>
  )
}
