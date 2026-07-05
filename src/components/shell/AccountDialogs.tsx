import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function FeatureRequestDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!title.trim()) { toast.error("Please enter a title"); return }
    setBusy(true)
    try {
      const { error } = await supabase.from("feature_requests").insert({
        title: title.trim(),
        description: description.trim() || null,
      })
      if (error) throw error
      toast.success("Request submitted — thanks!")
      setTitle(""); setDescription(""); onClose()
    } catch (err) {
      toast.error("Could not submit", { description: err instanceof Error ? err.message : "Unknown error" })
    } finally { setBusy(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request a feature</DialogTitle>
          <DialogDescription>Describe what you'd like to see in FIT.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short summary of the feature" autoFocus />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Details (optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the problem it solves or how it should work…" rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy || !title.trim()}>
            {busy && <Loader2 className="size-4 animate-spin" />}Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [newPw, setNewPw] = useState("")
  const [confirm, setConfirm] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (newPw.length < 6) { toast.error("Password must be at least 6 characters"); return }
    if (newPw !== confirm) { toast.error("Passwords do not match"); return }
    setBusy(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) throw error
      toast.success("Password updated")
      setNewPw(""); setConfirm(""); onClose()
    } catch (e) {
      toast.error("Could not update password", { description: e instanceof Error ? e.message : "Unknown error" })
    } finally { setBusy(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>Choose a new password for your account.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">New password</Label>
            <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="at least 6 characters" autoFocus />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Confirm password</Label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy || newPw.length < 6}>
            {busy && <Loader2 className="size-4 animate-spin" />} Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
