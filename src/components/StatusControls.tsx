import { useEffect, useState } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/types"

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn("font-medium", STATUS_STYLES[status])}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  )
}

export function StatusSelect({
  value,
  options,
  onChange,
  disabled,
}: {
  value: string
  options: readonly string[]
  onChange: (next: string) => void
  disabled?: boolean
}) {
  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger
        size="sm"
        className={cn(
          "h-7 w-full border-0 px-2 shadow-none focus-visible:ring-1 [&>svg]:opacity-40",
          STATUS_STYLES[value]
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {STATUS_LABELS[opt] ?? opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// Number input that only commits on blur / Enter and only if the value changed.
export function EditableQty({
  value,
  onCommit,
  disabled,
}: {
  value: number
  onCommit: (next: number) => void
  disabled?: boolean
}) {
  const [draft, setDraft] = useState(String(value ?? 0))

  useEffect(() => {
    setDraft(String(value ?? 0))
  }, [value])

  function commit() {
    const next = Number(draft)
    if (Number.isNaN(next) || next === value) {
      setDraft(String(value ?? 0))
      return
    }
    onCommit(next)
  }

  return (
    <Input
      type="number"
      inputMode="decimal"
      min={0}
      disabled={disabled}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur()
        if (e.key === "Escape") setDraft(String(value ?? 0))
      }}
      className="h-7 w-16 px-2 text-right shadow-none"
    />
  )
}
