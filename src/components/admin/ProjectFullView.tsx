import { format, parseISO } from "date-fns"
import {
  Archive,
  ArchiveRestore,
  ArrowRight,
  Building2,
  ClipboardList,
  FileText,
  Hash,
  LifeBuoy,
  MapPin,
  Package,
  Pencil,
  Phone,
  Users,
  X,
} from "lucide-react"
import * as DialogPrimitive from "@radix-ui/react-dialog"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ProjectLogo } from "@/components/ProjectLogo"
import { UserAvatar } from "@/components/UserAvatar"
import { displayName } from "@/components/profile/shared"
import { useAccessRoles } from "@/hooks/useAdmin"
import { useProjectStats } from "@/hooks/useProjects"
import { useSystems } from "@/hooks/useSystems"
import { roleFor } from "@/lib/access"
import { cn } from "@/lib/utils"
import type { Profile, Project } from "@/lib/types"

function StatTile({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: number | undefined }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-card p-4">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </span>
      {value === undefined ? (
        <Skeleton className="h-8 w-12" />
      ) : (
        <span className="text-3xl font-semibold tracking-tight tabular-nums">{value}</span>
      )}
    </div>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon?: typeof Package; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {Icon && <Icon className="size-3.5" />} {title}
      </h3>
      {children}
    </section>
  )
}

/** Full-screen read view of one project, opened from Admin → Projects. */
export function ProjectFullView({
  project: p,
  systems,
  members,
  onClose,
  onEdit,
  onToggleActive,
  onOpenWorkspace,
}: {
  project: Project | null
  systems: string[]
  members: Profile[]
  onClose: () => void
  onEdit: () => void
  onToggleActive: () => void
  onOpenWorkspace: () => void
}) {
  const { data: stats } = useProjectStats(p?.id ?? null)
  const { labelFor } = useSystems()
  const { data: roles = [] } = useAccessRoles()

  const details = p
    ? [
        { icon: Building2, label: "Client / deliver to", value: p.client_name },
        { icon: MapPin, label: "Site location", value: p.site_location },
        { icon: Phone, label: "Site contact", value: p.site_contact },
        { icon: Hash, label: "Our PO", value: p.our_po, mono: true },
        { icon: Hash, label: "Client PO", value: p.client_po, mono: true },
      ]
    : []

  return (
    <DialogPrimitive.Root open={!!p} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex flex-col bg-background duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
        >
          {p && (
            <>
              {/* Header */}
              <header className="shrink-0 border-b pt-[env(safe-area-inset-top,0px)]">
                <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-4 px-6 py-5">
                  <ProjectLogo project={p} size={64} className="rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <DialogPrimitive.Title className="truncate text-2xl font-semibold tracking-tight">{p.name}</DialogPrimitive.Title>
                      <Badge
                        className={cn(
                          "border-transparent",
                          p.active
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {p.active ? "Active" : "Archived"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {p.description || "No description"} · Created {format(parseISO(p.created_at), "d MMM yyyy")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={onEdit}>
                      <Pencil className="size-4" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={onToggleActive}>
                      {p.active ? <><Archive className="size-4" /> Archive</> : <><ArchiveRestore className="size-4" /> Restore</>}
                    </Button>
                    <Button size="sm" onClick={onOpenWorkspace}>
                      Open workspace <ArrowRight className="size-4" />
                    </Button>
                    <DialogPrimitive.Close asChild>
                      <Button variant="ghost" size="icon" aria-label="Close">
                        <X className="size-5" />
                      </Button>
                    </DialogPrimitive.Close>
                  </div>
                </div>
              </header>

              {/* Body */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <StatTile icon={Package} label="Items" value={stats?.items} />
                    <StatTile icon={FileText} label="Documents" value={stats?.documents} />
                    <StatTile icon={ClipboardList} label="Delivery notes" value={stats?.deliveryNotes} />
                    <StatTile icon={LifeBuoy} label="Tickets" value={stats?.tickets} />
                  </div>

                  <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
                    <Section title="Project details">
                      <dl className="divide-y rounded-lg border">
                        {details.map((d) => (
                          <div key={d.label} className="flex items-center gap-3 px-4 py-3 text-sm">
                            <d.icon className="size-4 shrink-0 text-muted-foreground" />
                            <dt className="w-40 shrink-0 text-muted-foreground">{d.label}</dt>
                            <dd className={cn("min-w-0 flex-1 truncate font-medium", d.mono && "font-mono text-xs", !d.value && "font-normal text-muted-foreground/60")}>
                              {d.value || "Not set"}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </Section>

                    <div className="flex flex-col gap-8">
                      <Section title={`Systems (${systems.length})`}>
                        {systems.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No systems enabled.</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {systems.map((k) => (
                              <Badge key={k} variant="outline">{labelFor(k)}</Badge>
                            ))}
                          </div>
                        )}
                      </Section>

                      <Section title={`Team (${members.length})`} icon={Users}>
                        {members.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No members yet. Admins always have access; add people in Admin → Access.
                          </p>
                        ) : (
                          <ul className="divide-y rounded-lg border">
                            {members.map((m) => (
                              <li key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                                <UserAvatar name={displayName(m)} src={m.avatar_url} seed={m.id} className="size-8" />
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-medium">{displayName(m)}</div>
                                  <div className="truncate text-xs text-muted-foreground">
                                    {[m.job_title, m.phone].filter(Boolean).join(" · ") || "@" + m.username}
                                  </div>
                                </div>
                                <Badge variant="secondary" className="shrink-0 text-[10px]">
                                  {roleFor(m, roles)?.name ?? "No access"}
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        )}
                      </Section>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
