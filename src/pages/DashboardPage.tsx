import { useMemo } from "react"
import { Loader2 } from "lucide-react"
import * as Progress from "@radix-ui/react-progress"

import { useItems } from "@/hooks/useItems"
import { useSystems } from "@/hooks/useSystems"
import {
  PROCUREMENT_STATUSES,
  DELIVERY_STATUSES,
  INSTALLATION_STATUSES,
  STATUS_LABELS,
  STATUS_STYLES,
} from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Summarise qty fields for an array of items
function summarise(items: { qty_required: number; qty_ordered: number; qty_delivered: number; qty_installed: number }[]) {
  return items.reduce(
    (acc, it) => ({
      required: acc.required + (it.qty_required ?? 0),
      ordered: acc.ordered + (it.qty_ordered ?? 0),
      delivered: acc.delivered + (it.qty_delivered ?? 0),
      installed: acc.installed + (it.qty_installed ?? 0),
    }),
    { required: 0, ordered: 0, delivered: 0, installed: 0 }
  )
}

function pct(num: number, den: number) {
  if (!den) return 0
  return Math.round((num / den) * 100)
}

function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <Progress.Root
      className="relative h-2 w-full overflow-hidden rounded-full bg-secondary"
      value={value}
    >
      <Progress.Indicator
        className={cn("h-full w-full flex-1 transition-all duration-500", className ?? "bg-primary")}
        style={{ transform: `translateX(-${100 - value}%)` }}
      />
    </Progress.Root>
  )
}

function StatRow({
  label,
  value,
  total,
  barClass,
}: {
  label: string
  value: number
  total: number
  barClass: string
}) {
  const p = pct(value, total)
  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums font-medium">
          {value}/{total}
          <span className="ml-1.5 text-xs text-muted-foreground">({p}%)</span>
        </span>
      </div>
      <ProgressBar value={p} className={barClass} />
    </div>
  )
}

function StatusPills({
  items,
  field,
  statuses,
}: {
  items: Record<string, string>[]
  field: string
  statuses: readonly string[]
}) {
  const counts: Record<string, number> = {}
  for (const it of items) {
    const v = it[field] ?? "unknown"
    counts[v] = (counts[v] ?? 0) + 1
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {statuses.map((s) => (
        counts[s] ? (
          <Badge key={s} className={cn("font-normal", STATUS_STYLES[s])}>
            {STATUS_LABELS[s] ?? s} · {counts[s]}
          </Badge>
        ) : null
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { data: allItems = [], isLoading } = useItems()
  const { systems, labelFor } = useSystems()

  const overall = useMemo(() => summarise(allItems), [allItems])

  const perSystem = useMemo(() =>
    systems.map((sys) => {
      const items = allItems.filter((it) => it.system === sys.key)
      return { sys, items, totals: summarise(items) }
    }),
    [allItems, systems]
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Procurement progress across all systems — {allItems.length} line items total.
        </p>
      </div>

      {/* Overall summary */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold">Overall</h2>
        <div className="grid gap-3">
          <StatRow
            label="Ordered"
            value={overall.ordered}
            total={overall.required}
            barClass="bg-violet-500"
          />
          <StatRow
            label="Delivered"
            value={overall.delivered}
            total={overall.required}
            barClass="bg-blue-500"
          />
          <StatRow
            label="Installed"
            value={overall.installed}
            total={overall.required}
            barClass="bg-emerald-500"
          />
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {(
            [
              ["Required", overall.required, "text-foreground"],
              ["Ordered", overall.ordered, "text-violet-600 dark:text-violet-400"],
              ["Delivered", overall.delivered, "text-blue-600 dark:text-blue-400"],
              ["Installed", overall.installed, "text-emerald-600 dark:text-emerald-400"],
            ] as const
          ).map(([label, val, cls]) => (
            <div key={label} className="rounded-lg border bg-muted/30 p-3 text-center">
              <div className={cn("text-2xl font-bold tabular-nums", cls)}>{val}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-system breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        {perSystem.map(({ sys, items, totals }) => (
          <div key={sys.key} className="rounded-xl border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Badge variant="outline" className="font-mono">{sys.key}</Badge>
              <span className="font-semibold">{labelFor(sys.key) || sys.label}</span>
              <span className="ml-auto text-xs text-muted-foreground">{items.length} items</span>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No items yet.</p>
            ) : (
              <>
                <div className="grid gap-3">
                  <StatRow
                    label="Ordered"
                    value={totals.ordered}
                    total={totals.required}
                    barClass="bg-violet-500"
                  />
                  <StatRow
                    label="Delivered"
                    value={totals.delivered}
                    total={totals.required}
                    barClass="bg-blue-500"
                  />
                  <StatRow
                    label="Installed"
                    value={totals.installed}
                    total={totals.required}
                    barClass="bg-emerald-500"
                  />
                </div>

                <div className="mt-4 grid gap-2 border-t pt-3">
                  <div className="text-xs font-medium text-muted-foreground">Procurement status</div>
                  <StatusPills
                    items={items as unknown as Record<string, string>[]}
                    field="procurement_status"
                    statuses={PROCUREMENT_STATUSES}
                  />
                  <div className="text-xs font-medium text-muted-foreground">Delivery</div>
                  <StatusPills
                    items={items as unknown as Record<string, string>[]}
                    field="delivery_status"
                    statuses={DELIVERY_STATUSES}
                  />
                  <div className="text-xs font-medium text-muted-foreground">Installation</div>
                  <StatusPills
                    items={items as unknown as Record<string, string>[]}
                    field="installation_status"
                    statuses={INSTALLATION_STATUSES}
                  />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
