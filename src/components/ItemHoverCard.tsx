import type { ReactNode } from "react"
import { format } from "date-fns"

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { StageTrack } from "@/components/StageTrack"
import { useSystems } from "@/hooks/useSystems"
import type { Item } from "@/lib/types"

/** Hover an item's name to see the essentials without opening it. */
export function ItemHoverCard({ item, children }: { item: Item; children: ReactNode }) {
  const { labelFor } = useSystems()
  const q = (n: unknown) => Math.round(Number(n ?? 0))
  const rows: [string, ReactNode][] = [
    ["System", labelFor(item.system) || item.system],
    ["Supplier", item.supplier],
    ["ETA", item.eta ? format(new Date(item.eta), "d MMM yyyy") : null],
    ["Install at", item.location],
    ["Reference", item.unique_id],
    ["Tracking", item.tracking === "lot" ? "One lot" : "Per unit"],
  ]
  return (
    <HoverCard>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-80" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-mono text-xs font-bold text-primary">{item.sku}</div>
            <div className="mt-0.5 truncate text-sm font-semibold">{[item.brand, item.model_no].filter(Boolean).join(" · ") || "—"}</div>
          </div>
        </div>
        {item.description && <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{item.description}</p>}

        <div className="mt-3 grid grid-cols-4 gap-1 rounded-md bg-muted/50 p-2 text-center">
          {(
            [
              ["Req", item.qty_required],
              ["Ord", item.qty_ordered],
              ["Del", item.qty_delivered],
              ["Inst", item.qty_installed],
            ] as const
          ).map(([l, v]) => (
            <div key={l}>
              <div className="text-sm font-semibold tabular-nums">{q(v)}</div>
              <div className="text-[10px] text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>

        <StageTrack item={item} className="mt-3" />

        <dl className="mt-3 grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-2 gap-y-1 text-xs">
          {rows
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="truncate">{v}</dd>
              </div>
            ))}
        </dl>
      </HoverCardContent>
    </HoverCard>
  )
}
