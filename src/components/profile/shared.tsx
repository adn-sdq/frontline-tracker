import type { ReactNode } from "react"
import { errorMessage } from "@/lib/utils"
import { toast } from "sonner"

import type { Profile } from "@/lib/types"

export const displayName = (p: Profile) => p.full_name ?? p.username ?? "Unknown"

/** Run a mutation with consistent success / error toasts. */
export async function withToast(work: () => Promise<unknown>, success: string, failure = "Could not update") {
  try {
    await work()
    toast.success(success)
    return true
  } catch (e) {
    toast.error(failure, { description: errorMessage(e) })
    return false
  }
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</h3>
      {action}
    </div>
  )
}

/** Who can do what in the profile dialog, derived once. */
export interface ProfilePerms {
  isSelf: boolean
  /** The viewer is an admin. */
  viewerAdmin: boolean
  /** Can edit contact details (self or admin). */
  editDetails: boolean
  /** Can change role / org / pages / projects / capabilities (admin, not self). */
  editAccess: boolean
}
