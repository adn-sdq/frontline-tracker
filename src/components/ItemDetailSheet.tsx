import { format } from "date-fns"
import { CalendarDays, History, MapPin, Package, Pencil, Trash2 } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "@/components/StatusControls"
import { useSystems } from "@/hooks/useSystems"
import { SYSTEM_LABELS, type Item, type Profile } from "@/lib/types"

interface Props {
  item: Item | null
  profiles: Record<string, Profile>
  onEdit: (item: Item) => void
  onHistory: (item: Item) => void
  onDelete: (item: Item) => void
  onClose: () => void
}

export function ItemDetailSheet({
  item,
  profiles,
  onEdit,
  onHistory,
  onDelete,
  onClose,
}: Props) {
  const { labelFor } = useSystems()

  function who(id: string | null) {
    if (!id) return "—"
    const p = profiles[id]
    return p?.full_name ?? p?.username ?? "Unknown"
  }

  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && onClose()}>
      {/* p-0 so we control all padding; overflow-hidden keeps the sheet tidy */}
      <SheetContent
        side="right"
        className="flex w-full flex-col overflow-hidden p-0 sm:max-w-md"
      >
        {/* ── Sticky header ───────────────────────────────────────────── */}
        <SheetHeader className="shrink-0 border-b px-6 pb-4 pt-6 pr-12">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-medium">
              {labelFor(item?.system) ||
                SYSTEM_LABELS[item?.system ?? ""] ||
                item?.system}
            </Badge>
            {item?.unique_id && (
              <span className="font-mono text-sm font-semibold text-primary">
                {item.unique_id}
              </span>
            )}
          </div>
          <SheetTitle className="text-base leading-snug">
            {[item?.brand, item?.model_no].filter(Boolean).join(" · ") || "—"}
          </SheetTitle>
          {item?.description && (
            <p className="text-sm text-muted-foreground">{item.description}</p>
          )}
        </SheetHeader>

        {/* ── Scrollable body ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {item && (
            <div className="flex flex-col gap-5">
              {/* Meta row */}
              {(item.location || item.supplier || item.eta) && (
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                  {item.location && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="size-3.5" />
                      {item.location}
                    </span>
                  )}
                  {item.supplier && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Package className="size-3.5" />
                      {item.supplier}
                    </span>
                  )}
                  {item.eta && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <CalendarDays className="size-3.5" />
                      {format(new Date(item.eta), "d MMM yyyy")}
                    </span>
                  )}
                </div>
              )}

              {/* Quantities */}
              <div className="grid grid-cols-4 gap-2 text-center">
                {(
                  [
                    ["Required", item.qty_required],
                    ["Ordered", item.qty_ordered],
                    ["Delivered", item.qty_delivered],
                    ["Installed", item.qty_installed],
                  ] as const
                ).map(([label, val]) => (
                  <div
                    key={label}
                    className="rounded-lg border bg-muted/30 p-2.5"
                  >
                    <div className="text-xl font-bold tabular-nums">{val}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Statuses */}
              <div className="grid gap-2">
                <StatusRow label="Procurement" status={item.procurement_status} />
                <StatusRow label="Delivery" status={item.delivery_status} />
                <StatusRow label="Installation" status={item.installation_status} />
              </div>

              {/* Notes */}
              {item.notes && (
                <>
                  <Separator />
                  <div className="grid gap-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      Notes
                    </span>
                    <p className="text-sm">{item.notes}</p>
                  </div>
                </>
              )}

              <Separator />

              {/* Attribution */}
              <div className="grid gap-0.5 text-xs text-muted-foreground">
                <span>
                  Created by{" "}
                  <span className="text-foreground">{who(item.created_by)}</span>
                </span>
                <span>
                  Last edited by{" "}
                  <span className="text-foreground">{who(item.updated_by)}</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Sticky footer — always visible ──────────────────────────── */}
        {item && (
          <div className="shrink-0 border-t bg-background px-6 py-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  onHistory(item)
                  onClose()
                }}
              >
                <History className="size-4" />
                History
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  onDelete(item)
                  onClose()
                }}
              >
                <Trash2 className="size-4" />
              </Button>
              <Button
                className="ml-auto gap-2"
                onClick={() => {
                  onEdit(item)
                  onClose()
                }}
              >
                <Pencil className="size-4" />
                Edit
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function StatusRow({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <StatusBadge status={status} />
    </div>
  )
}
