import { format } from "date-fns"
import { Hash, History, Pencil, Trash2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "@/components/StatusControls"
import { DetailSection, Property, PropertyList } from "@/components/PropertyList"
import { useSystems } from "@/hooks/useSystems"
import { useItemSerials } from "@/hooks/useItemSerials"
import { SYSTEM_LABELS, type Item, type Profile } from "@/lib/types"

interface Props {
  item: Item | null
  profiles: Record<string, Profile>
  onEdit: (item: Item) => void
  onHistory: (item: Item) => void
  onDelete: (item: Item) => void
  onClose: () => void
}

/**
 * Item detail — wide two-column dialog: main content (quantities, serials,
 * notes) on the left, a Databricks-style properties rail on the right.
 */
export function ItemDetailSheet({
  item,
  profiles,
  onEdit,
  onHistory,
  onDelete,
  onClose,
}: Props) {
  const { labelFor } = useSystems()
  const { data: serials = [] } = useItemSerials(item?.id ?? null)
  const filledSerials = serials.filter((s) => s.serial_number).length

  function who(id: string | null) {
    if (!id) return "—"
    const p = profiles[id]
    return p?.full_name ?? p?.username ?? "Unknown"
  }

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[85svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        {item && (
          <>
            {/* ── Header: identity left, actions right ─────────────────── */}
            <DialogHeader className="shrink-0 gap-3 border-b px-6 pb-4 pt-5 pr-14 text-left sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-medium">
                    {labelFor(item.system) || SYSTEM_LABELS[item.system ?? ""] || item.system}
                  </Badge>
                  {item.unique_id && (
                    <span className="font-mono text-sm font-semibold text-primary">
                      {item.unique_id}
                    </span>
                  )}
                </div>
                <DialogTitle className="mt-1.5 text-lg leading-snug">
                  {[item.brand, item.model_no].filter(Boolean).join(" · ") || "—"}
                </DialogTitle>
                {item.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onHistory(item)
                    onClose()
                  }}
                >
                  <History className="size-4" /> History
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7 text-destructive hover:text-destructive"
                  onClick={() => {
                    onDelete(item)
                    onClose()
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    onEdit(item)
                    onClose()
                  }}
                >
                  <Pencil className="size-4" /> Edit
                </Button>
              </div>
            </DialogHeader>

            {/* ── Body: main content + properties rail ─────────────────── */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="grid md:grid-cols-[1fr_280px]">
                {/* Main column */}
                <div className="flex min-w-0 flex-col gap-6 px-6 py-5">
                  <DetailSection title="Quantities">
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {(
                        [
                          ["Required", item.qty_required],
                          ["Ordered", item.qty_ordered],
                          ["Delivered", item.qty_delivered],
                          ["Installed", item.qty_installed],
                        ] as const
                      ).map(([label, val]) => (
                        <div key={label} className="rounded-lg border bg-muted/30 p-3">
                          <div className="text-xl font-semibold tabular-nums">{val}</div>
                          <div className="text-xs text-muted-foreground">{label}</div>
                        </div>
                      ))}
                    </div>
                  </DetailSection>

                  {item.qty_required > 0 && (
                    <DetailSection
                      title="Serial Numbers"
                      icon={Hash}
                      action={
                        <Badge
                          variant={filledSerials === item.qty_required ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {filledSerials} / {item.qty_required}
                        </Badge>
                      }
                    >
                      {filledSerials === 0 ? (
                        <p className="text-sm text-muted-foreground">No serials recorded yet.</p>
                      ) : (
                        <div className="overflow-hidden rounded-lg border">
                          {Array.from({ length: Number(item.qty_required) }, (_, i) => {
                            const unitIndex = i + 1
                            const serial =
                              serials.find((s) => s.unit_index === unitIndex)?.serial_number ?? null
                            return (
                              <div
                                key={unitIndex}
                                className="flex items-center gap-4 border-b px-3 py-1.5 text-sm last:border-b-0"
                              >
                                <span className="w-14 shrink-0 font-mono text-xs text-muted-foreground">
                                  Unit {unitIndex}
                                </span>
                                <span className={serial ? "font-mono" : "text-muted-foreground/40"}>
                                  {serial ?? "—"}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </DetailSection>
                  )}

                  {item.notes && (
                    <DetailSection title="Notes">
                      <p className="text-sm whitespace-pre-wrap">{item.notes}</p>
                    </DetailSection>
                  )}
                </div>

                {/* Properties rail */}
                <aside className="border-t bg-muted/20 px-6 py-5 md:border-t-0 md:border-l">
                  <h3 className="mb-3 text-sm font-semibold">Details</h3>
                  <PropertyList>
                    <Property label="System">
                      {labelFor(item.system) || SYSTEM_LABELS[item.system ?? ""] || item.system}
                    </Property>
                    <Property label="ID">
                      {item.unique_id && <span className="font-mono">{item.unique_id}</span>}
                    </Property>
                    <Property label="Location">{item.location}</Property>
                    <Property label="Supplier">{item.supplier}</Property>
                    <Property label="ETA">
                      {item.eta ? format(new Date(item.eta), "d MMM yyyy") : null}
                    </Property>
                  </PropertyList>

                  <Separator className="my-4" />

                  <PropertyList>
                    <Property label="Procurement">
                      <StatusBadge status={item.procurement_status} />
                    </Property>
                    <Property label="Delivery">
                      <StatusBadge status={item.delivery_status} />
                    </Property>
                    <Property label="Installation">
                      <StatusBadge status={item.installation_status} />
                    </Property>
                  </PropertyList>

                  <Separator className="my-4" />

                  <PropertyList className="text-xs">
                    <Property label="Created by">{who(item.created_by)}</Property>
                    <Property label="Edited by">{who(item.updated_by)}</Property>
                  </PropertyList>
                </aside>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
