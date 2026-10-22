import { ListFilter } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface FilterGroup {
  key: string
  label: string
  options: { value: string; label: string }[]
}

/**
 * One "Filter" button for everything: each group (status, brand, model…) is a
 * submenu of checkboxes, so you can pick several values in several groups.
 */
export function FilterMenu({
  groups,
  selected,
  onToggle,
  onClear,
}: {
  groups: FilterGroup[]
  selected: Record<string, Set<string>>
  onToggle: (group: string, value: string) => void
  onClear: () => void
}) {
  const count = Object.values(selected).reduce((n, s) => n + s.size, 0)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn("h-9 gap-1.5", count > 0 && "border-primary/50 bg-primary/5")}>
          <ListFilter className="size-4" />
          Filter
          {count > 0 && (
            <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-medium text-primary-foreground tabular-nums">
              {count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {groups.map((g) => {
          const n = selected[g.key]?.size ?? 0
          return (
            <DropdownMenuSub key={g.key}>
              <DropdownMenuSubTrigger disabled={g.options.length === 0}>
                <span className="flex-1">{g.label}</span>
                {n > 0 && <span className="text-xs text-primary tabular-nums">{n}</span>}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-80 w-56 overflow-y-auto">
                {g.options.map((o) => (
                  <DropdownMenuCheckboxItem
                    key={o.value}
                    checked={selected[g.key]?.has(o.value) ?? false}
                    onSelect={(e) => e.preventDefault()}
                    onCheckedChange={() => onToggle(g.key, o.value)}
                  >
                    <span className="truncate">{o.label}</span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )
        })}
        {count > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onClear} className="text-muted-foreground">
              Clear all filters
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
