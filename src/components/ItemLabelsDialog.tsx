import { useMemo } from "react"
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
import { useSystems } from "@/hooks/useSystems"
import { useProject } from "@/contexts/ProjectContext"
import { buildLabelsHtml, printLabels, type LabelData } from "@/lib/labels"
import { styledQrSvg } from "@/lib/qrStyled"
import { qrPayload, unitTag } from "@/lib/tags"
import type { Item } from "@/lib/types"

/**
 * QR labels for one or more items. Devices get one label per unit
 * (SKU-01, SKU-02 …); accessories get a single label for the whole line.
 * Pass `unit` to print just that unit. The preview is the exact print sheet.
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
  const { labelFor } = useSystems()
  const { data: serials = [] } = useItemSerialsForItems(items.map((i) => i.id))

  const labels = useMemo<LabelData[]>(() => {
    const out: LabelData[] = []
    for (const item of items) {
      if (!item.sku) continue
      const project = projects.find((p) => p.id === item.project_id)
      const qty = Math.max(1, Math.round(Number(item.qty_required)))
      const base = {
        projectName: project?.name ?? "",
        projectCode: project?.code ?? "",
        system: labelFor(item.system) || item.system,
        title: [item.brand, item.model_no].filter(Boolean).join(" · "),
        description: item.description,
      }
      if (item.tracking === "lot") {
        out.push({ ...base, tag: item.sku, qrSvg: styledQrSvg(qrPayload(item.sku)), serial: null, caption: `Lot · ${qty} pcs` })
        continue
      }
      for (let u = 1; u <= qty; u++) {
        if (unit && u !== unit) continue
        const tag = unitTag(item.sku, u)
        const serial = serials.find((r) => r.item_id === item.id && r.unit_index === u)?.serial_number ?? null
        out.push({ ...base, tag, qrSvg: styledQrSvg(qrPayload(tag)), serial, caption: `Unit ${u} of ${qty}` })
      }
    }
    return out
  }, [items, unit, projects, serials, labelFor])

  const html = useMemo(() => (labels.length ? buildLabelsHtml(labels.slice(0, 12)) : ""), [labels])

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>QR labels</DialogTitle>
          <DialogDescription>
            {labels.length} label{labels.length === 1 ? "" : "s"}. Scanning opens the unit's tracking page in FIT — only
            signed-in members of this project can see it.
          </DialogDescription>
        </DialogHeader>

        {labels.length === 0 ? (
          <p className="text-sm text-muted-foreground">These items have no SKU yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border bg-white">
            <iframe title="Label preview" srcDoc={html} className="h-[26rem] w-full" />
            {labels.length > 12 && (
              <p className="border-t bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                Showing the first 12 — all {labels.length} are printed.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button disabled={!labels.length} onClick={() => printLabels(labels)}>
            <Printer className="size-4" /> Print {labels.length > 1 ? `${labels.length} labels` : "label"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
