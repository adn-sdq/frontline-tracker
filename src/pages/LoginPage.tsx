import { useState } from "react"
import { Eye, EyeOff, Lightbulb, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { APP_VERSION, APP_VERSION_DATE } from "@/lib/version"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FitLogo } from "@/components/FitLogo"
import { LoginArt } from "@/components/LoginArt"
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
    } catch (err) {
      toast.error("Could not submit", {
        description: err instanceof Error ? err.message : "Unknown error",
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
  const [showPassword, setShowPassword] = useState(false)
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

  const fieldClass =
    "h-12 rounded-xl border-transparent bg-muted/60 px-4 text-sm shadow-none focus-visible:border-primary focus-visible:bg-background focus-visible:ring-primary/15"

  return (
    <>
      {/* ── Mobile: full-screen art-top layout ─────────────────── */}
      <div className="flex min-h-svh flex-col bg-card lg:hidden">
        {/* Art fills top ~42% of screen */}
        <div className="relative h-[42svh] shrink-0 overflow-hidden">
          <LoginArt className="h-full w-full" />
          {/* Fade to card bg at the bottom edge */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-card to-transparent" />
          {/* Logo pinned top-left */}
          <div className="absolute left-5 top-5 flex items-center gap-2">
            <FitLogo size={30} navyColor="rgba(255,255,255,0.6)" />
            <div className="leading-tight">
              <div className="text-sm font-bold text-white">FIT</div>
              <div className="text-[10px] font-medium uppercase tracking-widest text-white/55">
                Frontline Internal Tools
              </div>
            </div>
          </div>
        </div>

        {/* Form fills remaining height */}
        <div className="flex flex-1 flex-col justify-between px-6 pb-8 pt-5">
          <div>
            {/* Heading */}
            <div className="mb-7">
              <p className="text-xs font-medium text-muted-foreground">Sign in to</p>
              <h1 className="mt-1 font-display text-[2.1rem] leading-[1.1] tracking-tight text-foreground">
                Where Every Part
                <br />
                Finds Its{" "}
                <span className="italic text-primary">Place</span>
              </h1>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-3">
              <Input
                id="username-m"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                disabled={busy}
                className={fieldClass}
              />
              <div className="relative">
                <Input
                  id="password-m"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={busy}
                  className={`${fieldClass} pr-12`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  tabIndex={-1}
                  className="absolute right-1 top-1 size-10 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
              <Button
                type="submit"
                className="h-12 w-full rounded-xl text-sm font-semibold"
                disabled={busy || !username.trim() || !password}
              >
                {busy
                  ? <><Loader2 className="size-4 animate-spin" /> Signing in…</>
                  : "Sign in"}
              </Button>
            </form>

            <p className="mt-4 text-xs text-muted-foreground">
              Need access?{" "}
              <span className="font-medium text-foreground">Contact your project admin.</span>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <span className="font-mono text-[10px] text-muted-foreground/60">
              {APP_VERSION} · {APP_VERSION_DATE}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto gap-1.5 p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setFeatureOpen(true)}
            >
              <Lightbulb className="size-3" />
              Request a feature
            </Button>
          </div>
        </div>
      </div>

      {/* ── Desktop: floating card ──────────────────────────────── */}
      <div className="relative hidden min-h-svh items-center justify-center overflow-hidden bg-muted/40 p-6 lg:flex">
        <div className="absolute -top-40 -left-40 size-96 rounded-full bg-[#1B354F]/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 size-96 rounded-full bg-[#E37C30]/10 blur-3xl" />

        <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border bg-card shadow-2xl lg:grid-cols-[1.04fr_1fr]">

          {/* Art panel */}
          <div className="relative p-3">
            <div className="relative h-full min-h-145 w-full overflow-hidden rounded-2xl">
              <LoginArt className="h-full w-full" />
              <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/45 via-transparent to-transparent p-7">
                <p className="font-display text-lg italic leading-snug text-white/90">
                  "Every part, in its place — on time, on record."
                </p>
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-white/55">
                  Frontline Internal Tools
                </p>
              </div>
            </div>
          </div>

          {/* Form panel */}
          <div className="flex flex-col p-12">
            <div className="flex flex-1 flex-col justify-center">
              <div className="mb-8">
                <p className="text-sm font-medium text-muted-foreground">Sign in to</p>
                <h1 className="mt-1.5 font-display text-5xl leading-[1.08] tracking-tight text-foreground">
                  Where Every Part
                  <br />
                  Finds Its{" "}
                  <span className="italic text-primary">Place</span>
                </h1>
              </div>

              <form onSubmit={onSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-xs text-muted-foreground">
                    Username
                  </Label>
                  <Input
                    id="username"
                    placeholder="your.name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    autoFocus
                    required
                    disabled={busy}
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs text-muted-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                      disabled={busy}
                      className={`${fieldClass} pr-12`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      tabIndex={-1}
                      className="absolute right-1 top-1 size-10 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="mt-2 h-12 w-full rounded-xl text-sm font-semibold"
                  disabled={busy || !username.trim() || !password}
                >
                  {busy
                    ? <><Loader2 className="size-4 animate-spin" /> Signing in…</>
                    : "Sign in"}
                </Button>
              </form>

              <p className="mt-5 text-xs text-muted-foreground">
                Need access?{" "}
                <span className="font-medium text-foreground">Contact your project admin.</span>
              </p>
            </div>

            <div className="mt-10 flex items-center justify-between border-t pt-5">
              <div className="flex items-center gap-2.5">
                <FitLogo size={26} />
                <div className="leading-tight">
                  <div className="text-sm font-semibold">FIT</div>
                  <div className="text-[11px] text-muted-foreground">Frontline Internal Tools</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto gap-1.5 p-0 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setFeatureOpen(true)}
                >
                  <Lightbulb className="size-3" />
                  Request a feature
                </Button>
                <span className="font-mono text-[10px] text-muted-foreground/60">
                  {APP_VERSION} · {APP_VERSION_DATE}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FeatureRequestDialog open={featureOpen} onClose={() => setFeatureOpen(false)} />
    </>
  )
}
