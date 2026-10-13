import { format } from "date-fns"
import { CheckCircle2, Clock, Pencil, PlayCircle, PlusCircle, RotateCcw, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { IssueStatusBadge, SeverityBadge } from "@/components/sla/SlaBadges"
import { useDeleteSlaIssue, useSlaIssueEvents } from "@/hooks/useSla"
import { useSystems } from "@/hooks/useSystems"
import { periodLabel } from "@/lib/sla"
import type { Profile, SlaIssue, SlaIssueEvent, SlaIssueStatus, SlaVisit } from "@/lib/types"

const EVENT_META: Record<SlaIssueEvent["action"], { label: string; icon: typeof Clock; className: string }> = {
  opened: { label: "Raised", icon: PlusCircle, className: "text-red-600" },
  updated: { label: "Updated", icon: Pencil, className: "text-blue-600" },
  in_progress: { label: "In progress", icon: PlayCircle, className: "text-blue-600" },
  deferred: { label: "Kept for next visit", icon: Clock, className: "text-amber-600" },
  resolved: { label: "Resolved", icon: CheckCircle2, className: "text-emerald-600" },
  reopened: { label: "Reopened", icon: RotateCcw, className: "text-red-600" },
}

export function SlaIssueSheet({
  issue,
  contractName,
  visitsById,
  profiles,
  canManage,
  onClose,
  onEdit,
  onStatus,
}: {
  issue: SlaIssue | null
  contractName?: string
  visitsById: Map<string, SlaVisit>
  profiles: Record<string, Profile>
  canManage: boolean
  onClose: () => void
  onEdit: (issue: SlaIssue) => void
  onStatus: (issue: SlaIssue, status: SlaIssueStatus) => void
}) {
  const events = useSlaIssueEvents(issue?.id ?? null)
  const del = useDeleteSlaIssue()
  const confirm = useConfirm()
  const { labelFor } = useSystems()

  const who = (id: string | null) => (id ? profiles[id]?.full_name ?? profiles[id]?.username ?? "Unknown" : "—")
  const visitLabel = (id: string | null) => {
    const v = id ? visitsById.get(id) : undefined
    return v ? `${periodLabel(v.period)} visit` : null
  }

  async function remove() {
    if (!issue) return
    const ok = await confirm({
      title: "Delete issue?",
      description: "The issue and its timeline will be permanently removed.",
      confirmText: "Delete",
      destructive: true,
    })
    if (!ok) return
    try {
      await del.mutateAsync(issue.id)
      toast.success("Issue deleted")
      onClose()
    } catch (e) {
      toast.error("Could not delete", { description: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  return (
    <Sheet open={!!issue} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        {issue && (
          <>
            <SheetHeader>
              <SheetTitle>{issue.title}</SheetTitle>
              <SheetDescription>{contractName ?? "SLA issue"}</SheetDescription>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <SeverityBadge severity={issue.severity} />
                <IssueStatusBadge status={issue.status} />
              </div>
            </SheetHeader>

            <div className="flex flex-col gap-5 px-4 pb-6 sm:px-6">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Raised</dt>
                <dd>
                  {format(new Date(issue.created_at), "d MMM yyyy")}
                  {visitLabel(issue.found_visit_id) && ` · ${visitLabel(issue.found_visit_id)}`}
                </dd>
                <dt className="text-muted-foreground">Raised by</dt>
                <dd>{who(issue.created_by)}</dd>
                {issue.system && (
                  <>
                    <dt className="text-muted-foreground">System</dt>
                    <dd>{labelFor(issue.system)}</dd>
                  </>
                )}
                {issue.location && (
                  <>
                    <dt className="text-muted-foreground">Location</dt>
                    <dd>{issue.location}</dd>
                  </>
                )}
                {issue.resolved_at && (
                  <>
                    <dt className="text-muted-foreground">Resolved</dt>
                    <dd>
                      {format(new Date(issue.resolved_at), "d MMM yyyy")} by {who(issue.resolved_by)}
                    </dd>
                  </>
                )}
              </dl>

              {issue.description && <p className="whitespace-pre-wrap text-sm">{issue.description}</p>}
              {issue.resolution && (
                <div className="rounded-lg border border-emerald-600/30 bg-emerald-50/50 p-3 text-sm dark:bg-emerald-950/20">
                  <span className="font-medium">Fix: </span>
                  {issue.resolution}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {issue.status !== "resolved" ? (
                  <>
                    <Button size="sm" onClick={() => onStatus(issue, "resolved")}>
                      <CheckCircle2 className="size-4" /> Resolve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onStatus(issue, "deferred")}>
                      <Clock className="size-4" /> Keep for next visit
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => onStatus(issue, "open")}>
                    <RotateCcw className="size-4" /> Reopen
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => onEdit(issue)}>
                  <Pencil className="size-4" /> Edit
                </Button>
                {canManage && (
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={remove}>
                    <Trash2 className="size-4" /> Delete
                  </Button>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="mb-3 text-sm font-semibold">Timeline</h3>
                {events.isLoading ? (
                  <Spinner className="size-4" />
                ) : (
                  <ol className="relative flex flex-col gap-3 border-l pl-4">
                    {(events.data ?? []).map((e) => {
                      const meta = EVENT_META[e.action]
                      const Icon = meta.icon
                      return (
                        <li key={e.id} className="relative">
                          <span className="absolute top-1.5 -left-[20.5px] size-2 rounded-full bg-border ring-4 ring-background" />
                          <div className="flex items-center gap-1.5 text-sm">
                            <Icon className={`size-3.5 ${meta.className}`} />
                            <span className="font-medium">{meta.label}</span>
                            {visitLabel(e.visit_id) && (
                              <span className="text-muted-foreground">at {visitLabel(e.visit_id)}</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {who(e.created_by)} · {format(new Date(e.created_at), "d MMM yyyy, HH:mm")}
                          </p>
                          {e.note && <p className="mt-0.5 whitespace-pre-wrap text-sm">{e.note}</p>}
                        </li>
                      )
                    })}
                  </ol>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
