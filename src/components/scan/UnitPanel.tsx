import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { AlertTriangle, Loader2, MapPin, MoveRight, PackageCheck, Printer, StickyNote, Wrench } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { ItemLabelsDialog } from "@/components/ItemLabelsDialog"
import { StageTrack } from "@/components/StageTrack"
import { useAuth } from "@/contexts/AuthContext"
import { useProject } from "@/contexts/ProjectContext"
import { useProfiles } from "@/hooks/useItems"
import { useUpsertSerial } from "@/hooks/useItemSerials"
import { useAddUnitEvent, useResolvedTag, useUnitEvents } from "@/hooks/useUnits"
import { useSystems } from "@/hooks/useSystems"
import { unitTag } from "@/lib/tags"
import { UNIT_EVENT_LABELS, type UnitEventKind } from "@/lib/types"
import { cn, errorMessage } from "@/lib/utils"

const ACTIONS: { kind: UnitEventKind; icon: typeof Wrench; hint: string; askLocation: boolean }[] = [
  { kind: "received", icon: PackageCheck, hint: "Arrived on site or in store", askLocation: true },
  { kind: "moved", icon: MoveRight, hint: "Moved to a new place", askLocation: true },
  { kind: "installed", icon: Wrench, hint: "Fitted in its final position", askLocation: true },
  { kind: "issue", icon: AlertTriangle, hint: "Damaged, faulty or missing parts", askLocation: false },
  { kind: "note", icon: StickyNote, hint: "Anything else worth recording", askLocation: false },
]

const KIND_DOT: Record<UnitEventKind, string> = {
  received: "bg-sky-500",
  moved: "bg-violet-500",
  installed: "bg-emerald-500",
  issue: "bg-red-500",
  note: "bg-muted-foreground/50",
}

