import { useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { format, formatDistanceToNow } from "date-fns"
import { ArrowLeft, History, Pencil, QrCode, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { ItemAttachments, ItemEditPanel, SerialsSection } from "@/components/ItemDialog"
import { ItemHistoryList } from "@/components/ItemHistoryList"
import { ItemLabelsDialog } from "@/components/ItemLabelsDialog"
import { SerialSubPanel } from "@/components/SerialSubPanel"
import { StageTrack } from "@/components/StageTrack"
import { useAuth } from "@/contexts/AuthContext"
import { useProject } from "@/contexts/ProjectContext"
import { useDeleteItem, useItemsRealtime, useProfiles } from "@/hooks/useItems"
import { useSystems } from "@/hooks/useSystems"
import { supabase } from "@/lib/supabase"
import { errorMessage } from "@/lib/utils"
import type { Item } from "@/lib/types"

function useItem(id: string | undefined) {
  return useQuery<Item | null>({
    // Under ["items"] so every item change refreshes this view too.
    queryKey: ["items", "one", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("items").select("*").eq("id", id!).maybeSingle()
      if (error) throw error
      return data as Item | null
    },
  })
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children || <span className="text-muted-foreground/50">—</span>}</dd>
    </div>
  )
}

/** Full view of one procurement item. */
export default function ItemPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const editable = useAuth().canEdit("tracker")
  const { projects } = useProject()
  const { labelFor } = useSystems()
  const { data: profiles = {} } = useProfiles()
  const del = useDeleteItem()
  useItemsRealtime()
  const { data: item, isLoading } = useItem(id)
  const [params, setParams] = useSearchParams()
  const [editing, setEditingState] = useState(params.get("edit") === "1")
  const setEditing = (v: boolean) => {
    setEditingState(v)
    setParams((p) => { if (v) p.set("edit", "1"); else p.delete("edit"); return p }, { replace: true })
  }
  const [labelsOpen, setLabelsOpen] = useState(false)

  if (isLoading) return <div className="flex justify-center py-16"><Spinner className="size-6" /></div>
  if (!item) {
    return (
      <EmptyState
        title="Item not found"
        description="It may have been deleted, or it belongs to a project you can't see."
        action={<Button onClick={() => navigate("/")}>Back to procurement</Button>}
      />
    )
  }

  const who = (uid: string | null) => (uid ? profiles[uid]?.full_name ?? profiles[uid]?.username ?? "Someone" : "—")
  const project = projects.find((p) => p.id === item.project_id)
  const qty = (n: unknown) => Math.round(Number(n ?? 0))
  const isLot = item.tracking === "lot"

  async function remove() {
    if (!item) return
    const ok = await confirm({
      title: "Delete this item?",
      description: `${[item.brand, item.model_no].filter(Boolean).join(" ") || item.sku} will be removed. History is kept.`,
      confirmText: "Delete",
      destructive: true,
    })
    if (!ok) return
    try {
      await del.mutateAsync(item.id)
      toast.success("Item deleted")
      navigate("/")
    } catch (e) {
      toast.error("Could not delete", { description: errorMessage(e) })
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link to="/"><ArrowLeft className="size-4" /> Procurement</Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-mono font-bold text-primary">{item.sku}</span>
            <Badge variant="outline">{labelFor(item.system) || item.system}</Badge>
            <Badge variant="secondary">{isLot ? `Lot · ${qty(item.qty_required)} pcs` : `${qty(item.qty_required)} units`}</Badge>
          </div>
          <h1 className="mt-1.5 truncate text-2xl font-semibold tracking-tight">
            {[item.brand, item.model_no].filter(Boolean).join(" · ") || "Item"}
          </h1>
          {item.description && <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{item.description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setLabelsOpen(true)} disabled={!item.sku}>
            <QrCode className="size-4" /> Labels
          </Button>
          {editable && (
            <>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={remove}>
                <Trash2 className="size-4" /> Delete
              </Button>
              {!editing && (
                <Button size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="size-4" /> Edit
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {editing ? (
        <ItemEditPanel item={item} onDone={() => setEditing(false)} />
      ) : (
      <>
      {/* Progress */}
      <div className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-[1fr_auto] md:items-center">
        <StageTrack item={item} />
        <div className="grid grid-cols-4 gap-2 text-center md:w-80">
          {(
            [
              ["Required", item.qty_required],
              ["Ordered", item.qty_ordered],
              ["Delivered", item.qty_delivered],
              ["Installed", item.qty_installed],
            ] as const
          ).map(([l, v]) => (
            <div key={l} className="rounded-lg bg-muted/50 px-2 py-2">
              <div className="text-lg font-semibold tabular-nums">{qty(v)}</div>
              <div className="text-[11px] text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Tabs defaultValue={isLot ? "files" : "units"} className="min-w-0">
          <TabsList>
            {!isLot && <TabsTrigger value="units">Units & serials</TabsTrigger>}
            <TabsTrigger value="files">Attachments</TabsTrigger>
            <TabsTrigger value="history"><History className="size-3.5" /> History</TabsTrigger>
          </TabsList>
          {!isLot && (
            <TabsContent value="units" className="mt-3 rounded-xl border bg-card">
              {editable ? (
                <div className="p-4"><SerialsSection itemId={item.id} qty={qty(item.qty_required)} /></div>
              ) : (
                <SerialSubPanel item={item} />
              )}
            </TabsContent>
          )}
          <TabsContent value="files" className="mt-3 rounded-xl border bg-card p-4">
            <ItemAttachments itemId={item.id} />
          </TabsContent>
          <TabsContent value="history" className="mt-3 rounded-xl border bg-card p-4">
            <ItemHistoryList itemId={item.id} />
          </TabsContent>
        </Tabs>

        <aside className="flex flex-col gap-4">
          <div className="rounded-xl border bg-card px-4 py-2">
            <dl className="divide-y">
              <Detail label="Project">{project?.name}</Detail>
              <Detail label="Supplier">{item.supplier}</Detail>
              <Detail label="ETA">{item.eta ? format(new Date(item.eta), "d MMM yyyy") : null}</Detail>
              <Detail label="Install at">{item.location}</Detail>
              <Detail label="Reference">{item.unique_id && <span className="font-mono">{item.unique_id}</span>}</Detail>
              <Detail label="Created">{who(item.created_by)}</Detail>
              <Detail label="Last edit">
                {who(item.updated_by)} · {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
              </Detail>
            </dl>
          </div>
          {item.notes && (
            <div className="rounded-xl border bg-card p-4">
              <div className="mb-1 text-xs font-medium text-muted-foreground">Notes</div>
              <p className="text-sm whitespace-pre-wrap">{item.notes}</p>
            </div>
          )}
        </aside>
      </div>

      </>
      )}
      <ItemLabelsDialog items={labelsOpen ? [item] : []} onClose={() => setLabelsOpen(false)} />
    </div>
  )
}
