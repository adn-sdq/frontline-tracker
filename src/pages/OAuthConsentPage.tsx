import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Eye, Loader2, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FitLogo } from "@/components/FitLogo"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { errorMessage } from "@/lib/utils"

type Details = {
  authorization_id: string
  client: { name?: string; client_name?: string }
  redirect_uri: string
  scope: string
}

/**
 * Where Supabase sends someone who is connecting Claude (or another MCP client)
 * to FIT. They sign in if needed, see who is asking, and approve or deny.
 * Approving hands that app a read-only token for THEIR account only.
 */
export default function OAuthConsentPage() {
  const [params] = useSearchParams()
  const authorizationId = params.get("authorization_id")
  const { session, loading, signIn } = useAuth()

  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const [signingIn, setSigningIn] = useState(false)
  const [details, setDetails] = useState<Details | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<"approve" | "deny" | null>(null)

  // Once signed in, ask Supabase what is being requested.
  useEffect(() => {
    if (!session || !authorizationId) return
    let live = true
    void (async () => {
      const { data, error: e } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId)
      if (!live) return
      if (e || !data) return setError(e?.message ?? "This request is invalid or has expired.")
      // Already approved before: Supabase hands back the redirect directly.
      if (!("authorization_id" in data)) {
        window.location.replace((data as { redirect_url: string }).redirect_url)
        return
      }
      setDetails(data as unknown as Details)
    })()
    return () => {
      live = false
    }
  }, [session, authorizationId])

  async function submitSignIn(e: React.FormEvent) {
    e.preventDefault()
    setSigningIn(true)
    setError(null)
    try {
      await signIn(login, password)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSigningIn(false)
    }
  }

  async function decide(kind: "approve" | "deny") {
    if (!authorizationId) return
    setBusy(kind)
    const res =
      kind === "approve"
        ? await supabase.auth.oauth.approveAuthorization(authorizationId)
        : await supabase.auth.oauth.denyAuthorization(authorizationId)
    if (res.error || !res.data) {
      setBusy(null)
      return setError(res.error?.message ?? "Could not complete the request.")
    }
    window.location.assign(res.data.redirect_url)
  }

  const clientName = details?.client?.name ?? details?.client?.client_name ?? "An app"

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-2.5">
          <FitLogo size={30} />
          <div className="leading-tight">
            <div className="text-sm font-semibold">FIT</div>
            <div className="text-[10px] text-muted-foreground">Frontline Internal Tools</div>
          </div>
        </div>

        {!authorizationId ? (
          <p className="text-sm text-muted-foreground">This page opens from an app asking to connect to FIT. Nothing to approve here.</p>
        ) : loading ? (
          <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : !session ? (
          <form onSubmit={submitSignIn} className="grid gap-3">
            <div>
              <h1 className="text-lg font-semibold">Sign in to continue</h1>
              <p className="text-sm text-muted-foreground">Use your FIT work email to connect Claude to your account.</p>
            </div>
            <Input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Work email or username" autoCapitalize="none" autoComplete="username" autoFocus />
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={signingIn || !login.trim() || !password}>
              {signingIn && <Loader2 className="size-4 animate-spin" />} Sign in
            </Button>
          </form>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : !details ? (
          <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid gap-5">
            <div>
              <h1 className="text-lg font-semibold">Connect {clientName} to FIT?</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{session.user.email}</span>
              </p>
            </div>

            <ul className="grid gap-2.5 rounded-lg border bg-muted/30 p-3.5 text-sm">
              <li className="flex gap-2.5"><Eye className="mt-0.5 size-4 shrink-0 text-primary" /> View the projects, items and documents you can already see in FIT</li>
              <li className="flex gap-2.5"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" /> Read-only — it can't change, add or delete anything</li>
            </ul>

            <p className="text-xs text-muted-foreground">
              You can disconnect any time from your Claude settings. Only approve if you started this from Claude.
            </p>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => decide("deny")} disabled={busy !== null}>
                {busy === "deny" && <Loader2 className="size-4 animate-spin" />} Deny
              </Button>
              <Button className="flex-1" onClick={() => decide("approve")} disabled={busy !== null}>
                {busy === "approve" && <Loader2 className="size-4 animate-spin" />} Approve
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
