import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Columns3,
  Loader2,
  MoreHorizontal,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useConfirm } from "@/components/ui/confirm-dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface RowAction {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: () => void
  destructive?: boolean
  /** Shown above this item. */
  separator?: boolean
  hidden?: boolean
}

/** Optional per-column extras: a label for the Columns menu and cell classes. */
export interface ColumnMetaExtra {
  label?: string
  className?: string
  headerClassName?: string
}

interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[]
  data: T[]
  /** Remembers column order and visibility per person, under this name. */
  tableId?: string
  getRowId?: (row: T) => string
  /** Free-text filter value applied across all columns. */
  globalFilter?: string
  onRowClick?: (row: T) => void
  pageSize?: number
  emptyMessage?: string
  /** Adds a checkbox column. Selection is controlled so the page can act on it. */
  selection?: { selected: Set<string>; onChange: (next: Set<string>) => void }
  /** Extra buttons shown in the selection bar (next to Delete). */
  bulkActions?: (rows: T[], clear: () => void) => ReactNode
  /** Adds "Delete selected" with a confirmation. Throw to show it failed. */
  onBulkDelete?: (rows: T[]) => Promise<void>
  /** What to call the rows in messages, e.g. "document". */
  noun?: string
  /** Three-dot menu at the end of each row. */
  rowActions?: (row: T) => RowAction[]
  /** A full-width panel under a row (e.g. serial numbers). */
  renderExpanded?: (row: T) => ReactNode
  expandedId?: string | null
  /** Shown at the left of the toolbar. */
  toolbar?: ReactNode
  /** Buttons between the toolbar and the ⋯ menu (e.g. Add). */
  toolbarEnd?: ReactNode
  /** Extra items at the top of the ⋯ menu (e.g. Import, Export). */
  menuItems?: ReactNode
  /** Column ids hidden until the person turns them on in Columns. */
  defaultHidden?: string[]
  rowClassName?: (row: T) => string | undefined
}

const FIXED = new Set(["__select", "__actions"])

function loadPrefs(id?: string): { hidden?: VisibilityState } {
  if (!id) return {}
  try {
    return JSON.parse(localStorage.getItem(`fit.table.${id}`) ?? "{}")
  } catch {
    return {}
  }
}

/**
 * The app's table: sortable headers, show/hide columns, optional row selection with bulk delete, a ⋯ actions
 * menu per row, expandable rows and client-side pagination.
 */
