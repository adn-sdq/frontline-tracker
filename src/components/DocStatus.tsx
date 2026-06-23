import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  DOC_STATUSES,
  DOC_STATUS_LABELS,
  DOC_STATUS_STYLES,
} from "@/lib/types"

export function DocStatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn("font-medium", DOC_STATUS_STYLES[status])}>
      {DOC_STATUS_LABELS[status] ?? status}
    </Badge>
  )
}

export function DocStatusSelect({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (v: string) => void
  className?: string
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        size="sm"
        className={cn(
          "h-8 w-full min-w-0 [&>span]:truncate",
          DOC_STATUS_STYLES[value],
          className
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {DOC_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {DOC_STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
