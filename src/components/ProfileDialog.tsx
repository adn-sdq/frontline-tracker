import { useEffect, useRef, useState } from "react"
import { format } from "date-fns"
import {
  Camera,
  KeyRound,
  Loader2,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import {
  useAllProjectMembers,
  useAllProjects,
} from "@/hooks/useProjects"
import {
  useChangeRole,
  useDeleteAccount,
  useSetPassword,
  useUpdateProfile,
  useUpdateUserDetails,
  useUploadAvatar,
} from "@/hooks/useAdmin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { avatarColor, initials } from "@/components/UserAvatar"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  APP_PAGE_LABELS,
  APP_PAGES,
  type AppPage,
  ORG_LABELS,
  ORGS,
  type Org,
  type Profile,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLES,
  type Role,
} from "@/lib/types"

const ROLE_BADGE_CLASS: Record<Role, string> = {
  admin: "bg-blue-100 text-blue-800 border-transparent dark:bg-blue-900/30 dark:text-blue-300",
  member: "bg-muted text-muted-foreground border-transparent",
  guest: "bg-amber-100 text-amber-800 border-transparent dark:bg-amber-900/30 dark:text-amber-400",
}

interface Props {
  profile: Profile | null
  open: boolean
  onClose: () => void
  /** When true, show admin controls (role change, delete, reset password). */
  isAdmin?: boolean
  /** When true, show avatar upload (current user editing own profile). */
  canEditSelf?: boolean
}

