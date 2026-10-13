import { format } from "date-fns"
import { History } from "lucide-react"

import { EmptyState } from "@/components/ui/empty-state"
import { Spinner } from "@/components/ui/spinner"
import { useProfileHistory } from "@/hooks/useAdmin"
import { useProfiles } from "@/hooks/useItems"
import { APP_PAGE_LABELS, ORG_LABELS, ROLE_LABELS, type AppPage, type Profile } from "@/lib/types"

const FIELD_LABELS: Record<string, string> = {
  full_name: "Full name",
  username: "Username",
  role: "Role",
  is_admin: "Admin",
  org: "Organisation",
  allowed_pages: "Page access",
  is_tech_manager: "Technicians manager",
  is_sla_manager: "SLA manager",
  avatar_url: "Photo",
  job_title: "Job title",
  department: "Department",
  phone: "Phone",
  contact_email: "Contact email",
  employee_id: "Employee ID",
  location: "Based at",
  bio: "About",
  status: "Status",
  status_reason: "Suspension reason",
}

function fmt(field: string, v: unknown): string {
  if (v === null || v === undefined || v === "") return field === "allowed_pages" ? "All pages" : "—"
  if (typeof v === "boolean") return v ? "Yes" : "No"
  if (field === "avatar_url") return "updated"
  if (field === "role") return ROLE_LABELS[v as keyof typeof ROLE_LABELS] ?? String(v)
  if (field === "org") return ORG_LABELS[v as keyof typeof ORG_LABELS] ?? String(v)
  if (field === "allowed_pages" && Array.isArray(v)) {
    return v.length ? v.map((p) => APP_PAGE_LABELS[p as AppPage] ?? p).join(", ") : "None"
  }
  return String(v)
}

/** Audit log of changes to a profile: what changed, from → to, and who did it. */
export function ProfileActivityTab({ profile }: { profile: Profile }) {
  const { data: rows, isLoading } = useProfileHistory(profile.id)
  const { data: profiles = {} } = useProfiles()
  const who = (id: string | null) =>
    !id ? "System" : id === profile.id ? "Themself" : profiles[id]?.full_name ?? profiles[id]?.username ?? "Unknown"

  if (isLoading) return <div className="flex justify-center py-8"><Spinner className="size-5" /></div>
  if (!rows?.length) {
    return <EmptyState icon={History} title="No changes recorded" description="Edits to this profile will appear here." compact />
  }

  return (
    <ol className="relative flex flex-col gap-3 border-l pl-4">
      {rows.map((h) => (
        <li key={h.id} className="relative">
          <span className="absolute top-1.5 -left-[20.5px] size-2 rounded-full bg-border ring-4 ring-background" />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{who(h.changed_by)}</span> ·{" "}
            {format(new Date(h.changed_at), "d MMM yyyy, HH:mm")}
          </p>
          {h.action === "create" && <p className="text-sm">Account created</p>}
          {h.diff && (
            <ul className="mt-0.5 flex flex-col gap-0.5 text-sm">
              {Object.entries(h.diff).map(([field, c]) => (
                <li key={field} className="flex flex-wrap items-baseline gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">{FIELD_LABELS[field] ?? field}:</span>
                  {field === "avatar_url" ? (
                    <span>{c.new ? "Photo changed" : "Photo removed"}</span>
                  ) : (
                    <>
                      <span className="break-all text-muted-foreground line-through">{fmt(field, c.old)}</span>
                      <span>→</span>
                      <span className="break-all font-medium">{fmt(field, c.new)}</span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  )
}
