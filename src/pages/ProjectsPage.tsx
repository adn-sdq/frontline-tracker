import { useNavigate } from "react-router-dom"
import { ArrowRight, FolderOpen, Loader2, LogOut } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { useProject } from "@/contexts/ProjectContext"
import { Button } from "@/components/ui/button"
import { FitLogo } from "@/components/FitLogo"

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

export default function ProjectsPage() {
  const { profile, user, signOut } = useAuth()
  const { projects, loading, setCurrentProject } = useProject()
  const navigate = useNavigate()
  const name = profile?.full_name ?? profile?.username ?? user?.email ?? "User"
  const firstName = name.split(" ")[0]

  function open(id: string) {
    setCurrentProject(id)
    navigate("/", { replace: true })
  }

  return (
    <div className="relative min-h-svh overflow-hidden bg-muted/30">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -top-48 -right-32 size-112 rounded-full bg-[#E37C30]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -left-32 size-112 rounded-full bg-[#1B354F]/10 blur-3xl" />

      {/* Top bar */}
      <header className="relative">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-2.5">
            <FitLogo size={32} />
            <div className="leading-tight">
              <div className="text-sm font-semibold">FIT</div>
              <div className="text-[11px] text-muted-foreground">
                Frontline Internal Tools
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => void signOut()}
          >
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="relative mx-auto max-w-4xl px-5 pb-20 pt-10 sm:pt-16">
        {/* Hero */}
        <div className="mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
            {greeting()}
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-tight text-foreground sm:text-5xl">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-3 max-w-md text-muted-foreground">
            Choose a project to step into its procurement, documents and
            delivery coordination.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : projects.length === 0 ? (
          <div className="relative overflow-hidden rounded-2xl border bg-card py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FolderOpen className="size-7" />
            </div>
            <p className="font-display text-xl">No projects assigned yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              An admin needs to assign you to a project before you can start.
              {profile?.is_admin && " As an admin, create one in the Admin panel."}
            </p>
            {profile?.is_admin && (
              <Button className="mt-5" onClick={() => navigate("/admin")}>
                Go to Admin
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => open(p.id)}
                className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
              >
                {/* Top accent bar — reveals on hover */}
                <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />

                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <FolderOpen className="size-5" />
                  </div>
                  <ArrowRight className="size-5 text-muted-foreground/50 transition-all group-hover:translate-x-1 group-hover:text-primary" />
                </div>

                <div className="mt-4 font-display text-xl tracking-tight">
                  {p.name}
                </div>
                {p.description ? (
                  <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {p.description}
                  </div>
                ) : (
                  <div className="mt-1 text-sm text-muted-foreground/60">
                    Tap to open
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
