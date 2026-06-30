import { useEffect, useState } from "react"
import { PackagePlus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useItemSerials } from "@/hooks/useItemSerials"
import type { DnCartEntry, Item } from "@/lib/types"

interface Props {
  item: Item
  entry: DnCartEntry | undefined
  onSave: (entry: DnCartEntry) => void
  onRemove: () => void
  variant?: "row" | "card"  // row = sidebar button (table), card = full-width strip
}

export function AddToDnPopover({ item, entry, onSave, onRemove, variant = "row" }: Props) {
  const [open, setOpen] = useState(false)
  const { data: serials = [] } = useItemSerials(open ? item.id : null)

  const filledSerials = serials.filter((s) => s.serial_number)

  const defaultQty = Math.max(
    1,
    (item.qty_required || 1) - (item.qty_delivered || 0),
  )

  const [qty, setQty] = useState(entry?.qty ?? defaultQty)
  const [selectedSerials, setSelectedSerials] = useState<Set<string>>(
    new Set(entry?.serials ?? []),
  )
  const [manualSerials, setManualSerials] = useState(
    entry?.serials.join(", ") ?? "",
  )

  // Re-seed when the popover opens
  useEffect(() => {
    if (!open) return
    setQty(entry?.qty ?? defaultQty)
    setSelectedSerials(new Set(entry?.serials ?? []))
    setManualSerials(entry?.serials.join(", ") ?? "")
  }, [open])

  // Once stored serials load, default-select all of them (first open only)
  useEffect(() => {
    if (!open || entry || !filledSerials.length) return
    setSelectedSerials(new Set(filledSerials.map((s) => s.serial_number!)))
  }, [filledSerials.length, open])

  function toggleSerial(sn: string) {
    setSelectedSerials((prev) => {
      const next = new Set(prev)
      next.has(sn) ? next.delete(sn) : next.add(sn)
      return next
    })
  }

  function save() {
    const resolvedSerials =
      filledSerials.length > 0
        ? [...selectedSerials]
        : manualSerials
            .split(/[,\n]/)
            .map((s) => s.trim())
            .filter(Boolean)

    onSave({ item, qty, serials: resolvedSerials })
    setOpen(false)
  }

  const inCart = !!entry
  const title = [item.brand, item.model_no].filter(Boolean).join(" ") || item.unique_id || "Item"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {variant === "card" ? (
          <button
            type="button"
            title={inCart ? "In delivery — click to edit" : "Add to delivery note"}
            className={[
              "flex w-full items-center gap-2 px-4 py-2 text-xs transition-colors",
              inCart
                ? "bg-primary/5 text-primary hover:bg-primary/10"
                : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
            ].join(" ")}
          >
            <PackagePlus className="size-3.5 shrink-0" />
            <span className="font-medium">
              {inCart ? `In delivery · ${entry.qty} unit${entry.qty !== 1 ? "s" : ""}` : "Add to delivery"}
            </span>
          </button>
        ) : (
          <button
            type="button"
            title={inCart ? "In delivery — click to edit" : "Add to delivery note"}
            className={[
              "flex shrink-0 flex-col items-center justify-center gap-0.5 border-l px-3 transition-colors",
              inCart
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
            ].join(" ")}
          >
            <PackagePlus className="size-3.5" />
            {inCart && (
              <span className="text-[9px] font-bold leading-none tabular-nums">
                {entry.qty}
              </span>
            )}
          </button>
        )}
      </PopoverTrigger>

      <PopoverContent side="left" align="start" className="w-72 p-4">
        <p className="mb-3 truncate text-sm font-semibold">{title}</p>

        {/* Qty */}
        <div className="mb-3 grid gap-1.5">
          <Label className="text-xs text-muted-foreground">
            Qty to deliver
            <span className="ml-1 text-muted-foreground/60">
              (of {item.qty_required})
            </span>
          </Label>
          <Input
            type="number"
            min={1}
            max={item.qty_required || undefined}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
            className="h-8 w-24 text-center"
          />
        </div>

        {/* Serials */}
        <div className="mb-4 grid gap-1.5">
          <Label className="text-xs text-muted-foreground">Serial numbers</Label>
          {filledSerials.length > 0 ? (
            <div className="space-y-1.5">
              {filledSerials.map((s) => (
                <label
                  key={s.unit_index}
                  className="flex cursor-pointer items-center gap-2 text-xs"
                >
                  <Checkbox
                    checked={selectedSerials.has(s.serial_number!)}
                    onCheckedChange={() => toggleSerial(s.serial_number!)}
                  />
                  <span className="text-muted-foreground">
                    Unit {s.unit_index}
                  </span>
                  <span className="font-mono font-medium">
                    {s.serial_number}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <Textarea
              placeholder="Enter serial numbers, one per line or comma-separated"
              value={manualSerials}
              onChange={(e) => setManualSerials(e.target.value)}
              rows={3}
              className="text-xs font-mono"
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button size="sm" className="flex-1" onClick={save}>
            {inCart ? "Update" : "Add to delivery"}
          </Button>
          {inCart && (
            <Button
              size="icon"
              variant="ghost"
              className="size-8 shrink-0 text-destructive hover:bg-destructive/10"
              onClick={() => { onRemove(); setOpen(false) }}
              title="Remove from delivery"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
