import { formatDistanceToNow } from "date-fns"
import { CheckCircle2, Clock, MoreHorizontal, PlayCircle, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IssueStatusBadge, SeverityBadge } from "@/components/sla/SlaBadges"
import { cn } from "@/lib/utils"
import type { SlaIssue, SlaIssueStatus } from "@/lib/types"

/**
 * One issue line with quick status actions. In a visit context the primary
 * actions are "Resolve" and "Keep for next visit".
 */
export function SlaIssueRow({
  issue,
  subtitle,
  onOpen,
  onStatus,
  showActions = true,
}: {
  issue: SlaIssue
  subtitle?: string
  onOpen: () => void
  onStatus: (status: SlaIssueStatus) => void
  showActions?: boolean
}) {
  const resolved = issue.status === "resolved"
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-primary/40",
        resolved && "bg-muted/30"
      )}
    >
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn("text-sm font-medium", resolved && "text-muted-foreground line-through")}>
            {issue.title}
          </span>
          <SeverityBadge severity={issue.severity} />
          <IssueStatusBadge status={issue.status} />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {subtitle ?? [issue.location, `raised ${formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}`]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {issue.status_note && !resolved && (
          <p className="mt-1 text-xs italic text-muted-foreground">“{issue.status_note}”</p>
        )}
        {resolved && issue.resolution && (
          <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">Fix: {issue.resolution}</p>
        )}
      </button>

      {showActions && (
        <div className="flex shrink-0 items-center gap-1">
          {!resolved ? (
            <>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onStatus("resolved")}>
                <CheckCircle2 className="size-3.5 text-emerald-600" /> Resolve
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="size-7" aria-label="More status options">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onStatus("deferred")}>
                    <Clock className="size-4" /> Keep for next visit
                  </DropdownMenuItem>
                  {issue.status !== "in_progress" && (
                    <DropdownMenuItem onClick={() => onStatus("in_progress")}>
                      <PlayCircle className="size-4" /> Mark in progress
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onStatus("open")}>
              <RotateCcw className="size-3.5" /> Reopen
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
