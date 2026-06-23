import { formatDistanceToNow } from "date-fns"
import { History, MoreHorizontal, Pencil, Trash2 } from "lucide-react"

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

export function ItemsTable({
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
            <TableHead>Procurement</TableHead>
            <TableHead>Delivery</TableHead>
            <TableHead>Installation</TableHead>
            <TableHead className="min-w-[140px]">Last update</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              className="cursor-pointer align-middle"
              onClick={() => onEdit(item)}
            >
              <TableCell className="text-muted-foreground">{item.sno ?? ""}</TableCell>
              <TableCell>
                <Badge variant="outline" className="font-medium">
                  {labelFor(item.system) || SYSTEM_LABELS[item.system] || item.system}
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
              <TableCell className="text-right tabular-nums">{item.qty_required}</TableCell>
              <TableCell className="text-right tabular-nums">{item.qty_ordered}</TableCell>
              <TableCell className="text-right tabular-nums">{item.qty_delivered}</TableCell>
              <TableCell className="text-right tabular-nums">{item.qty_installed}</TableCell>
              <TableCell>
                <StatusBadge status={item.procurement_status} />
              </TableCell>
              <TableCell>
                <StatusBadge status={item.delivery_status} />
              </TableCell>
              <TableCell>
                <StatusBadge status={item.installation_status} />
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                <div className="font-medium text-foreground">{who(item.updated_by)}</div>
                {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
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