export function ProfileDialog({ profile: profileUserOrNull, open, onClose, isAdmin, canEditSelf }: Props) {
  const { user, refetchProfile } = useAuth()
  const updateProfile = useUpdateProfile()
  const updateDetails = useUpdateUserDetails()
  const uploadAvatar = useUploadAvatar()
  const changeRole = useChangeRole()
  const setPasswordMut = useSetPassword()
  const deleteAccount = useDeleteAccount()

  const { data: projects = [] } = useAllProjects()
  const { data: memberships = [] } = useAllProjectMembers()

  const [editName, setEditName] = useState("")
  const [editUsername, setEditUsername] = useState("")
  const [nameEditing, setNameEditing] = useState(false)
  const [nameBusy, setNameBusy] = useState(false)

  const [pwOpen, setPwOpen] = useState(false)
  const [pw, setPw] = useState("")
  const [pwBusy, setPwBusy] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [avatarBusy, setAvatarBusy] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync fields when the viewed profile changes — MUST be before the null guard.
  useEffect(() => {
    if (!profileUserOrNull) return
    setEditName(profileUserOrNull.full_name ?? "")
    setEditUsername(profileUserOrNull.username ?? "")
    setNameEditing(false)
    setPreviewUrl(null)
    setPendingFile(null)
    setPw("")
    setPwOpen(false)
    setConfirmDelete(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileUserOrNull?.id])

  // Guard must come after ALL hooks (React rules of hooks).
  if (!profileUserOrNull) return null
  const profileUser = profileUserOrNull

  const isSelf = profileUser.id === user?.id

  const displayName = profileUser.full_name ?? profileUser.username ?? "Unknown"
  const assignedProjects = projects.filter((pr) =>
    memberships.some((m) => m.user_id === profileUser.id && m.project_id === pr.id)
  )

  // ── Avatar upload ────────────────────────────────────────────────────────
  function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreviewUrl(URL.createObjectURL(file))
    setPendingFile(file)
    e.target.value = ""
  }

  async function saveAvatar() {
    if (!pendingFile) return
    setAvatarBusy(true)
    try {
      await uploadAvatar.mutateAsync({ userId: profileUser.id, file: pendingFile })
      toast.success("Photo updated")
      setPendingFile(null)
      setPreviewUrl(null)
      if (isSelf) await refetchProfile()
    } catch (e) {
      toast.error("Upload failed", { description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setAvatarBusy(false)
    }
  }

  function cancelAvatar() {
    setPendingFile(null)
    setPreviewUrl(null)
  }

  // ── Name / username edit ─────────────────────────────────────────────────
  async function saveName() {
    if (!editUsername.trim()) { toast.error("Username cannot be empty"); return }
    setNameBusy(true)
    try {
      await updateDetails.mutateAsync({
        id: profileUser.id,
        full_name: editName.trim() || undefined,
        username: editUsername.trim() !== profileUser.username ? editUsername.trim() : undefined,
      })
      toast.success("Profile updated")
      setNameEditing(false)
      if (isSelf) await refetchProfile()
    } catch (e) {
      toast.error("Could not update", { description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setNameBusy(false)
    }
  }

  // ── Role change ──────────────────────────────────────────────────────────
  async function handleRoleChange(role: Role) {
    try {
      await changeRole.mutateAsync({ id: profileUser.id, role })
      toast.success(`Role changed to ${ROLE_LABELS[role]}`)
    } catch (e) {
      toast.error("Could not change role", { description: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  // ── Org change ───────────────────────────────────────────────────────────
  async function handleOrgChange(org: Org) {
    try {
      await updateProfile.mutateAsync({ id: profileUser.id, patch: { org } })
      toast.success("Organisation updated")
    } catch (e) {
      toast.error("Could not update", { description: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  // ── Tech-manager flag ──────────────────────────────────────────────────────
  async function handleTechManagerToggle(on: boolean) {
    try {
      await updateProfile.mutateAsync({ id: profileUser.id, patch: { is_tech_manager: on } })
      toast.success(on ? "Granted technicians management" : "Removed technicians management")
    } catch (e) {
      toast.error("Could not update", { description: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  // ── Page access toggle ───────────────────────────────────────────────────
  async function togglePage(page: AppPage) {
    const current: AppPage[] = (profileUser.allowed_pages as AppPage[] | null) ?? [...APP_PAGES]
    const next = current.includes(page) ? current.filter((p) => p !== page) : [...current, page]
    const patch = next.length === APP_PAGES.length ? null : next
    try {
      await updateProfile.mutateAsync({ id: profileUser.id, patch: { allowed_pages: patch } })
      toast.success("Page access updated")
    } catch (e) {
      toast.error("Could not update", { description: e instanceof Error ? e.message : "Unknown error" })
    }
  }

  // ── Password reset ───────────────────────────────────────────────────────
  async function resetPassword() {
    if (pw.length < 6) { toast.error("Password must be at least 6 characters"); return }
    setPwBusy(true)
    try {
      if (isSelf) {
        const { error } = await supabase.auth.updateUser({ password: pw })
        if (error) throw error
      } else {
        await setPasswordMut.mutateAsync({ id: profileUser.id, password: pw })
      }
      toast.success("Password updated")
      setPw("")
      setPwOpen(false)
    } catch (e) {
      toast.error("Could not update password", { description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setPwBusy(false)
    }
  }

  // ── Delete account ───────────────────────────────────────────────────────
  async function handleDelete() {
    setDeleteBusy(true)
    try {
      await deleteAccount.mutateAsync(profileUser.id)
      toast.success("Account deleted")
      onClose()
    } catch (e) {
      toast.error("Could not delete", { description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setDeleteBusy(false)
      setConfirmDelete(false)
    }
  }

  const avatarSrc = previewUrl ?? profileUser.avatar_url

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="flex max-h-[90svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
          {/* ── Header ─────────────────────────────────────────────────── */}
          <DialogHeader className="shrink-0 border-b px-6 py-5 pr-14 text-left">
            <DialogTitle>Profile</DialogTitle>
            <DialogDescription className="sr-only">
              View and manage {displayName}'s profile
            </DialogDescription>
          </DialogHeader>

          {/* ── Body ───────────────────────────────────────────────────── */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid md:grid-cols-[220px_1fr]">

              {/* Left column — avatar + identity ──────────────────────── */}
              <div className="flex flex-col items-center gap-4 border-b bg-muted/20 px-6 py-8 md:border-b-0 md:border-r">
                {/* Avatar */}
                <div className="relative">
                  <div className="size-24 overflow-hidden rounded-full border-2 border-border bg-muted">
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={displayName}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div
                        className={cn(
                          "flex size-full items-center justify-center text-2xl font-semibold uppercase",
                          avatarColor(profileUser.id)
                        )}
                      >
                        {initials(displayName)}
                      </div>
                    )}
                  </div>
                  {(canEditSelf || isSelf || isAdmin) && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 flex size-8 cursor-pointer items-center justify-center rounded-full border bg-background shadow-sm transition-colors hover:bg-accent"
                      title="Change photo"
                    >
                      <Camera className="size-3.5" />
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="sr-only"
                    aria-label="Upload profile photo"
                    onChange={onFileSelect}
                  />
                </div>

                {/* Pending photo actions */}
                {pendingFile && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveAvatar} disabled={avatarBusy}>
                      {avatarBusy ? <Loader2 className="size-3.5 animate-spin" /> : null}
                      Save photo
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelAvatar} disabled={avatarBusy}>
                      <X className="size-3.5" />
                    </Button>
                  </div>
                )}

                {/* Identity */}
                {nameEditing ? (
                  <div className="w-full space-y-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Full name</Label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="First Last" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Username</Label>
                      <Input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} autoCapitalize="none" />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveName} disabled={nameBusy}>
                        {nameBusy && <Loader2 className="size-3.5 animate-spin" />} Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setNameEditing(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full text-center">
                    <p className="text-base font-semibold">{displayName}</p>
                    <p className="font-mono text-xs text-muted-foreground">@{profileUser.username}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                      <Badge className={ROLE_BADGE_CLASS[profileUser.role ?? "member"]}>
                        {ROLE_LABELS[profileUser.role ?? "member"]}
                      </Badge>
                      {profileUser.org && (
                        <Badge variant="outline" className="font-normal">
                          {ORG_LABELS[profileUser.org] ?? profileUser.org}
                        </Badge>
                      )}
                    </div>
                    {(isAdmin || isSelf) && (
                      <button
                        type="button"
                        onClick={() => setNameEditing(true)}
                        className="mt-2 text-xs text-primary hover:underline"
                      >
                        Edit name / username
                      </button>
                    )}
                  </div>
                )}

                {/* Member since */}
                <div className="mt-auto text-center">
                  <p className="text-xs text-muted-foreground">
                    Member since{" "}
                    <span className="font-medium text-foreground">
                      {format(new Date(profileUser.created_at), "d MMM yyyy")}
                    </span>
                  </p>
                  {isSelf && (
                    <Badge variant="secondary" className="mt-1.5">You</Badge>
                  )}
                </div>
              </div>

              {/* Right column — details + controls ────────────────────── */}
              <div className="flex flex-col gap-6 px-6 py-6">

                {/* Role section */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Access Level
                  </h3>
                  {isAdmin && !isSelf ? (
                    <div className="space-y-2">
                      <Select
                        value={profileUser.role ?? "member"}
                        onValueChange={(v) => handleRoleChange(v as Role)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {ROLE_DESCRIPTIONS[profileUser.role ?? "member"]}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Badge className={ROLE_BADGE_CLASS[profileUser.role ?? "member"]}>
                        <ShieldCheck className="mr-1 size-3" />
                        {ROLE_LABELS[profileUser.role ?? "member"]}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {ROLE_DESCRIPTIONS[profileUser.role ?? "member"]}
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Organisation */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Organisation
                  </h3>
                  {isAdmin && !isSelf ? (
                    <Select
                      value={profileUser.org ?? ""}
                      onValueChange={(v) => handleOrgChange(v as Org)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select org" />
                      </SelectTrigger>
                      <SelectContent>
                        {ORGS.map((o) => (
                          <SelectItem key={o} value={o}>{ORG_LABELS[o]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm">{profileUser.org ? ORG_LABELS[profileUser.org] ?? profileUser.org : "—"}</p>
                  )}
                </div>

                {/* Technicians management */}
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Technicians
                  </h3>
                  {profileUser.role === "admin" ? (
                    <p className="text-xs text-muted-foreground">Admins manage technicians by default.</p>
                  ) : isAdmin && !isSelf ? (
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={profileUser.is_tech_manager}
                        onCheckedChange={(v) => handleTechManagerToggle(!!v)}
                      />
                      Technicians manager — run the roster, answer requests and schedule people
                    </label>
                  ) : (
                    <p className="text-sm">
                      {profileUser.is_tech_manager ? "Technicians manager" : "Not a technicians manager"}
                    </p>
                  )}
                </div>

                {/* Page access — only for frontline non-admin members */}
                {profileUser.org !== "firstfix" && profileUser.role !== "admin" && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Page Access
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {APP_PAGES.map((pg) => {
                          const enabled = !profileUser.allowed_pages || (profileUser.allowed_pages as string[]).includes(pg)
                          return isAdmin && !isSelf ? (
                            <button
                              key={pg}
                              type="button"
                              onClick={() => togglePage(pg)}
                              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                                enabled
                                  ? "border-primary bg-primary/10 text-primary hover:bg-primary/20"
                                  : "border-muted-foreground/30 text-muted-foreground/50 hover:border-muted-foreground/60"
                              }`}
                            >
                              {APP_PAGE_LABELS[pg]}
                            </button>
                          ) : (
                            <Badge
                              key={pg}
                              variant={enabled ? "secondary" : "outline"}
                              className={enabled ? "" : "text-muted-foreground/40"}
                            >
                              {APP_PAGE_LABELS[pg]}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* Assigned projects */}
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Assigned Projects
                  </h3>
                  {profileUser.role === "admin" ? (
                    <p className="text-xs text-muted-foreground">Admins access all projects.</p>
                  ) : assignedProjects.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No projects assigned.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {assignedProjects.map((pr) => (
                        <Badge key={pr.id} variant="outline">{pr.name}</Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Admin controls */}
                {(isAdmin || isSelf) && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Account
                      </h3>

                      {/* Password */}
                      {pwOpen ? (
                        <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                          <Label className="text-xs text-muted-foreground">New password</Label>
                          <Input
                            type="password"
                            value={pw}
                            onChange={(e) => setPw(e.target.value)}
                            placeholder="At least 6 characters"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={resetPassword} disabled={pwBusy || pw.length < 6}>
                              {pwBusy && <Loader2 className="size-3.5 animate-spin" />} Update
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setPwOpen(false); setPw("") }}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => setPwOpen(true)}>
                          <KeyRound className="size-4" /> Reset password
                        </Button>
                      )}

                      {/* Delete — admin only, not self */}
                      {isAdmin && !isSelf && (
                        confirmDelete ? (
                          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                            <p className="text-xs font-medium text-destructive">
                              Delete {displayName}'s account? Their data stays but they can no longer sign in.
                            </p>
                            <div className="flex gap-2">
                              <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleteBusy}>
                                {deleteBusy && <Loader2 className="size-3.5 animate-spin" />} Delete account
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setConfirmDelete(true)}
                          >
                            <Trash2 className="size-4" /> Delete account
                          </Button>
                        )
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
