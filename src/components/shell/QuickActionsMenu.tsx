import { useNavigate } from "react-router-dom"
import { FileText, FolderKanban, LayoutGrid, LifeBuoy, Truck, Zap } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/contexts/AuthContext"
import { useProject } from "@/contexts/ProjectContext"
import { useHoverMenu } from "@/hooks/useHoverMenu"
import type { AppPage } from "@/lib/types"
import { cn } from "@/lib/utils"

const CREATE: { to: string; page: AppPage; icon: typeof Zap; title: string; hint: string }[] = [
  { to: "/", page: "tracker", icon: LayoutGrid, title: "Procurement item", hint: "A line to buy, deliver and install" },
  { to: "/delivery-notes", page: "tracker", icon: Truck, title: "Delivery note", hint: "Items going out to site" },
  { to: "/documents", page: "documents", icon: FileText, title: "Document", hint: "Submittal, drawing or manual" },
  { to: "/tickets", page: "tickets", icon: LifeBuoy, title: "Ticket", hint: "Report an issue or request" },
]

/**
 * Quick actions — top of the sidebar. Opens on hover (or click/tap): create
 * something in the current project, or jump to all projects. Each create entry
 * lands on its page with the form already open, and only shows what you can do.
 */
export function QuickActionsMenu({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const navigate = useNavigate()
  const { canEdit, pageAccess } = useAuth()
  const { currentProjectId } = useProject()
  const { open, setOpen, hoverProps } = useHoverMenu()

  const create = currentProjectId
    ? CREATE.filter((i) => (i.page === "tickets" ? pageAccess(i.page) !== "none" : canEdit(i.page)))
    : []

  function go(to: string) {
    setOpen(false)
    onNavigate?.()
    navigate(to)
  }

  const trigger = (
    <button
      type="button"
      {...hoverProps}
      className={cn(
        "flex items-center rounded-lg text-sm transition-colors data-[state=open]:bg-sidebar-accent",
        collapsed ? "size-9 justify-center" : "w-full gap-2 px-2.5 py-1.5",
        "text-sidebar-foreground hover:bg-sidebar-accent/50"
      )}
      aria-label="Quick actions"
    >
      <Zap className={collapsed ? "size-4.5" : "size-4 shrink-0"} />
      {!collapsed && <span className="truncate">Quick actions</span>}
    </button>
  )

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">Quick actions</TooltipContent>
        </Tooltip>
      ) : (
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      )}
      <DropdownMenuContent side="right" align="start" sideOffset={8} className="w-64 p-1" {...hoverProps}>
        {create.length > 0 && (
          <>
            <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">Create in this project</DropdownMenuLabel>
            {create.map((i) => (
              <DropdownMenuItem key={i.title} onClick={() => go(`${i.to}?new=1`)} className="group flex items-start gap-2.5 py-2">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border bg-muted/50 text-muted-foreground transition-colors group-focus:border-primary/30 group-focus:text-primary">
                  <i.icon className="size-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{i.title}</span>
                  <span className="block text-xs text-muted-foreground">{i.hint}</span>
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={() => go("/projects")}>
          <FolderKanban className="size-4" /> All projects
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
