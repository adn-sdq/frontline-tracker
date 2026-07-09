import { useState, type ReactNode } from "react"

import { cn } from "@/lib/utils"

export interface KanbanColumn<S extends string> {
  id: S
  label: string
  /** Optional accent class for the column header dot / count. */
  accentClass?: string
}

interface KanbanBoardProps<T, S extends string> {
  columns: KanbanColumn<S>[]
  items: T[]
  getId: (item: T) => string
  getColumn: (item: T) => S
  onMove: (id: string, to: S) => void
  renderCard: (item: T) => ReactNode
  /** Optional empty message per column. */
  emptyLabel?: string
}

/**
 * Generic drag-and-drop Kanban board built on native HTML5 drag events (no
 * extra dependency). Cards are draggable between columns; dropping a card on a
 * column calls `onMove(id, columnId)`. Columns scroll horizontally on smaller
 * screens.
 */
export function KanbanBoard<T, S extends string>({
  columns,
  items,
  getId,
  getColumn,
  onMove,
  renderCard,
  emptyLabel = "Nothing here",
}: KanbanBoardProps<T, S>) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [overCol, setOverCol] = useState<S | null>(null)

  function handleDrop(col: S) {
    if (dragId) {
      const current = items.find((i) => getId(i) === dragId)
      if (current && getColumn(current) !== col) onMove(dragId, col)
    }
    setDragId(null)
    setOverCol(null)
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {columns.map((col) => {
        const colItems = items.filter((i) => getColumn(i) === col.id)
        const isOver = overCol === col.id
        return (
          <div
            key={col.id}
            onDragOver={(e) => {
              e.preventDefault()
              if (overCol !== col.id) setOverCol(col.id)
            }}
            onDragLeave={(e) => {
              // Only clear when leaving the column entirely.
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setOverCol((c) => (c === col.id ? null : c))
              }
            }}
            onDrop={() => handleDrop(col.id)}
            className={cn(
              "flex w-72 shrink-0 flex-col rounded-xl border bg-muted/30 transition-colors",
              isOver && "border-primary/60 bg-primary/5"
            )}
          >
            <div className="flex items-center gap-2 px-3 py-2.5">
              <span className={cn("size-2 rounded-full", col.accentClass ?? "bg-muted-foreground/40")} />
              <span className="text-sm font-semibold">{col.label}</span>
              <span className="ml-auto rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {colItems.length}
              </span>
            </div>

            <div className="flex min-h-16 flex-1 flex-col gap-2 px-2 pb-2">
              {colItems.length === 0 ? (
                <p className="px-1 py-6 text-center text-xs text-muted-foreground/70">
                  {emptyLabel}
                </p>
              ) : (
                colItems.map((item) => {
                  const id = getId(item)
                  return (
                    <div
                      key={id}
                      draggable
                      onDragStart={() => setDragId(id)}
                      onDragEnd={() => {
                        setDragId(null)
                        setOverCol(null)
                      }}
                      className={cn(
                        "cursor-grab rounded-lg border bg-card shadow-sm transition-opacity active:cursor-grabbing",
                        dragId === id && "opacity-50"
                      )}
                    >
                      {renderCard(item)}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
