import { useState } from "react"
import { Loader2, PackageCheck } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const { signIn } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)

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
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <PackageCheck className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Frontline Tracker
            </h1>
            <p className="text-sm text-muted-foreground">
              MiSK Ilmi · Procurement & installation
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
      </div>
    </div>
  )
}
