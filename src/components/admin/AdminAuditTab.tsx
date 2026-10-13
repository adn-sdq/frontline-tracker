import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useProfiles } from "@/hooks/useItems"
import { supabase } from "@/lib/supabase"

type Source = "account" | "item" | "document"

interface AuditEntry {
  key: string
  source: Source
  at: string
  by: string | null
  action: string
  target: string
  fields: string[]
}

const LIMIT = 150

const SOURCE_LABELS: Record<Source, string> = { account: "Account", item: "Procurement", document: "Document" }

type Row = {
  id: number
  changed_by: string | null
  changed_at: string
  action: string
  diff: Record<string, unknown> | null
  snapshot?: Record<string, unknown> | null
}

async function fetchRows(table: string, cols: string): Promise<Row[]> {
  const { data, error } = await supabase.from(table).select(cols).order("changed_at", { ascending: false }).limit(LIMIT)
  // A table that doesn't exist yet (migration not applied) shouldn't break the log.
  if (error) return []
  return (data ?? []) as unknown as Row[]
}

const str = (v: unknown) => (typeof v === "string" && v ? v : null)

/** Combined, most-recent-first trail of account, procurement and document changes. */
export function AdminAuditTab() {
  const { data: profiles = {} } = useProfiles()
  const [source, setSource] = useState<"ALL" | Source>("ALL")
  const [actor, setActor] = useState("ALL")

  const { data, isLoading } = useQuery({
    queryKey: ["admin_audit"],
    queryFn: async () => {
      const [acc, items, docs] = await Promise.all([
        fetchRows("profile_history", "id, profile_id, changed_by, changed_at, action, diff"),
        fetchRows("item_history", "id, item_id, changed_by, changed_at, action, diff, snapshot"),
        fetchRows("document_history", "id, document_id, changed_by, changed_at, action, diff, snapshot, file_name"),
      ])
      return { acc, items, docs }
    },
    staleTime: 30_000,
  })

  const name = (id: string | null | undefined) =>
    !id ? "System" : profiles[id]?.full_name ?? profiles[id]?.username ?? "Unknown user"

  const entries = useMemo<AuditEntry[]>(() => {
    if (!data) return []
    const out: AuditEntry[] = []
    for (const r of data.acc as (Row & { profile_id: string })[]) {
      out.push({ key: `a${r.id}`, source: "account", at: r.changed_at, by: r.changed_by, action: r.action, target: name(r.profile_id), fields: Object.keys(r.diff ?? {}) })
    }
    for (const r of data.items) {
      const s = r.snapshot ?? {}
      out.push({
        key: `i${r.id}`,
        source: "item",
        at: r.changed_at,
        by: r.changed_by,
        action: r.action,
        target: [str(s.brand), str(s.model_no)].filter(Boolean).join(" ") || str(s.description)?.split("\n")[0] || "Item",
        fields: Object.keys(r.diff ?? {}),
      })
    }
    for (const r of data.docs as (Row & { file_name: string | null })[]) {
      const title = str(r.snapshot?.title)
      out.push({
        key: `d${r.id}`,
        source: "document",
        at: r.changed_at,
        by: r.changed_by,
        action: r.action.replace("_", " "),
        target: r.file_name ? `${r.file_name}${title ? ` (${title})` : ""}` : title ?? "Document",
        fields: Object.keys(r.diff ?? {}),
      })
    }
    return out.sort((a, b) => b.at.localeCompare(a.at))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, profiles])

  const actors = [...new Set(entries.map((e) => e.by).filter((x): x is string => !!x))]
  const shown = entries.filter((e) => (source === "ALL" || e.source === source) && (actor === "ALL" || e.by === actor))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={source} onValueChange={(v) => setSource(v as typeof source)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All sources</SelectItem>
            {(Object.keys(SOURCE_LABELS) as Source[]).map((s) => <SelectItem key={s} value={s}>{SOURCE_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={actor} onValueChange={setActor}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Anyone</SelectItem>
            {actors.map((id) => <SelectItem key={id} value={id}>{name(id)}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-muted-foreground">Latest {LIMIT} changes per source</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Spinner className="size-5" /></div>
      ) : shown.length === 0 ? (
        <EmptyState title="No changes recorded" compact />
      ) : (
        <div className="divide-y rounded-lg border">
          {shown.map((e) => (
            <div key={e.key} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-3 py-2 text-sm">
              <span className="w-32 shrink-0 text-xs text-muted-foreground tabular-nums">{format(new Date(e.at), "d MMM, HH:mm")}</span>
              <Badge variant="outline" className="shrink-0 text-[10px]">{SOURCE_LABELS[e.source]}</Badge>
              <span className="min-w-0 flex-1">
                <span className="font-medium">{name(e.by)}</span>{" "}
                <span className="text-muted-foreground">{e.action}</span>{" "}
                <span className="break-words">{e.target}</span>
                {e.fields.length > 0 && (
                  <span className="text-xs text-muted-foreground"> — {e.fields.slice(0, 4).join(", ")}{e.fields.length > 4 ? ` +${e.fields.length - 4}` : ""}</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
