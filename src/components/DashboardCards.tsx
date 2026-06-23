import { Boxes, PackageCheck, Truck, Wrench } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Item } from "@/lib/types"

function pct(n: number, d: number) {
  if (!d) return 0
  return Math.round((n / d) * 100)
}

export function DashboardCards({ items }: { items: Item[] }) {
  const total = items.length
  const reqQty = items.reduce((s, i) => s + (i.qty_required || 0), 0)
  const ordered = items.reduce((s, i) => s + (i.qty_ordered || 0), 0)
  const delivered = items.reduce((s, i) => s + (i.qty_delivered || 0), 0)
  const installed = items.reduce((s, i) => s + (i.qty_installed || 0), 0)

  const cards = [
    {
      label: "Line items",
      value: total.toLocaleString(),
      sub: `${reqQty.toLocaleString()} units required`,
      icon: Boxes,
      progress: null as number | null,
      tint: "text-chart-1",
    },
    {
      label: "Ordered",
      value: `${pct(ordered, reqQty)}%`,
      sub: `${ordered.toLocaleString()} / ${reqQty.toLocaleString()} units`,
      icon: PackageCheck,
      progress: pct(ordered, reqQty),
      tint: "text-chart-5",
    },
    {
      label: "Delivered",
      value: `${pct(delivered, reqQty)}%`,
      sub: `${delivered.toLocaleString()} / ${reqQty.toLocaleString()} units`,
      icon: Truck,
      progress: pct(delivered, reqQty),
      tint: "text-chart-3",
    },
    {
      label: "Installed",
      value: `${pct(installed, reqQty)}%`,
      sub: `${installed.toLocaleString()} / ${reqQty.toLocaleString()} units`,
      icon: Wrench,
      progress: pct(installed, reqQty),
      tint: "text-chart-2",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label} className="gap-3 py-4">
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {c.label}
              </span>
              <c.icon className={`size-4 ${c.tint}`} />
            </div>
            <div className="text-2xl font-semibold tracking-tight">{c.value}</div>
            {c.progress !== null && <Progress value={c.progress} />}
            <span className="text-xs text-muted-foreground">{c.sub}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
