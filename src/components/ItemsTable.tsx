import { formatDistanceToNow } from "date-fns"
import { useQueryClient } from "@tanstack/react-query"
import { History, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditableQty, StatusSelect } from "@/components/StatusControls"
import { ConflictError, useUpdateItem } from "@/hooks/useItems"
import {
  DELIVERY_STATUSES,
  INSTALLATION_STATUSES,
  PROCUREMENT_STATUSES,
  SYSTEM_LABELS,
  type Item,
  type ItemPatch,
  type Profile,
} from "@/lib/types"

interface Props {
  items: Item[]
  profiles: Record<string, Profile>
  onEdit: (item: Item) => void
  onHistory: (item: Item) => void
  onDelete: (item: Item) => void
}

export function ItemsTable({
  items,
  profiles,
  onEdit,
  onHistory,
  onDelete,
}: Props) {
  const update = useUpdateItem()
  const qc = useQueryClient()

  async function patch(item: Item, p: ItemPatch) {
    try {
      await update.mutateAsync({ id: item.id, version: item.version, patch: p })
    } catch (e) {
      if (e instanceof ConflictError) {
        toast.warning("Someone else just changed this row", {
          description: "Your edit was not applied. Showing the latest values.",
        })
        qc.invalidateQueries({ queryKey: ["items"] })
      } else {
        toast.error("Could not save", {
          description: e instanceof Error ? e.message : "Unknown error",
        })
      }
    }
  }

  function who(id: string | null) {
    if (!id) return "—"
    const p = profiles[id]
    return p?.full_name ?? p?.username ?? "Unknown"
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border bg-card py-16 text-center text-sm text-muted-foreground">
        No line items yet. Use <strong>Add item</strong> or{" "}
        <strong>Import CSV</strong> to get started.
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-10">#</TableHead>
            <TableHead>System</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Model No</TableHead>
            <TableHead className="min-w-[220px]">Description</TableHead>
            <TableHead className="text-right">Req</TableHead>
            <TableHead className="text-right">Ord</TableHead>
            <TableHead className="text-right">Dlv</TableHead>
            <TableHead className="text-right">Ins</TableHead>
            <TableHead className="min-w-[130px]">Procurement</TableHead>
            <TableHead className="min-w-[120px]">Delivery</TableHead>
            <TableHead className="min-w-[140px]">Installation</TableHead>
            <TableHead className="min-w-[140px]">Last update</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="align-middle">
              <TableCell className="text-muted-foreground">{item.sno ?? ""}</TableCell>
              <TableCell>
                <Badge variant="outline" className="font-medium">
                  {SYSTEM_LABELS[item.system]}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-xs">{item.location}</TableCell>
              <TableCell className="font-medium">{item.brand}</TableCell>
              <TableCell className="font-mono text-xs">{item.model_no}</TableCell>
              <TableCell
                className="max-w-[320px] truncate text-muted-foreground"
                title={item.description ?? undefined}
              >
                {item.description}
              </TableCell>
              <TableCell className="text-right">
                <EditableQty
                  value={item.qty_required}
                  onCommit={(v) => patch(item, { qty_required: v })}
                />
              </TableCell>
              <TableCell className="text-right">
                <EditableQty
                  value={item.qty_ordered}
                  onCommit={(v) => patch(item, { qty_ordered: v })}
                />
              </TableCell>
              <TableCell className="text-right">
                <EditableQty
                  value={item.qty_delivered}
                  onCommit={(v) => patch(item, { qty_delivered: v })}
                />
              </TableCell>
              <TableCell className="text-right">
                <EditableQty
                  value={item.qty_installed}
                  onCommit={(v) => patch(item, { qty_installed: v })}
                />
              </TableCell>
              <TableCell>
                <StatusSelect
                  value={item.procurement_status}
                  options={PROCUREMENT_STATUSES}
                  onChange={(v) => patch(item, { procurement_status: v as Item["procurement_status"] })}
                />
              </TableCell>
              <TableCell>
                <StatusSelect
                  value={item.delivery_status}
                  options={DELIVERY_STATUSES}
                  onChange={(v) => patch(item, { delivery_status: v as Item["delivery_status"] })}
                />
              </TableCell>
              <TableCell>
                <StatusSelect
                  value={item.installation_status}
                  options={INSTALLATION_STATUSES}
                  onChange={(v) => patch(item, { installation_status: v as Item["installation_status"] })}
                />
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                <div className="font-medium text-foreground">{who(item.updated_by)}</div>
                {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-7">
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