export function DataTable<T>({
  columns,
  data,
  tableId,
  getRowId,
  globalFilter,
  onRowClick,
  pageSize = 25,
  emptyMessage = "No results.",
  selection,
  bulkActions,
  onBulkDelete,
  noun = "row",
  rowActions,
  renderExpanded,
  expandedId,
  toolbar,
  rowClassName,
  defaultHidden = [],
  toolbarEnd,
  menuItems,
}: DataTableProps<T>) {
  const confirm = useConfirm()
  const [sorting, setSorting] = useState<SortingState>([])
  const prefs = useMemo(() => loadPrefs(tableId), [tableId])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    prefs.hidden ?? Object.fromEntries(defaultHidden.map((id) => [id, false]))
  )
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!tableId) return
    try {
      localStorage.setItem(`fit.table.${tableId}`, JSON.stringify({ hidden: columnVisibility }))
    } catch {
      /* storage unavailable — preferences just won't persist */
    }
  }, [tableId, columnVisibility])

  const rowId = (row: T, i: number) => (getRowId ? getRowId(row) : String(i))

  const allColumns = useMemo<ColumnDef<T, unknown>[]>(() => {
    const out: ColumnDef<T, unknown>[] = []
    if (selection) {
      out.push({
        id: "__select",
        enableSorting: false,
        enableHiding: false,
        meta: { headerClassName: "w-12 pl-4 pr-2", className: "w-12 pl-4 pr-2" } satisfies ColumnMetaExtra,
        header: ({ table }) => {
          const ids = table.getRowModel().rows.map((r) => r.id)
          const picked = ids.filter((id) => selection.selected.has(id)).length
          return (
            <Checkbox
              aria-label="Select all on this page"
              checked={ids.length > 0 && picked === ids.length ? true : picked > 0 ? "indeterminate" : false}
              onCheckedChange={() => {
                const next = new Set(selection.selected)
                if (picked === ids.length) ids.forEach((id) => next.delete(id))
                else ids.forEach((id) => next.add(id))
                selection.onChange(next)
              }}
            />
          )
        },
        cell: ({ row }) => (
          <Checkbox
            aria-label="Select row"
            checked={selection.selected.has(row.id)}
            onClick={(e) => e.stopPropagation()}
            onCheckedChange={() => {
              const next = new Set(selection.selected)
              if (next.has(row.id)) next.delete(row.id)
              else next.add(row.id)
              selection.onChange(next)
            }}
          />
        ),
      })
    }
    out.push(...columns)
    if (rowActions) {
      out.push({
        id: "__actions",
        enableSorting: false,
        enableHiding: false,
        meta: { headerClassName: "w-10", className: "w-10 text-right" } satisfies ColumnMetaExtra,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const actions = rowActions(row.original).filter((a) => !a.hidden)
          if (!actions.length) return null
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7" aria-label="Row actions">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-40">
                  {actions.map((a) => (
                    <Fragment key={a.label}>
                      {a.separator && <DropdownMenuSeparator />}
                      <DropdownMenuItem
                        onClick={a.onClick}
                        className={cn(a.destructive && "text-destructive focus:text-destructive")}
                      >
                        {a.icon && <a.icon className={cn("size-4", a.destructive && "text-destructive")} />}
                        {a.label}
                      </DropdownMenuItem>
                    </Fragment>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      })
    }
    return out
  }, [columns, selection, rowActions])

  const table = useReactTable({
    data,
    columns: allColumns,
    getRowId: (row, i) => rowId(row, i),
    state: { sorting, globalFilter: globalFilter ?? "", columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  // Columns that can be shown or hidden.
  const toggleable = table.getAllLeafColumns().filter((c) => !FIXED.has(c.id) && c.getCanHide())

  const labelOf = (c: (typeof toggleable)[number]) => {
    const meta = c.columnDef.meta as ColumnMetaExtra | undefined
    const h = c.columnDef.header
    return meta?.label ?? (typeof h === "string" ? h : c.id)
  }

  const rows = table.getRowModel().rows
  const pageCount = table.getPageCount()
  const selectedRows = selection
    ? table.getCoreRowModel().rows.filter((r) => selection.selected.has(r.id)).map((r) => r.original)
    : []
  const clearSelection = () => selection?.onChange(new Set())

  async function bulkDelete() {
    if (!onBulkDelete || !selectedRows.length) return
    const many = selectedRows.length > 1
    const ok = await confirm({
      title: `Delete ${selectedRows.length} ${noun}${many ? "s" : ""}?`,
      description: "This can't be undone.",
      confirmText: "Delete",
      destructive: true,
    })
    if (!ok) return
    setDeleting(true)
    try {
      await onBulkDelete(selectedRows)
      clearSelection()
    } finally {
      setDeleting(false)
    }
  }

  const visibleCount = table.getVisibleLeafColumns().length

  return (
    <div className="flex flex-col gap-2">
      {/* Toolbar: page controls (or the selection bar) on the left, actions on the right, ⋯ last */}
      <div className="flex min-h-9 flex-wrap items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {selection && selectedRows.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-2 py-1">
              <span className="px-1 text-sm font-medium tabular-nums">{selectedRows.length} selected</span>
              {bulkActions?.(selectedRows, clearSelection)}
              {onBulkDelete && (
                <Button size="sm" variant="ghost" className="h-7 text-destructive hover:text-destructive" onClick={bulkDelete} disabled={deleting}>
                  {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Delete
                </Button>
              )}
              <Button size="icon" variant="ghost" className="size-7" onClick={clearSelection} aria-label="Clear selection">
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            toolbar
          )}
        </div>

        {toolbarEnd}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="size-9 shrink-0" aria-label="More options">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {menuItems}
            {menuItems && <DropdownMenuSeparator />}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Columns3 className="size-4" /> Columns
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-56">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Show or hide columns</DropdownMenuLabel>
                {toggleable.map((c) => (
                  <DropdownMenuCheckboxItem
                    key={c.id}
                    checked={c.getIsVisible()}
                    onSelect={(e) => e.preventDefault()}
                    onCheckedChange={(v) => c.toggleVisibility(!!v)}
                  >
                    <span className="truncate">{labelOf(c)}</span>
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setColumnVisibility(Object.fromEntries(defaultHidden.map((id) => [id, false])))}>
                  <RotateCcw className="size-4" /> Reset columns
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/40 hover:bg-muted/40">
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sorted = header.column.getIsSorted()
                  const meta = header.column.columnDef.meta as ColumnMetaExtra | undefined
                  return (
                    <TableHead key={header.id} className={cn("whitespace-nowrap", meta?.headerClassName)}>
                      <span className="inline-flex items-center gap-0.5">
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className="inline-flex items-center gap-1 rounded px-1 py-0.5 font-medium transition-colors hover:text-foreground"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sorted === "asc" ? (
                              <ArrowUp className="size-3.5" />
                            ) : sorted === "desc" ? (
                              <ArrowDown className="size-3.5" />
                            ) : (
                              <ChevronsUpDown className="size-3.5 opacity-40" />
                            )}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </span>
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleCount} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const isSelected = selection?.selected.has(row.id)
                const expanded = renderExpanded && expandedId === row.id
                return (
                  <Fragment key={row.id}>
                    <TableRow
                      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                      data-state={isSelected ? "selected" : undefined}
                      className={cn(onRowClick && "cursor-pointer", expanded && "bg-muted/30", rowClassName?.(row.original))}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className={(cell.column.columnDef.meta as ColumnMetaExtra | undefined)?.className}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                    {expanded && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={visibleCount} className="p-0 whitespace-normal">
                          {renderExpanded(row.original)}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            Page {table.getState().pagination.pageIndex + 1} of {pageCount} · {table.getFilteredRowModel().rows.length} rows
          </span>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <ChevronLeft className="size-4" /> Prev
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
