import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useItemSerials } from "@/hooks/useItemSerials"

export function SerialSubPanel({ itemId, qty }: { itemId: string; qty: number }) {
  const { data: serials = [], isLoading } = useItemSerials(itemId)
  const filled = serials.filter((s) => s.serial_number).length

  return (
    <div className="border-t bg-muted/20 px-4 py-3">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Serial Numbers
        </span>
        {!isLoading && (
          <Badge
            variant={filled === qty && qty > 0 ? "default" : "secondary"}
            className="text-xs"
          >
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
            return (
              <div
                key={unitIndex}
                className={[
                  "flex items-center gap-2 rounded-md border px-2 py-1.5",
                  serial ? "bg-background" : "border-dashed bg-muted/30",
                ].join(" ")}
              >
                <span className="w-5 shrink-0 text-right font-mono text-[10px] font-bold text-muted-foreground">
                  {unitIndex}
                </span>
                <span
                  className={[
                    "min-w-0 flex-1 truncate font-mono text-xs",
                    serial ? "text-foreground" : "text-muted-foreground/40",
                  ].join(" ")}
                >
                  {serial ?? "—"}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
