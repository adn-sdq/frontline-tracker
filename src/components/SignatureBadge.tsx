import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/** Unsigned (default) / Signed state for paperwork that needs a client signature. */
export function SignatureBadge({ signed, className }: { signed: boolean; className?: string }) {
  return (
    <Badge
      className={cn(
        "border-transparent text-xs",
        signed
          ? "bg-emerald-600 text-white"
          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
        className
      )}
    >
      {signed ? "Signed" : "Unsigned"}
    </Badge>
  )
}
