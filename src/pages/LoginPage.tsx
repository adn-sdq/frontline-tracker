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

const FEATURES = [
  "Real-time collaboration",
  "Full audit trail",
  "Multi-project support",
]

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

  return (
    <>
      <div className="flex min-h-svh flex-col lg:flex-row">

        {/* ── Brand panel ─────────────────────────────────────── */}
        <div className="relative flex items-center justify-center overflow-hidden bg-[#1B354F] px-8 py-10 lg:w-[44%] lg:py-0">
          {/* Dot grid texture */}
          <div className="login-dot-grid absolute inset-0 opacity-[0.055]" />
          {/* Glow blobs */}
          <div className="absolute -top-24 -left-24 size-72 rounded-full bg-[#E37C30] opacity-10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 size-96 rounded-full bg-[#E37C30] opacity-[0.07] blur-3xl" />
          {/* Watermark logo — big, centered, faint */}
          <div className="absolute inset-0 hidden items-center justify-center opacity-[0.07] -rotate-6 lg:flex">
            <FitLogo size={620} orangeColor="white" navyColor="white" />
          </div>
          {/* Right edge accent line (desktop) */}
          <div className="login-accent-v absolute right-0 top-0 bottom-0 hidden w-px lg:block" />
          {/* Bottom edge accent line (mobile) */}
          <div className="login-accent-h absolute bottom-0 left-0 right-0 h-px lg:hidden" />

          {/* Main content — centered */}
          <div className="relative z-10 flex flex-col items-center gap-0 text-center">
            {/* Logo + name — hero unit */}
            <FitLogo size={48} navyColor="rgba(255,255,255,0.55)" />
            <h1 className="mt-5 text-5xl font-bold tracking-tight text-white">FIT</h1>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E37C30]">
              Frontline Internal Tools
            </p>

            {/* Divider */}
            <div className="my-6 h-px w-10 bg-white/20" />

            {/* Description + features — secondary */}
            <p className="hidden max-w-[26ch] text-sm leading-relaxed text-white/50 lg:block">
              Procurement & installation coordination for AV, PAVA, IPTV & Screens.
            </p>

            <ul className="mt-5 hidden flex-col items-start gap-3 lg:flex">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-white/55">
                  <span className="size-1.5 shrink-0 rounded-full bg-[#E37C30]" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Form panel ──────────────────────────────────────── */}
        <div className="flex flex-1 flex-col items-center justify-center bg-background px-8 py-12 lg:py-0">
          <div className="w-full max-w-sm">

            {/* Heading */}
            <div className="mb-7">
              <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in with your team credentials
              </p>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="your.name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  required
                  disabled={busy}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
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
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    tabIndex={-1}
                    className="absolute right-0 top-0 h-full w-10 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword
                      ? <EyeOff className="size-4" />
                      : <Eye className="size-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="mt-1 w-full"
                size="lg"
                disabled={busy || !username.trim() || !password}
              >
                {busy
                  ? <><Loader2 className="size-4 animate-spin" /> Signing in…</>
                  : "Sign in"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 text-muted-foreground"
                onClick={() => setFeatureOpen(true)}
              >
                <Lightbulb className="size-4" />
                Request a feature
              </Button>
            </form>

            {/* Footer */}
            <p className="mt-6 text-center text-xs text-muted-foreground/60 font-mono">
              {APP_VERSION} · {APP_VERSION_DATE}
            </p>

          </div>
        </div>
      </div>

      <FeatureRequestDialog open={featureOpen} onClose={() => setFeatureOpen(false)} />
    </>
  )
}
