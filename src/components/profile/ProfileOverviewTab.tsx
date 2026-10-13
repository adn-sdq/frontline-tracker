import { useEffect, useState } from "react"
import { Loader2, Pencil } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUpdateProfile, type ProfilePatch } from "@/hooks/useAdmin"
import type { Profile } from "@/lib/types"
import { SectionTitle, withToast, type ProfilePerms } from "./shared"

type DetailKey = "full_name" | "job_title" | "department" | "phone" | "contact_email" | "employee_id" | "location" | "bio"

const FIELDS: { key: DetailKey; label: string; type?: string; adminOnly?: boolean; wide?: boolean }[] = [
  { key: "full_name", label: "Full name" },
  { key: "job_title", label: "Job title" },
  { key: "department", label: "Department" },
  { key: "employee_id", label: "Employee ID", adminOnly: true },
  { key: "phone", label: "Phone", type: "tel" },
  { key: "contact_email", label: "Contact email", type: "email" },
  { key: "location", label: "Based at", wide: true },
]

function toForm(p: Profile): Record<DetailKey, string> {
  return {
    full_name: p.full_name ?? "",
    job_title: p.job_title ?? "",
    department: p.department ?? "",
    phone: p.phone ?? "",
    contact_email: p.contact_email ?? "",
    employee_id: p.employee_id ?? "",
    location: p.location ?? "",
    bio: p.bio ?? "",
  }
}

export function ProfileOverviewTab({ profile, perms }: { profile: Profile; perms: ProfilePerms }) {
  const update = useUpdateProfile()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(() => toForm(profile))

  useEffect(() => {
    if (!editing) setForm(toForm(profile))
  }, [profile, editing])

  async function save() {
    if (form.contact_email && !/^\S+@\S+\.\S+$/.test(form.contact_email)) {
      return toast.error("Enter a valid email address")
    }
    const patch: ProfilePatch = {}
    for (const f of [...FIELDS, { key: "bio" as const, adminOnly: false }]) {
      if (f.adminOnly && !perms.viewerAdmin) continue
      const next = form[f.key].trim() || null
      if (next !== (profile[f.key] ?? null)) patch[f.key] = next
    }
    if (Object.keys(patch).length === 0) return setEditing(false)
    const ok = await withToast(() => update.mutateAsync({ id: profile.id, patch }), "Profile updated", "Could not save")
    if (ok) setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {FIELDS.filter((f) => !f.adminOnly || perms.viewerAdmin).map((f) => (
            <div key={f.key} className={f.wide ? "grid gap-1.5 sm:col-span-2" : "grid gap-1.5"}>
              <Label className="text-xs text-muted-foreground">{f.label}</Label>
              <Input
                type={f.type ?? "text"}
                value={form[f.key]}
                onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="grid gap-1.5 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">About</Label>
            <Textarea
              rows={3}
              value={form.bio}
              onChange={(e) => setForm((s) => ({ ...s, bio: e.target.value }))}
              placeholder="Responsibilities, specialisms, certifications…"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setEditing(false)} disabled={update.isPending}>Cancel</Button>
          <Button onClick={save} disabled={update.isPending}>
            {update.isPending && <Loader2 className="size-4 animate-spin" />} Save details
          </Button>
        </div>
      </div>
    )
  }

  const rows = FIELDS.filter((f) => f.key !== "full_name")
  return (
    <div className="flex flex-col gap-5">
      <div>
        <SectionTitle
          action={
            perms.editDetails && (
              <Button size="sm" variant="ghost" className="h-7" onClick={() => setEditing(true)}>
                <Pencil className="size-3.5" /> Edit details
              </Button>
            )
          }
        >
          Contact & role details
        </SectionTitle>
        <dl className="grid gap-x-6 gap-y-2.5 text-sm sm:grid-cols-[8.5rem_1fr]">
          {rows.map((f) => (
            <div key={f.key} className="contents">
              <dt className="text-muted-foreground">{f.label}</dt>
              <dd className="min-w-0 break-words">{profile[f.key] || <span className="text-muted-foreground/60">—</span>}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div>
        <SectionTitle>About</SectionTitle>
        <p className="whitespace-pre-wrap text-sm">
          {profile.bio || <span className="text-muted-foreground/60">Nothing here yet.</span>}
        </p>
      </div>
    </div>
  )
}
