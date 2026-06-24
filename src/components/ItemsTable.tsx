import { formatDistanceToNow } from "date-fns"
import { ChevronRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/StatusControls"
import { useSystems } from "@/hooks/useSystems"
import { SYSTEM_LABELS, type Item, type Profile } from "@/lib/types"

interface Props {
  items: Item[]
  profiles: Record<string, Profile>
  onView: (item: Item) => void
  selectable?: boolean
  selectedIds?: Set<string>
  onToggle?: (id: string) => void
}

export function ItemsTableSkeleton() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="border-b bg-muted/40 px-4 py-2">
        <Skeleton className="h-4 w-32" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-t px-4 py-3.5">
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-28" />
          </div>
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="size-4 rounded" />
        </div>
      ))}
    </div>
  )
}

export function ItemsTable({
  items,
  profiles,
  onView,
  selectable = false,
  selectedIds,
  onToggle,
}: Props) {
  const { labelFor } = useSystems()

  function who(id: string | null) {
    if (!id) return "—"
    const p = profiles[id]
    return p?.full_name ?? p?.username ?? "Unknown"
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border bg-card py-16 text-center text-sm text-muted-foreground">
        No items match the current filters.
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {items.map((item, idx) => (
        <button
          key={item.id}
          type="button"
          onClick={() => (selectable ? onToggle?.(item.id) : onView(item))}
          className={[
            "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/40",
            idx !== 0 ? "border-t" : "",
            selectable && selectedIds?.has(item.id) ? "bg-primary/5" : "",
          ].join(" ")}
        >
          {selectable && (
            <Checkbox
              checked={selectedIds?.has(item.id) ?? false}
              onCheckedChange={() => onToggle?.(item.id)}
              onClick={(e) => e.stopPropagation()}
              aria-label="Select item"
              className="shrink-0"
            />
          )}

          {/* Identity */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="shrink-0 font-medium text-xs py-0">
                {labelFor(item.system) || SYSTEM_LABELS[item.system] || item.system}
              </Badge>
              {item.unique_id && (
                <span className="font-mono text-xs font-semibold text-primary shrink-0">
                  {item.unique_id}
                </span>
              )}
              {item.location && (
                <span className="font-mono text-xs text-muted-foreground truncate">
                  {item.location}
                </span>
              )}
            </div>
            <div className="mt-0.5 truncate font-medium text-sm">
              {item.brand}{item.brand && item.model_no ? " · " : ""}{item.model_no}
            </div>
            {item.description && (
              <div className="truncate text-xs text-muted-foreground">{item.description}</div>
            )}
            <div className="mt-1 text-xs text-muted-foreground">
              {who(item.updated_by)} · {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
            </div>
          </div>

          {/* Statuses — more useful than raw qty numbers */}
          <div className="hidden shrink-0 flex-col gap-1 sm:flex">
            <StatusBadge status={item.procurement_status} />
            <StatusBadge status={item.delivery_status} />
            <StatusBadge status={item.installation_status} />
          </div>

          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </button>
      ))}
    </div>
  )
}
