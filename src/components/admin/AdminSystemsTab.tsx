import { useState } from "react"
import { ArrowDown, ArrowUp, Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useConfirm } from "@/components/ui/confirm-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useDeleteSystem,
  useReorderSystems,
  useSystems,
  useSystemUsage,
  useToggleSystem,
  useUpsertSystem,
} from "@/hooks/useSystems"
import { cn, errorMessage } from "@/lib/utils"
import type { SystemRow } from "@/lib/types"

/**
 * System categories used across Procurement, Documents and SLA. Order here is
 * the order in every dropdown.
 */
export function AdminSystemsTab() {
  const { systems } = useSystems()
  const { data: usage = {} } = useSystemUsage()
  const upsert = useUpsertSystem()
  const toggle = useToggleSystem()
  const reorder = useReorderSystems()
  const del = useDeleteSystem()
  const confirm = useConfirm()
  const [key, setKey] = useState("")
  const [label, setLabel] = useState("")
  const [editing, setEditing] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState("")

  const sorted = [...systems].sort((a, b) => a.sort - b.sort)

  async function run(work: () => Promise<unknown>, ok: string) {
    try {
      await work()
      toast.success(ok)
      return true
    } catch (e) {
      toast.error("Could not update", { description: errorMessage(e) })
      return false
    }
  }

  async function add() {
    const k = key.trim().toUpperCase().replace(/\s+/g, "_")
    if (!k || !label.trim()) return toast.error("Key and label are required")
    if (systems.some((s) => s.key === k)) return toast.error(`“${k}” already exists`)
    const ok = await run(
      () => upsert.mutateAsync({ key: k, label: label.trim(), sort: (sorted.at(-1)?.sort ?? 0) + 1, active: true }),
      `System “${label.trim()}” added`
    )
    if (ok) {
      setKey("")
      setLabel("")
    }
  }

  async function saveLabel(s: SystemRow) {
    const next = editLabel.trim()
    if (!next || next === s.label) return setEditing(null)
    if (await run(() => upsert.mutateAsync({ key: s.key, label: next, sort: s.sort, active: s.active }), "Renamed")) setEditing(null)
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= sorted.length) return
    const next = [...sorted]
    ;[next[index], next[target]] = [next[target], next[index]]
    void run(
      () => reorder.mutateAsync(next.map((s, i) => ({ key: s.key, label: s.label, active: s.active, sort: i + 1 }))),
      "Order updated"
    )
  }

  async function remove(s: SystemRow) {
    const ok = await confirm({
      title: `Delete ${s.label}?`,
      description: "It isn't used anywhere, so it can be removed permanently.",
      confirmText: "Delete",
      destructive: true,
    })
    if (ok) await run(() => del.mutateAsync(s.key), "System deleted")
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Categories used across Procurement, Documents and SLA. The order here is the order in every dropdown.
        Deactivated systems are hidden from new entries but kept on existing records.
      </p>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-16">Order</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Label</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Documents</TableHead>
              <TableHead className="text-right">Projects</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((s, i) => {
              const u = usage[s.key] ?? { items: 0, documents: 0, projects: 0 }
              const unused = u.items + u.documents + u.projects === 0
              return (
                <TableRow key={s.key} className={cn(!s.active && "opacity-60")}>
                  <TableCell>
                    <div className="flex gap-0.5">
                      <Button variant="ghost" size="icon" className="size-6" disabled={i === 0 || reorder.isPending} onClick={() => move(i, -1)} aria-label="Move up">
                        <ArrowUp className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-6" disabled={i === sorted.length - 1 || reorder.isPending} onClick={() => move(i, 1)} aria-label="Move down">
                        <ArrowDown className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="font-mono">{s.key}</Badge></TableCell>
                  <TableCell>
                    {editing === s.key ? (
                      <div className="flex items-center gap-1">
                        <Input
                          autoFocus
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void saveLabel(s)
                            if (e.key === "Escape") setEditing(null)
                          }}
                          className="h-7 w-48"
                        />
                        <Button variant="ghost" size="icon" className="size-7" onClick={() => saveLabel(s)} aria-label="Save"><Check className="size-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="size-7" onClick={() => setEditing(null)} aria-label="Cancel"><X className="size-3.5" /></Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="group inline-flex items-center gap-1.5 font-medium"
                        onClick={() => { setEditing(s.key); setEditLabel(s.label) }}
                      >
                        {s.label}
                        <Pencil className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{u.items || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{u.documents || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{u.projects || "—"}</TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => run(() => toggle.mutateAsync({ key: s.key, active: !s.active }), s.active ? "System deactivated" : "System activated")}
                      className={cn(
                        "rounded-sm px-2 py-0.5 text-xs font-medium transition-colors",
                        s.active
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground hover:bg-muted/70"
                      )}
                    >
                      {s.active ? "Active" : "Inactive"}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    {unused && (
                      <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => remove(s)} aria-label={`Delete ${s.label}`}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-end">
        <div className="grid gap-1.5 sm:w-40">
          <Label className="text-xs text-muted-foreground">Key (short code)</Label>
          <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="e.g. ELV" className="font-mono uppercase" />
        </div>
        <div className="grid flex-1 gap-1.5">
          <Label className="text-xs text-muted-foreground">Label</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. ELV Systems" onKeyDown={(e) => e.key === "Enter" && add()} />
        </div>
        <Button onClick={add} disabled={upsert.isPending}>
          {upsert.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Add system
        </Button>
      </div>
    </div>
  )
}
