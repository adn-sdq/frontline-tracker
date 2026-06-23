import { useNavigate } from "react-router-dom"
import { ChevronRight, FolderOpen, Loader2, LogOut, PackageCheck } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { useProject } from "@/contexts/ProjectContext"
import { Button } from "@/components/ui/button"

export default function ProjectsPage() {
  const { profile, user, signOut } = useAuth()
  const { projects, loading, setCurrentProject } = useProject()
  const navigate = useNavigate()
  const name = profile?.full_name ?? profile?.username ?? user?.email ?? "User"

  function open(id: string) {
    setCurrentProject(id)
    navigate("/", { replace: true })
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <PackageCheck className="size-5" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Frontline Tracker</div>
              <div className="text-xs text-muted-foreground">MiSK Ilmi</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => void signOut()}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight">
            Welcome, {name.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            Choose a project to open.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border bg-card py-16 text-center">
            <FolderOpen className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="font-medium">No projects assigned yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              An admin needs to assign you to a project before you can start.
              {profile?.is_admin && " As an admin, create one in the Admin panel."}
            </p>
            {profile?.is_admin && (
              <Button
                className="mt-4"
                onClick={() => navigate("/admin")}
              >
                Go to Admin
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => open(p.id)}
                className="group flex flex-col gap-1 rounded-xl border bg-card p-5 text-left transition-colors hover:border-primary/50 hover:bg-accent/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FolderOpen className="size-5" />
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <div className="mt-2 font-semibold">{p.name}</div>
                {p.description && (
                  <div className="line-clamp-2 text-sm text-muted-foreground">
                    {p.description}
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
