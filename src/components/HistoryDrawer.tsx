import { format } from "date-fns"
import { Loader2, PlusCircle, Trash2, Pencil } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { useItemHistory } from "@/hooks/useItems"
import { STATUS_LABELS, type Item, type Profile } from "@/lib/types"

const FIELD_LABELS: Record<string, string> = {
  system: "System",
  location: "Location",
  sno: "S.No",
  brand: "Brand",
  model_no: "Model No",
  description: "Description",
  qty_required: "Required qty",
  qty_ordered: "Ordered qty",
  qty_delivered: "Delivered qty",
  qty_installed: "Installed qty",
  procurement_status: "Procurement",
  delivery_status: "Delivery",
  installation_status: "Installation",
  supplier: "Supplier",
  eta: "ETA",
  notes: "Notes",
}

function val(v: unknown) {
  if (v === null || v === undefined || v === "") return "—"
  const s = String(v)
  return STATUS_LABELS[s] ?? s
}

export function HistoryDrawer({
  item,
  profiles,
  onClose,
}: {
  item: Item | null
  profiles: Record<string, Profile>
  onClose: () => void
}) {
  const { data: history, isLoading } = useItemHistory(item?.id ?? null)

  function who(id: string | null) {
    if (!id) return "—"
    const p = profiles[id]
    return p?.full_name ?? p?.username ?? "Unknown"
  }

  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit history</SheetTitle>
          <SheetDescription>
            {item ? `${item.brand ?? ""} ${item.model_no ?? ""}`.trim() || "Line item" : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-6 pb-6">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {history?.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No history recorded.
            </p>
          )}

          {history?.map((h) => (
            <div key={h.id} className="rounded-lg border bg-card p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {h.action === "create" && <PlusCircle className="size-4 text-emerald-600" />}
                  {h.action === "update" && <Pencil className="size-4 text-blue-600" />}
                  {h.action === "delete" && <Trash2 className="size-4 text-destructive" />}
                  <span className="text-sm font-medium">{who(h.changed_by)}</span>
                  <Badge variant="outline" className="capitalize">
                    {h.action}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(h.changed_at), "d MMM, HH:mm")}
                </span>
              </div>

              {h.action === "update" && h.diff && (
                <ul className="flex flex-col gap-1 text-sm">
                  {Object.entries(h.diff).map(([field, change]) => (
                    <li key={field} className="flex flex-wrap items-baseline gap-1.5">
                      <span className="text-xs font-medium text-muted-foreground">
                        {FIELD_LABELS[field] ?? field}:
                      </span>
                      <span className="text-muted-foreground line-through">
                        {val(change.old)}
                      </span>
                      <span>→</span>
                      <span className="font-medium">{val(change.new)}</span>
                    </li>
                  ))}
                </ul>
              )}

              {h.action === "create" && (
                <p className="text-sm text-muted-foreground">Item created.</p>
              )}
              {h.action === "delete" && (
                <p className="text-sm text-muted-foreground">Item deleted.</p>
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
