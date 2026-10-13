import { useState } from "react"
import { format } from "date-fns"
import { Ban, KeyRound, Loader2, RotateCcw, Trash2, UserPen } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { supabase } from "@/lib/supabase"
import {
  useDeleteAccount,
  useSetAccountStatus,
  useSetPassword,
  useUpdateUserDetails,
} from "@/hooks/useAdmin"
import type { Profile } from "@/lib/types"
import { displayName, SectionTitle, withToast, type ProfilePerms } from "./shared"

export function ProfileSecurityTab({
  profile,
  perms,
  onDeleted,
}: {
  profile: Profile
  perms: ProfilePerms
  onDeleted: () => void
}) {
  const setPassword = useSetPassword()
  const setStatus = useSetAccountStatus()
  const deleteAccount = useDeleteAccount()
  const updateDetails = useUpdateUserDetails()
  const confirm = useConfirm()

  const [pw, setPw] = useState("")
  const [pwBusy, setPwBusy] = useState(false)
  const [username, setUsername] = useState(profile.username ?? "")
  const [reason, setReason] = useState("")

  const suspended = profile.status === "suspended"
  const manage = perms.viewerAdmin && !perms.isSelf
  const name = displayName(profile)

  async function resetPassword() {
    if (pw.length < 8) return toast.error("Password must be at least 8 characters")
    setPwBusy(true)
    const ok = await withToast(async () => {
      if (perms.isSelf) {
        const { error } = await supabase.auth.updateUser({ password: pw })
        if (error) throw error
      } else {
        await setPassword.mutateAsync({ id: profile.id, password: pw })
      }
    }, "Password updated")
    setPwBusy(false)
    if (ok) setPw("")
  }

  async function changeUsername() {
    const next = username.trim().toLowerCase()
    if (!next || next === profile.username) return
    if (!/^[a-z0-9._-]+$/.test(next)) {
      return toast.error("Username: letters, numbers, dot, dash and underscore only")
    }
    await withToast(() => updateDetails.mutateAsync({ id: profile.id, username: next }), "Username changed — they sign in with the new one")
  }

  async function toggleSuspend() {
    if (!suspended) {
      const ok = await confirm({
        title: `Suspend ${name}?`,
        description: "They are signed out and can't sign back in until reactivated. Their data and history are kept.",
        confirmText: "Suspend",
        destructive: true,
      })
      if (!ok) return
    }
    const ok = await withToast(
      () => setStatus.mutateAsync({ id: profile.id, status: suspended ? "active" : "suspended", reason }),
      suspended ? "Account reactivated" : "Account suspended"
    )
    if (ok) setReason("")
  }

  async function remove() {
    const ok = await confirm({
      title: `Delete ${name}'s account?`,
      description: "This permanently removes the login. Records they created stay, attributed to a deleted user. Prefer Suspend if they might return.",
      confirmText: "Delete account",
      destructive: true,
    })
    if (!ok) return
    if (await withToast(() => deleteAccount.mutateAsync(profile.id), "Account deleted", "Could not delete")) onDeleted()
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Status */}
      <div>
        <SectionTitle>Account status</SectionTitle>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge
            className={
              suspended
                ? "border-transparent bg-red-600 text-white"
                : "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
            }
          >
            {suspended ? "Suspended" : "Active"}
          </Badge>
        </div>
        {suspended && profile.status_reason && (
          <p className="mt-1.5 text-xs text-muted-foreground">Reason: {profile.status_reason}</p>
        )}
        {manage && (
          <div className="mt-3 flex flex-wrap items-end gap-2">
            {!suspended && (
              <div className="grid min-w-48 flex-1 gap-1.5">
                <Label className="text-xs text-muted-foreground">Reason (shown to them)</Label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional" />
              </div>
            )}
            <Button variant={suspended ? "default" : "outline"} onClick={toggleSuspend} disabled={setStatus.isPending}>
              {setStatus.isPending ? <Loader2 className="size-4 animate-spin" /> : suspended ? <RotateCcw className="size-4" /> : <Ban className="size-4" />}
              {suspended ? "Reactivate" : "Suspend account"}
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* Sign-in */}
      <div>
        <SectionTitle>Sign-in</SectionTitle>
        <dl className="mb-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[8.5rem_1fr]">
          <dt className="text-muted-foreground">Username</dt>
          <dd className="font-mono">@{profile.username}</dd>
          <dt className="text-muted-foreground">Member since</dt>
          <dd>{format(new Date(profile.created_at), "d MMM yyyy")}</dd>
          {profile.updated_at && (
            <>
              <dt className="text-muted-foreground">Profile updated</dt>
              <dd>{format(new Date(profile.updated_at), "d MMM yyyy, HH:mm")}</dd>
            </>
          )}
        </dl>

        {perms.viewerAdmin && (
          <div className="mb-3 flex flex-wrap items-end gap-2">
            <div className="grid min-w-48 flex-1 gap-1.5">
              <Label className="text-xs text-muted-foreground">Change username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} autoCapitalize="none" />
            </div>
            <Button
              variant="outline"
              onClick={changeUsername}
              disabled={updateDetails.isPending || !username.trim() || username.trim().toLowerCase() === profile.username}
            >
              {updateDetails.isPending ? <Loader2 className="size-4 animate-spin" /> : <UserPen className="size-4" />}
              Rename
            </Button>
          </div>
        )}

        {(perms.isSelf || perms.viewerAdmin) && (
          <div className="flex flex-wrap items-end gap-2">
            <div className="grid min-w-48 flex-1 gap-1.5">
              <Label className="text-xs text-muted-foreground">
                {perms.isSelf ? "New password" : `Set a new password for ${name}`}
              </Label>
              <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
            </div>
            <Button variant="outline" onClick={resetPassword} disabled={pwBusy || !pw}>
              {pwBusy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              Update password
            </Button>
          </div>
        )}
      </div>

      {manage && (
        <>
          <Separator />
          <div className="rounded-lg border border-destructive/30 p-3">
            <SectionTitle>Danger zone</SectionTitle>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">Permanently delete this login. Suspending is reversible; deleting isn't.</p>
              <Button variant="destructive" size="sm" onClick={remove} disabled={deleteAccount.isPending}>
                {deleteAccount.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                Delete account
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
