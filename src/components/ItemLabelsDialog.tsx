import { useEffect, useMemo, useState } from "react"
import { Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useItemSerialsForItems } from "@/hooks/useItemSerials"
import { useProject } from "@/contexts/ProjectContext"
import { printLabels, type LabelData } from "@/lib/labels"
import { qrPayload, qrSvg, unitTag } from "@/lib/tags"
import type { Item } from "@/lib/types"

interface Spec {
  tag: string
  item: Item
  unit: number | null
}

/**
 * QR labels for one or more items. Devices get one label per unit
 * (SKU-01, SKU-02 …); accessories get a single label for the whole line.
 * Pass `unit` to print just that unit.
 */
export function ItemLabelsDialog({
  items,
  unit,
  onClose,
}: {
  items: Item[]
  unit?: number
  onClose: () => void
}) {
  const open = items.length > 0
  const { projects } = useProject()
  const { data: serials = [] } = useItemSerialsForItems(items.map((i) => i.id))
  const [svgs, setSvgs] = useState<Record<string, string>>({})

  const specs = useMemo<Spec[]>(() => {
    const out: Spec[] = []
    for (const item of items) {
      if (!item.sku) continue
      if (item.tracking === "lot") {
        out.push({ tag: item.sku, item, unit: null })
        continue
      }
      const n = Math.max(1, Math.round(Number(item.qty_required)))
      for (let u = 1; u <= n; u++) {
        if (unit && u !== unit) continue
        out.push({ tag: unitTag(item.sku, u), item, unit: u })
      }
    }
    return out
  }, [items, unit])

  const key = specs.map((s) => s.tag).join("|")
  useEffect(() => {
    let live = true
    Promise.all(specs.map(async (s) => [s.tag, await qrSvg(qrPayload(s.tag))] as const)).then((rows) => {
      if (live) setSvgs(Object.fromEntries(rows))
    })
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const labels: LabelData[] = specs.map((s) => {
    const serial = s.unit ? serials.find((r) => r.item_id === s.item.id && r.unit_index === s.unit)?.serial_number ?? null : null
    const qty = Math.round(Number(s.item.qty_required))
    return {
      tag: s.tag,
      qrSvg: svgs[s.tag] ?? "",
      sku: s.item.sku ?? "",
      title: [s.item.brand, s.item.model_no].filter(Boolean).join(" · "),
      serial,
      caption: s.unit ? `Unit ${s.unit} of ${qty}` : `Lot · ${qty} pcs`,
      projectCode: projects.find((p) => p.id === s.item.project_id)?.code ?? "",
    }
  })
  const ready = labels.length > 0 && labels.every((l) => l.qrSvg)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>QR labels</DialogTitle>
          <DialogDescription>
            {labels.length} label{labels.length === 1 ? "" : "s"}. Scanning one opens that exact unit here. Print on sticker
            paper and stick it on the device or box.
          </DialogDescription>
        </DialogHeader>

        {labels.length === 0 ? (
          <p className="text-sm text-muted-foreground">These items have no SKU yet.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {labels.slice(0, 24).map((l) => (
              <div key={l.tag} className="flex items-center gap-3 border border-neutral-800 bg-white p-2.5 text-neutral-900">
                <div className="size-20 shrink-0 [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: l.qrSvg }} />
                <div className="min-w-0 font-sans text-xs leading-snug">
                  <div className="text-[9px] font-bold tracking-[0.18em] text-neutral-500 uppercase">Frontline · {l.projectCode}</div>
                  <div className="mt-0.5 text-base font-bold tracking-wide">{l.tag}</div>
                  <div className="line-clamp-2 font-medium">{l.title || "—"}</div>
                  <div className="mt-1 flex justify-between gap-3 border-t border-neutral-300 pt-1 text-[10px] text-neutral-600">
                    <span>{l.caption}</span>
                    <span className="truncate">S/N {l.serial ?? "—"}</span>
                  </div>
                </div>
              </div>
            ))}
            {labels.length > 24 && (
              <p className="text-xs text-muted-foreground sm:col-span-2">…and {labels.length - 24} more in the printout.</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button disabled={!ready} onClick={() => printLabels(labels)}>
            <Printer className="size-4" /> Print {labels.length > 1 ? `${labels.length} labels` : "label"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

