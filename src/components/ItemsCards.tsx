import { formatDistanceToNow } from "date-fns"
import { History, MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/StatusControls"
import { useSystems } from "@/hooks/useSystems"
import { SYSTEM_LABELS, type Item, type Profile } from "@/lib/types"

interface Props {
  items: Item[]
  profiles: Record<string, Profile>
  onEdit: (item: Item) => void
  onHistory: (item: Item) => void
  onDelete: (item: Item) => void
}

export function ItemsCards({
  items,
  profiles,
  onEdit,
  onHistory,
  onDelete,
}: Props) {
  const { labelFor } = useSystems()

  function who(id: string | null) {
    if (!id) return "—"
    const p = profiles[id]
    return p?.full_name ?? p?.username ?? "Unknown"
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border bg-card py-12 text-center text-sm text-muted-foreground">
        No line items yet.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border bg-card p-3"
          onClick={() => onEdit(item)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-medium">
                  {labelFor(item.system) || SYSTEM_LABELS[item.system] || item.system}
                </Badge>
                {item.location && (
                  <span className="font-mono text-xs text-muted-foreground">
                    {item.location}
                  </span>
                )}
              </div>
              <div className="mt-1 font-medium">{item.brand}</div>
              <div className="font-mono text-xs text-muted-foreground">
                {item.model_no}
              </div>
              {item.description && (
                <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {item.description}
                </div>
              )}
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7 shrink-0">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(item)}>
                    <Pencil className="size-4" /> Edit details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onHistory(item)}>
                    <History className="size-4" /> View history
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => onDelete(item)}>
                    <Trash2 className="size-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
            {(
              [
                ["Req", "qty_required"],
                ["Ord", "qty_ordered"],
                ["Dlv", "qty_delivered"],
                ["Ins", "qty_installed"],
              ] as const
            ).map(([label, key]) => (
              <div key={key} className="flex flex-col items-center gap-0.5">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-sm font-semibold tabular-nums">{item[key]}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <StatusBadge status={item.procurement_status} />
            <StatusBadge status={item.delivery_status} />
            <StatusBadge status={item.installation_status} />
          </div>

          <div className="mt-2 text-xs text-muted-foreground">
            Updated by <span className="font-medium text-foreground">{who(item.updated_by)}</span>{" "}
            {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
          </div>
        </div>
      ))}
    </div>
  )
}
