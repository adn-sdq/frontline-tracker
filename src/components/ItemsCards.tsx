import { formatDistanceToNow } from "date-fns"
import { ChevronRight, PackagePlus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/StatusControls"
import { useSystems } from "@/hooks/useSystems"
import { SYSTEM_LABELS, type Item, type Profile } from "@/lib/types"

interface Props {
  items: Item[]
  profiles: Record<string, Profile>
  onView: (item: Item) => void
  onAdd?: () => void
  selectable?: boolean
  selectedIds?: Set<string>
  onToggle?: (id: string) => void
}

export function ItemsCardsSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-3.5 space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ItemsCards({
  items,
  profiles,
  onView,
  onAdd,
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
      <div className="flex flex-col items-center gap-4 rounded-xl border bg-card py-14 px-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <PackagePlus className="size-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">No items yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first procurement item to get started.
          </p>
        </div>
        {onAdd && (
          <Button size="sm" onClick={onAdd}>
            Add item
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => (selectable ? onToggle?.(item.id) : onView(item))}
          className={[
            "group w-full rounded-xl border bg-card p-3.5 text-left transition-colors active:bg-accent/50",
            selectable && selectedIds?.has(item.id)
              ? "border-primary/50 bg-primary/5"
              : "hover:border-primary/30 hover:bg-accent/20",
          ].join(" ")}
        >
          <div className="flex items-start gap-2.5">
            {selectable && (
              <Checkbox
                checked={selectedIds?.has(item.id) ?? false}
                onCheckedChange={() => onToggle?.(item.id)}
                onClick={(e) => e.stopPropagation()}
                aria-label="Select item"
                className="mt-0.5 shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              {/* System + UID + location */}
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="font-medium text-xs py-0 shrink-0">
                  {labelFor(item.system) || SYSTEM_LABELS[item.system] || item.system}
                </Badge>
                {item.unique_id && (
                  <span className="font-mono text-xs font-semibold text-primary">
                    {item.unique_id}
                  </span>
                )}
                {item.location && (
                  <span className="text-xs text-muted-foreground truncate">
                    {item.location}
                  </span>
                )}
              </div>

              {/* Title */}
              <div className="mt-1 font-medium text-sm leading-snug">
                {[item.brand, item.model_no].filter(Boolean).join(" · ") || "—"}
              </div>
              {item.description && (
                <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {item.description}
                </div>
              )}

              {/* Statuses */}
              <div className="mt-2 flex flex-wrap gap-1">
                <StatusBadge status={item.procurement_status} />
                <StatusBadge status={item.delivery_status} />
                <StatusBadge status={item.installation_status} />
              </div>

              {/* Attribution */}
              <div className="mt-2 text-xs text-muted-foreground">
                {who(item.updated_by)} ·{" "}
                {formatDistanceToNow(new Date(item.updated_at), {
                  addSuffix: true,
                })}
              </div>
            </div>

            <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-active:translate-x-0.5" />
          </div>
        </button>
      ))}
    </div>
  )
}