/** One scanned unit (or lot): what it is, where it stands, and what has happened to it. */
export function UnitPanel({ tag }: { tag: string }) {
  const editable = useAuth().canEdit("tracker")
  const { projects, currentProjectId } = useProject()
  const { labelFor } = useSystems()
  const { data: profiles = {} } = useProfiles()
  const { data: found, isLoading } = useResolvedTag(tag)
  const item = found?.item ?? null
  const unit = found?.unit ?? null
  const { data: allEvents = [] } = useUnitEvents(item?.id ?? null)
  const addEvent = useAddUnitEvent()
  const upsertSerial = useUpsertSerial()

  const [pick, setPick] = useState<UnitEventKind | null>(null)
  const [where, setWhere] = useState("")
  const [note, setNote] = useState("")
  const [serialDraft, setSerialDraft] = useState("")
  const [labelOpen, setLabelOpen] = useState(false)

  useEffect(() => setSerialDraft(found?.serial ?? ""), [found?.serial])

  if (isLoading) return <div className="flex justify-center py-12"><Spinner className="size-5" /></div>
  if (!item?.sku) return <p className="py-8 text-center text-sm text-muted-foreground">Nothing found for “{tag}”.</p>

  const lot = item.tracking === "lot"
  const qty = Math.round(Number(item.qty_required))
  const shownTag = lot || unit === null ? item.sku : unitTag(item.sku, unit)
  const events = allEvents.filter((e) => (lot ? e.unit_index === null : unit === null ? true : e.unit_index === unit))
  const project = projects.find((p) => p.id === item.project_id)
  const action = ACTIONS.find((a) => a.kind === pick)
  const who = (id: string | null) => (id ? profiles[id]?.full_name ?? profiles[id]?.username ?? "Someone" : "Someone")

  async function submit() {
    if (!pick || !item) return
    try {
      await addEvent.mutateAsync({ itemId: item.id, unit: lot ? null : unit, kind: pick, location: where, note })
      toast.success(`${UNIT_EVENT_LABELS[pick]} recorded`)
      setPick(null)
      setWhere("")
      setNote("")
    } catch (e) {
      toast.error("Could not save", { description: errorMessage(e) })
    }
  }

  async function saveSerial() {
    if (!item || unit === null || serialDraft.trim() === (found?.serial ?? "")) return
    try {
      await upsertSerial.mutateAsync({ itemId: item.id, unitIndex: unit, serialNumber: serialDraft.trim() })
      toast.success("Serial saved")
    } catch (e) {
      toast.error("Could not save serial", { description: errorMessage(e) })
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Identity */}
      <div>
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-mono font-semibold text-primary">{shownTag}</span>
          <span className="text-muted-foreground">
            {labelFor(item.system) || item.system}
            {project && project.id !== currentProjectId && ` · ${project.name}`}
          </span>
        </div>
        <h3 className="mt-1 text-lg leading-snug font-semibold">{[item.brand, item.model_no].filter(Boolean).join(" ") || "Item"}</h3>
        {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{lot ? `Lot of ${qty}` : unit ? `Unit ${unit} of ${qty}` : `${qty} units`}</span>
          {item.location && (
            <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> Install at {item.location}</span>
          )}
        </div>
      </div>

      <StageTrack item={item} />

      {!lot && unit !== null && (
        <div className="grid gap-1.5">
          <span className="text-xs text-muted-foreground">Serial number</span>
          {editable ? (
            <div className="relative">
              <Input
                value={serialDraft}
                onChange={(e) => setSerialDraft(e.target.value)}
                onBlur={saveSerial}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                placeholder="Not recorded yet"
                className="font-mono"
              />
              {upsertSerial.isPending && <Loader2 className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
            </div>
          ) : (
            <span className="font-mono text-sm">{found?.serial ?? "—"}</span>
          )}
        </div>
      )}

      {editable && (
        <div className="grid gap-2">
          <span className="text-xs text-muted-foreground">Record what happened</span>
          <div className="flex flex-wrap gap-1.5">
            {ACTIONS.map((a) => (
              <Button key={a.kind} size="sm" variant={pick === a.kind ? "default" : "outline"} title={a.hint} onClick={() => setPick(pick === a.kind ? null : a.kind)}>
                <a.icon className="size-3.5" /> {UNIT_EVENT_LABELS[a.kind]}
              </Button>
            ))}
          </div>
          {action && (
            <div className="grid gap-2 rounded-lg border bg-muted/30 p-3">
              {action.askLocation && (
                <Input value={where} onChange={(e) => setWhere(e.target.value)} placeholder="Where? e.g. Store A, Level 3 – Room 305" autoFocus />
              )}
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder={action.askLocation ? "Note (optional)" : action.hint} />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setPick(null)}>Cancel</Button>
                <Button size="sm" onClick={submit} disabled={addEvent.isPending || (!action.askLocation && !note.trim())}>
                  {addEvent.isPending && <Loader2 className="size-4 animate-spin" />} Save
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="grid gap-2">
        <span className="text-xs text-muted-foreground">History</span>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground/70">No updates recorded yet.</p>
        ) : (
          <ol className="relative ml-1 flex flex-col gap-3 border-l pl-4">
            {events.map((e) => (
              <li key={e.id} className="relative text-sm">
                <span className={cn("absolute top-1.5 -left-[21px] size-2.5 rounded-full ring-2 ring-background", KIND_DOT[e.kind])} />
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium">{UNIT_EVENT_LABELS[e.kind]}</span>
                  {e.location && <span>{e.location}</span>}
                </div>
                {e.note && <p className="whitespace-pre-wrap text-muted-foreground">{e.note}</p>}
                <p className="text-xs text-muted-foreground">
                  {who(e.created_by)} · {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setLabelOpen(true)}>
          <Printer className="size-4" /> Print label
        </Button>
      </div>

      <ItemLabelsDialog items={labelOpen ? [item] : []} unit={lot ? undefined : unit ?? undefined} onClose={() => setLabelOpen(false)} />
      {!editable && <Badge variant="secondary" className="self-start">View only</Badge>}
    </div>
  )
}
