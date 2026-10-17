import { STATUS_LABELS, type Item } from "@/lib/types"
import { cn } from "@/lib/utils"

const PROGRESS: Record<string, number> = {
  // procurement
  quoted: 1 / 3,
  po_issued: 2 / 3,
  ordered: 1,
  // delivery
  partial: 0.5,
  delivered: 1,
  // installation
  in_progress: 0.5,
  installed: 1,
  commissioned: 1,
}

function Stage({ label, status, count }: { label: string; status: string; count?: string }) {
  const f = PROGRESS[status] ?? 0
  const done = f >= 1
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-[width]", done ? "bg-emerald-500" : "bg-amber-500")}
          style={{ width: `${Math.round(f * 100)}%` }}
        />
      </div>
      <div className="min-w-0 leading-tight">
        <div className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">{label}</div>
        <div
          className={cn(
            "truncate text-xs font-medium",
            f === 0 ? "text-muted-foreground" : done ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
          )}
        >
          {STATUS_LABELS[status] ?? status}
          {count && <span className="ml-1 font-normal opacity-80">{count}</span>}
        </div>
      </div>
    </div>
  )
}

/** Procurement → delivery → installation as one quiet three-step track. */
export function StageTrack({ item, className }: { item: Item; className?: string }) {
  const req = Math.round(Number(item.qty_required))
  const part = (n: number) => (req > 1 ? `${Math.round(Number(n))}/${req}` : undefined)
  return (
    <div className={cn("grid grid-cols-3 gap-3", className)}>
      <Stage label="Procure" status={item.procurement_status} />
      <Stage label="Deliver" status={item.delivery_status} count={item.delivery_status === "partial" ? part(item.qty_delivered) : undefined} />
      <Stage label="Install" status={item.installation_status} count={item.installation_status === "in_progress" ? part(item.qty_installed) : undefined} />
    </div>
  )
}
