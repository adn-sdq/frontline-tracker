import { useEffect, useState } from "react"
import { Briefcase, Camera, Loader2, Mail, Phone, Trash2, X } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/contexts/AuthContext"
import { useAccessRoles, useAllProfiles, useRemoveAvatar, useUploadAvatar } from "@/hooks/useAdmin"
import { roleFor } from "@/lib/access"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { avatarColor, initials } from "@/components/UserAvatar"
import { useFileDrop } from "@/components/ui/file-dropzone"
import { cn, errorMessage } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ORG_LABELS, type Profile } from "@/lib/types"
import { ProfileOverviewTab } from "@/components/profile/ProfileOverviewTab"
import { ProfileAccessTab } from "@/components/profile/ProfileAccessTab"
import { ProfileSecurityTab } from "@/components/profile/ProfileSecurityTab"
import {
  displayName,
  type ProfilePerms,
} from "@/components/profile/shared"

interface Props {
  profile: Profile | null
  open: boolean
  onClose: () => void
  /** Kept for call-site compatibility; permissions derive from the signed-in user. */
  isAdmin?: boolean
  canEditSelf?: boolean
  defaultTab?: "overview" | "access" | "security"
}

export function ProfileDialog({ profile: initial, open, onClose, defaultTab = "overview" }: Props) {
  const { user, profile: me, refetchProfile } = useAuth()
  const { data: all = [] } = useAllProfiles()
  const { data: roles = [] } = useAccessRoles()
  const uploadAvatar = useUploadAvatar()
  const removeAvatar = useRemoveAvatar()

  // Render the live row so edits made in any tab show immediately.
  const p = (initial && all.find((x) => x.id === initial.id)) ?? initial

  const [tab, setTab] = useState(defaultTab)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [avatarBusy, setAvatarBusy] = useState(false)

  const isSelf = !!p && p.id === user?.id
  const viewerAdmin = !!me?.is_admin
  const perms: ProfilePerms = {
    isSelf,
    viewerAdmin,
    editDetails: isSelf || viewerAdmin,
    editAccess: viewerAdmin && !isSelf,
  }

  const avatarDrop = useFileDrop({
    accept: "image/jpeg,image/png,image/gif,image/webp",
    disabled: !perms.editDetails || avatarBusy,
    onFiles: ([file]) => {
      setPreviewUrl(URL.createObjectURL(file))
      setPendingFile(file)
    },
  })

  useEffect(() => {
    setTab(defaultTab)
    setPreviewUrl(null)
    setPendingFile(null)
  }, [initial?.id, defaultTab])

  if (!p) return null
  const name = displayName(p)
  const accessRole = roleFor(p, roles)
  const suspended = p.status === "suspended"

  async function saveAvatar() {
    if (!pendingFile || !p) return
    setAvatarBusy(true)
    try {
      await uploadAvatar.mutateAsync({ userId: p.id, file: pendingFile })
      toast.success("Photo updated")
      setPendingFile(null)
      setPreviewUrl(null)
      if (isSelf) await refetchProfile()
    } catch (e) {
      toast.error("Upload failed", { description: errorMessage(e) })
    } finally {
      setAvatarBusy(false)
    }
  }

  async function deleteAvatar() {
    if (!p) return
    setAvatarBusy(true)
    try {
      await removeAvatar.mutateAsync({ userId: p.id, avatarUrl: p.avatar_url })
      toast.success("Photo removed")
      if (isSelf) await refetchProfile()
    } catch (e) {
      toast.error("Could not remove photo", { description: errorMessage(e) })
    } finally {
      setAvatarBusy(false)
    }
  }

  const avatarSrc = previewUrl ?? p.avatar_url

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[90svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4 pr-14 text-left">
          <DialogTitle>{isSelf ? "My profile" : "Profile"}</DialogTitle>
          <DialogDescription className="sr-only">View and manage {name}'s profile</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid md:grid-cols-[240px_1fr]">
            {/* ── Identity column ───────────────────────────────────── */}
            <aside className="flex flex-col items-center gap-3 border-b bg-muted/20 px-6 py-7 text-center md:border-r md:border-b-0">
              <div className="relative" {...avatarDrop.dropProps}>
                <div
                  className={cn(
                    "size-24 overflow-hidden rounded-full border-2 border-border bg-muted transition-colors",
                    avatarDrop.dragging && "border-primary ring-4 ring-primary/20",
                    suspended && "grayscale"
                  )}
                  title={perms.editDetails ? "Drop a photo here to change it" : undefined}
                >
                  {avatarSrc ? (
                    <img src={avatarSrc} alt={name} className="size-full object-cover" />
                  ) : (
                    <div className={cn("flex size-full items-center justify-center text-2xl font-semibold uppercase", avatarColor(p.id))}>
                      {initials(name)}
                    </div>
                  )}
                </div>
                {perms.editDetails && (
                  <button
                    type="button"
                    onClick={avatarDrop.open}
                    className="absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full border bg-background shadow-sm transition-colors hover:bg-accent"
                    title="Change photo"
                  >
                    <Camera className="size-3.5" />
                  </button>
                )}
                {avatarDrop.input}
              </div>

              {pendingFile ? (
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveAvatar} disabled={avatarBusy}>
                    {avatarBusy && <Loader2 className="size-3.5 animate-spin" />} Save photo
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setPendingFile(null); setPreviewUrl(null) }} disabled={avatarBusy}>
                    <X className="size-3.5" />
                  </Button>
                </div>
              ) : (
                perms.editDetails &&
                p.avatar_url && (
                  <Button size="sm" variant="ghost" className="-mt-1 h-7 text-xs text-destructive" onClick={deleteAvatar} disabled={avatarBusy}>
                    {avatarBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                    Remove photo
                  </Button>
                )
              )}

              <div className="w-full">
                <p className="text-base font-semibold break-words">{name}</p>
                <p className="font-mono text-xs text-muted-foreground">@{p.username}</p>
                {p.job_title && <p className="mt-1 text-sm">{p.job_title}</p>}
                <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                  <Badge variant={accessRole?.key === "admin" ? "default" : "outline"} className="font-normal">
                    {accessRole?.name ?? "No access"}
                  </Badge>
                  {p.org && <Badge variant="outline" className="font-normal">{ORG_LABELS[p.org] ?? p.org}</Badge>}
                  {suspended && <Badge className="border-transparent bg-red-600 text-white">Suspended</Badge>}
                  {isSelf && <Badge variant="secondary">You</Badge>}
                </div>
              </div>

              <div className="flex w-full flex-col gap-1.5 text-left text-xs text-muted-foreground">
                {p.department && <span className="flex items-center gap-2"><Briefcase className="size-3.5 shrink-0" /> {p.department}</span>}
                {p.phone && <span className="flex items-center gap-2"><Phone className="size-3.5 shrink-0" /> {p.phone}</span>}
                {p.contact_email && <span className="flex items-center gap-2 break-all"><Mail className="size-3.5 shrink-0" /> {p.contact_email}</span>}
              </div>

            </aside>

            {/* ── Tabs ──────────────────────────────────────────────── */}
            <div className="min-w-0 px-6 py-5">
              <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
                <TabsList className="mb-5">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  {(isSelf || viewerAdmin) && <TabsTrigger value="access">Access</TabsTrigger>}
                  {(isSelf || viewerAdmin) && <TabsTrigger value="security">Security</TabsTrigger>}
                </TabsList>
                <TabsContent value="overview"><ProfileOverviewTab profile={p} perms={perms} /></TabsContent>
                <TabsContent value="access"><ProfileAccessTab profile={p} perms={perms} /></TabsContent>
                <TabsContent value="security"><ProfileSecurityTab profile={p} perms={perms} onDeleted={onClose} /></TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
