import { Link, useLocation, useNavigate } from "react-router-dom"
import { Check, ChevronDown, ChevronRight, FolderKanban } from "lucide-react"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProjectLogo } from "@/components/ProjectLogo"
import { useProject } from "@/contexts/ProjectContext"
import { pageLabelFor } from "@/lib/navigation"

/**
 * Top-bar breadcrumb: Projects › <project ▾> › Page. The project crumb is the
 * project switcher, so switching lives where you already look to see where
 * you are (no separate switcher in the sidebar).
 */
export function Breadcrumbs() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { projects, currentProject, currentProjectId, setCurrentProject } = useProject()
  const pageLabel = pageLabelFor(pathname)

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm">
      <Link to="/projects" className="hidden shrink-0 text-muted-foreground transition-colors hover:text-foreground sm:inline">
        Projects
      </Link>

      {currentProject && (
        <>
          <ChevronRight className="hidden size-3.5 shrink-0 text-muted-foreground/60 sm:block" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title="Switch project"
              >
                <ProjectLogo project={currentProject} size={18} className="rounded-[4px] text-[8px]" />
                <span className="max-w-[9rem] truncate lg:max-w-[14rem]">{currentProject.name}</span>
                <ChevronDown className="size-3.5 shrink-0 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Switch project</DropdownMenuLabel>
              {projects.map((p) => (
                <DropdownMenuItem
                  key={p.id}
                  onClick={() => {
                    setCurrentProject(p.id)
                    toast.success(`Switched to ${p.name}`)
                  }}
                  className="gap-2"
                >
                  <ProjectLogo project={p} size={20} className="rounded-[4px] text-[9px]" />
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  {p.id === currentProjectId && <Check className="size-4 shrink-0 text-primary" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/projects")} className="gap-2">
                <FolderKanban className="size-4 text-muted-foreground" /> All projects
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}

      {pageLabel && (
        <>
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />
          <span className="truncate font-medium">{pageLabel}</span>
        </>
      )}
    </nav>
  )
}
