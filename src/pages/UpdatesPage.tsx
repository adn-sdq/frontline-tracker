import { useMemo, useState } from "react"
import {
  ArrowUp,
  ChevronDown,
  Columns3,
  LayoutList,
  Loader2,
  MessageSquarePlus,
  Newspaper,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/contexts/AuthContext"
import {
  useFeatureRequests,
  useUpdateFeatureRequest,
  useUpvoteFeatureRequest,
  type FeatureRequest,
} from "@/hooks/useAdmin"
import { KanbanBoard, type KanbanColumn } from "@/components/kanban/KanbanBoard"
import { supabase } from "@/lib/supabase"
import { RELEASES, type ReleaseEntry } from "@/pages/ChangelogPage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/PageHeader"
import { cn } from "@/lib/utils"

// ── Changelog tab helpers ─────────────────────────────────────────────────────

const TYPE_BADGE: Record<ReleaseEntry["type"], string> = {
  major: "bg-primary/15 text-primary border-primary/25",
  minor: "bg-blue-500/10 text-blue-600 border-blue-500/25 dark:text-blue-400",
  patch: "bg-muted text-muted-foreground border-border",
}
const TYPE_LABELS: Record<ReleaseEntry["type"], string> = {
  major: "Major",
  minor: "Minor",
  patch: "Patch",
}
const TYPE_BORDER: Record<ReleaseEntry["type"], string> = {
  major: "border-l-primary",
  minor: "border-l-blue-500/60",
  patch: "border-l-border",
}

type TypeFilter = "all" | ReleaseEntry["type"]

function ReleaseCard({ release, defaultOpen }: { release: ReleaseEntry; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={cn("overflow-hidden rounded-xl border border-l-4 bg-card", TYPE_BORDER[release.type])}>
      <button
        type="button"
        className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-accent/30"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-base font-bold tracking-tight">{release.version}</span>
            <Badge variant="outline" className={cn("text-xs font-medium", TYPE_BADGE[release.type])}>
              {TYPE_LABELS[release.type]}
            </Badge>
            <span className="font-mono text-xs text-muted-foreground">{release.date}</span>
            {defaultOpen && (
              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold">
                Latest
              </Badge>
            )}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{release.summary}</p>
        </div>
        <ChevronDown
          className={cn(
            "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="space-y-5 border-t px-4 pb-5 pt-4">
          {release.sections.map((section) => (
            <div key={section.title}>
              <span className="mb-2.5 inline-block rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {section.title}
              </span>
              <ul className="space-y-1.5 pl-1">
                {section.items.map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-sm">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/50" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function WhatsNewTab() {
  const [filter, setFilter] = useState<TypeFilter>("all")

  const counts = useMemo(
    () => ({
      all: RELEASES.length,
      major: RELEASES.filter((r) => r.type === "major").length,
      minor: RELEASES.filter((r) => r.type === "minor").length,
      patch: RELEASES.filter((r) => r.type === "patch").length,
    }),
    []
  )

  const filtered = filter === "all" ? RELEASES : RELEASES.filter((r) => r.type === filter)

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {(["all", "major", "minor", "patch"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filter === f
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
            )}
          >
            {f === "all" ? "All" : TYPE_LABELS[f]}
            <span className="ml-1.5 font-mono opacity-60">{counts[f]}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((release, idx) => (
          <ReleaseCard
            key={release.version}
            release={release}
            defaultOpen={idx === 0 && filter === "all"}
          />
        ))}
      </div>
    </div>
  )
}

// ── Feature requests tab ──────────────────────────────────────────────────────

const FR_STATUS_LABELS: Record<FeatureRequest["status"], string> = {
  pending: "Pending",
  planned: "Planned",
  in_progress: "In Progress",
  done: "Done",
  rejected: "Rejected",
}

const FR_STATUS_STYLES: Record<FeatureRequest["status"], string> = {
  pending: "bg-amber-100 text-amber-800 border-transparent dark:bg-amber-950 dark:text-amber-300",
  planned: "bg-blue-100 text-blue-800 border-transparent dark:bg-blue-950 dark:text-blue-300",
  in_progress: "bg-orange-100 text-orange-800 border-transparent dark:bg-orange-950 dark:text-orange-300",
  done: "bg-emerald-100 text-emerald-800 border-transparent dark:bg-emerald-950 dark:text-emerald-300",
  rejected: "bg-muted text-muted-foreground border-transparent",
}

const FR_STATUS_DOT: Record<FeatureRequest["status"], string> = {
  pending: "bg-amber-500",
  planned: "bg-blue-500",
  in_progress: "bg-orange-500",
  done: "bg-emerald-500",
  rejected: "bg-muted-foreground/40",
}

const ROADMAP_ORDER = ["pending", "planned", "in_progress", "done", "rejected"] as const

function fmtTimeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

function FeatureRequestCard({
  request,
  isMine,
  voted,
  onUpvote,
}: {
  request: FeatureRequest
  isMine: boolean
  voted: boolean
  onUpvote: () => void
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 transition-colors",
        isMine && "border-primary/25 bg-primary/[0.025]"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onUpvote}
          disabled={voted}
          title={voted ? "Already upvoted" : "Upvote"}
          className={cn(
            "flex shrink-0 flex-col items-center rounded-lg border px-2.5 py-1.5 transition-colors",
            voted
              ? "border-primary/30 bg-primary/[0.08] text-primary"
              : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
          )}
        >
          <ArrowUp className="size-3.5" />
          <span className="mt-0.5 text-[11px] font-semibold tabular-nums">{request.upvotes}</span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold leading-snug">{request.title}</span>
            <Badge
              variant="outline"
              className={cn("h-4 px-1.5 text-[10px] font-medium", FR_STATUS_STYLES[request.status])}
            >
              {FR_STATUS_LABELS[request.status]}
            </Badge>
            {isMine && (
              <Badge
                variant="outline"
                className="h-4 border-primary/30 px-1.5 text-[10px] font-normal text-primary"
              >
                Mine
              </Badge>
            )}
          </div>

          {request.description && (
            <p className="mb-2 text-sm leading-relaxed text-muted-foreground">{request.description}</p>
          )}

          <p className="text-xs text-muted-foreground">{fmtTimeAgo(request.submitted_at)}</p>
        </div>
      </div>
    </div>
  )
}

type StatusFilter = "all" | FeatureRequest["status"]
const ACTIVE_STATUS_FILTERS = ["all", "pending", "planned", "in_progress", "done"] as const

function FeatureRequestsTab() {
  const { user, profile } = useAuth()
  const isAdmin = !!profile?.is_admin
  const { data: requests = [], isLoading } = useFeatureRequests()
  const upvote = useUpvoteFeatureRequest()
  const updateFR = useUpdateFeatureRequest()

  const [view, setView] = useState<"list" | "board">("list")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [voted, setVoted] = useState<Set<string>>(() => {
    try {
      return new Set<string>(JSON.parse(localStorage.getItem("fr_voted") ?? "[]") as string[])
    } catch {
      return new Set<string>()
    }
  })

  const filtered =
    statusFilter === "all" ? requests : requests.filter((r) => r.status === statusFilter)

  async function submit() {
    if (!title.trim()) { toast.error("Title is required"); return }
    setSubmitting(true)
    try {
      const { error } = await supabase
        .from("feature_requests")
        .insert({ title: title.trim(), description: desc.trim() || null })
      if (error) throw error
      toast.success("Submitted — thanks!")
      setTitle(""); setDesc(""); setShowForm(false)
    } catch (err) {
      toast.error("Could not submit", { description: err instanceof Error ? err.message : String(err) })
    } finally {
      setSubmitting(false)
    }
  }

  function handleUpvote(id: string) {
    if (voted.has(id)) { toast("Already upvoted"); return }
    upvote.mutate(id, {
      onSuccess: () => {
        const next = new Set(voted)
        next.add(id)
        setVoted(next)
        localStorage.setItem("fr_voted", JSON.stringify([...next]))
      },
    })
  }

  async function moveRequest(id: string, status: FeatureRequest["status"]) {
    if (!isAdmin) {
      toast("Only admins can update the roadmap status")
      return
    }
    try {
      await updateFR.mutateAsync({ id, patch: { status } })
      toast.success(`Moved to ${FR_STATUS_LABELS[status]}`)
    } catch (e) {
      toast.error("Could not update", { description: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  const boardColumns: KanbanColumn<FeatureRequest["status"]>[] = ROADMAP_ORDER.map((s) => ({
    id: s,
    label: FR_STATUS_LABELS[s],
    accentClass: FR_STATUS_DOT[s],
  }))

  return (
    <div>
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mb-5 flex w-full items-center gap-3 rounded-xl border border-dashed border-input p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/30"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <MessageSquarePlus className="size-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Suggest a feature</p>
            <p className="text-xs text-muted-foreground">
              Got an idea? Tell the team what would help your workflow.
            </p>
          </div>
        </button>
      ) : (
        <div className="mb-5 rounded-xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Suggest a feature</h3>
          <div className="space-y-3">
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Short summary of the idea…"
                autoFocus
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Details (optional)</Label>
              <Textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Describe the problem it solves or how it should work…"
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={submit} disabled={submitting || !title.trim()}>
                {submitting && <Loader2 className="size-3.5 animate-spin" />}
                Submit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setShowForm(false); setTitle(""); setDesc("") }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {view === "list" &&
          ACTIVE_STATUS_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                statusFilter === f
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
              )}
            >
              {f === "all" ? "All" : FR_STATUS_LABELS[f as FeatureRequest["status"]]}
            </button>
          ))}
        {view === "board" && (
          <p className="text-xs text-muted-foreground">
            {isAdmin ? "Drag cards between columns to update status." : "Roadmap board (read-only)."}
          </p>
        )}
        <div className="ml-auto flex rounded-sm border border-input p-0.5">
          <button
            type="button"
            aria-label="List view"
            onClick={() => setView("list")}
            className={cn(
              "grid size-7 place-items-center rounded-[3px] transition-colors",
              view === "list" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutList className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Board view"
            onClick={() => setView("board")}
            className={cn(
              "grid size-7 place-items-center rounded-[3px] transition-colors",
              view === "board" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Columns3 className="size-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No requests yet — be the first to suggest something.
          </p>
        </div>
      ) : view === "board" ? (
        <KanbanBoard<FeatureRequest, FeatureRequest["status"]>
          columns={boardColumns}
          items={requests}
          getId={(r) => r.id}
          getColumn={(r) => r.status}
          onMove={(id, status) => moveRequest(id, status)}
          emptyLabel="No requests"
          renderCard={(r) => (
            <div className="flex flex-col gap-2 p-3">
              <div className="flex items-start gap-2">
                <div className="flex shrink-0 flex-col items-center rounded-md border px-1.5 py-0.5 text-muted-foreground">
                  <ArrowUp className="size-3" />
                  <span className="text-[10px] font-semibold tabular-nums">{r.upvotes}</span>
                </div>
                <p className="text-sm font-medium leading-snug">{r.title}</p>
              </div>
              {r.description && (
                <p className="line-clamp-3 text-xs text-muted-foreground">{r.description}</p>
              )}
              <p className="text-[11px] text-muted-foreground">{fmtTimeAgo(r.submitted_at)}</p>
            </div>
          )}
        />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">No requests match this filter.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((req) => (
            <FeatureRequestCard
              key={req.id}
              request={req}
              isMine={req.submitted_by === user?.id}
              voted={voted.has(req.id)}
              onUpvote={() => handleUpvote(req.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UpdatesPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Updates" />

      <Tabs defaultValue="whats-new" className="mt-6">
        <TabsList className="mb-6">
          <TabsTrigger value="whats-new" className="gap-1.5">
            <Newspaper className="size-3.5" />
            What's New
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-1.5">
            <Sparkles className="size-3.5" />
            Feature Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="whats-new">
          <WhatsNewTab />
        </TabsContent>

        <TabsContent value="requests">
          <FeatureRequestsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
