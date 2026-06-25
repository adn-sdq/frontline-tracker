import { useState } from "react"
import { Lightbulb, Loader2 } from "lucide-react"
import { FitLogo } from "@/components/FitLogo"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { APP_VERSION, APP_VERSION_DATE } from "@/lib/version"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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

function FeatureRequestDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!title.trim()) {
      toast.error("Please enter a title")
      return
    }
    setBusy(true)
    try {
      const { error } = await supabase.from("feature_requests").insert({
        title: title.trim(),
        description: description.trim() || null,
      })
      if (error) throw error
      toast.success("Request submitted — thanks!")
      setTitle("")
      setDescription("")
      onClose()
    } catch (e) {
      toast.error("Could not submit", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request a feature</DialogTitle>
          <DialogDescription>
            Describe what you'd like to see in FIT.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short summary of the feature"
              autoFocus
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">
              Details (optional)
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the problem it solves or how it should work…"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || !title.trim()}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function LoginPage() {
  const { signIn } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [featureOpen, setFeatureOpen] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username || !password) return
    setBusy(true)
    try {
      await signIn(username, password)
    } catch (err) {
      toast.error("Sign in failed", {
        description:
          err instanceof Error ? err.message : "Check your name and password.",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-linear-to-br from-background to-muted">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="rounded-full border bg-background/60 px-2.5 py-0.5 font-mono text-xs text-muted-foreground backdrop-blur">
          {APP_VERSION} · {APP_VERSION_DATE}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-muted-foreground"
          onClick={() => setFeatureOpen(true)}
        >
          <Lightbulb className="size-3.5" />
          Request a feature
        </Button>
      </div>

      {/* Login card */}
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <FitLogo size={52} />
            <div>
              <h1 className="text-xl font-semibold tracking-tight">FIT</h1>
              <p className="text-sm text-muted-foreground">
                Frontline Internal Tools · MiSK Ilmi
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Name</Label>
                  <Input
                    id="username"
                    autoFocus
                    autoCapitalize="none"
                    autoComplete="username"
                    placeholder="your name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={busy} className="mt-1">
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  Sign in
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Internal tool — contact your project admin for access.
          </p>

          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <Link to="/changelog" className="hover:text-foreground transition-colors">
              Changelog
            </Link>
            <span>·</span>
            <Link to="/docs" className="hover:text-foreground transition-colors">
              Docs
            </Link>
          </div>
        </div>
      </div>

      <FeatureRequestDialog
        open={featureOpen}
        onClose={() => setFeatureOpen(false)}
      />
    </div>
  )
}
