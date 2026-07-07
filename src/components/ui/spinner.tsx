import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Inline loading spinner. Defaults to a muted 16px icon; pass `className`
 * to resize (e.g. `size-5`) or recolor (e.g. `text-primary-foreground`).
 */
export function Spinner({
  className,
  ...props
}: React.ComponentProps<typeof Loader2>) {
  return (
    <Loader2
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin text-muted-foreground", className)}
      {...props}
    />
  )
}
