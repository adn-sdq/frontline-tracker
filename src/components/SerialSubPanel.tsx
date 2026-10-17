import { useState } from "react"
import { Loader2, QrCode } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { ItemLabelsDialog } from "@/components/ItemLabelsDialog"
import { ScanDialog } from "@/components/scan/ScanDialog"
import { useItemSerials } from "@/hooks/useItemSerials"
import { unitTag } from "@/lib/tags"
import type { Item } from "@/lib/types"

/** One slot per unit: its number, serial (optional) and a QR label for that exact unit. */
export function SerialSubPanel({ item }: { item: Item }) {
  const qty = Math.round(Number(item.qty_required))
  const { data: serials = [], isLoading } = useItemSerials(item.id)
  const [labelUnit, setLabelUnit] = useState<number | null>(null)
  const [openTag, setOpenTag] = useState<string | null>(null)
  const filled = serials.filter((s) => s.serial_number).length

  return (
    <div className="border-t bg-muted/20 px-4 py-3">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Serial Numbers
        </span>
        {!isLoading && (
          <Badge variant={filled === qty && qty > 0 ? "default" : "secondary"} className="text-xs">
            {filled} / {qty}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Loading…
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: qty }, (_, i) => {
            const unitIndex = i + 1
            const serial = serials.find((s) => s.unit_index === unitIndex)?.serial_number ?? null
            const tag = item.sku ? unitTag(item.sku, unitIndex) : null
            return (
              <div
                key={unitIndex}
                className={[
                  "flex items-center gap-2 rounded-md border px-2 py-1.5",
                  serial ? "bg-background" : "border-dashed bg-muted/30",
                ].join(" ")}
              >
                {tag ? (
                  <button
                    type="button"
                    onClick={() => setOpenTag(tag)}
                    title={`Open ${tag}`}
                    className="w-5 shrink-0 text-right font-mono text-[10px] font-bold text-muted-foreground hover:text-primary"
                  >
                    {unitIndex}
                  </button>
                ) : (
                  <span className="w-5 shrink-0 text-right font-mono text-[10px] font-bold text-muted-foreground">{unitIndex}</span>
                )}
                <span
                  className={[
                    "min-w-0 flex-1 truncate font-mono text-xs",
                    serial ? "text-foreground" : "text-muted-foreground/40",
                  ].join(" ")}
                >
                  {serial ?? "—"}
                </span>
                {tag && (
                  <button
                    type="button"
                    onClick={() => setLabelUnit(unitIndex)}
                    aria-label={`QR label for unit ${unitIndex}`}
                    title="QR label"
                    className="shrink-0 rounded p-0.5 text-muted-foreground/60 transition-colors hover:text-primary"
                  >
                    <QrCode className="size-3.5" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ScanDialog open={!!openTag} onOpenChange={(o) => !o && setOpenTag(null)} initialTag={openTag} />
      <ItemLabelsDialog items={labelUnit ? [item] : []} unit={labelUnit ?? undefined} onClose={() => setLabelUnit(null)} />
    </div>
  )
}
