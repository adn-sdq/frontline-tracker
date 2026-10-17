import { useEffect, useRef, useState } from "react"
import { errorMessage } from "@/lib/utils"
import { ImagePlus, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ProjectLogo } from "@/components/ProjectLogo"
import { useFileDrop } from "@/components/ui/file-dropzone"
import { useCreateProject, useSetProjectLogo, useUpdateProject, type ProjectInput } from "@/hooks/useProjects"
import { useProjectSystemKeys, useSetProjectSystems, useSystems } from "@/hooks/useSystems"

export function blankProjectInput(): ProjectInput {
  return {
    name: "", description: "", code: "",
    client_name: "", client_po: "", our_po: "", site_location: "", site_contact: "",
  }
}

export function ProjectDialog({
  open,
  onClose,
  initial,
  projectId,
  projectsCount,
  logoUrl,
}: {
  open: boolean
  onClose: () => void
  initial: ProjectInput
  projectId?: string        // undefined = create, string = edit
  projectsCount: number     // for sort on create
  logoUrl?: string | null   // current logo when editing
}) {
  const create = useCreateProject()
  const update = useUpdateProject()
  const setProjectSystems = useSetProjectSystems()
  const setLogo = useSetProjectLogo()
  const { systems: allSystems } = useSystems()
  const activeSystems = allSystems.filter((s) => s.active)
  const { data: existingKeys } = useProjectSystemKeys(projectId ?? null)

  const [form, setForm] = useState<ProjectInput>(initial)
  const [selectedSystems, setSelectedSystems] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  // undefined = unchanged, File = new logo, null = remove
  const [logoFile, setLogoFile] = useState<File | null | undefined>(undefined)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const isNew = !projectId

  useEffect(() => {
    if (!logoFile) return setLogoPreview(null)
    const u = URL.createObjectURL(logoFile)
    setLogoPreview(u)
    return () => URL.revokeObjectURL(u)
  }, [logoFile])

  const logoDrop = useFileDrop({
    accept: "image/png,image/jpeg,image/webp,image/gif",
    disabled: busy,
    onFiles: ([f]) => {
      if (f.size > 2 * 1024 * 1024) return toast.error("Logo must be under 2 MB")
      setLogoFile(f)
    },
  })
  const shownLogo = logoFile === undefined ? logoUrl ?? null : logoPreview

  const prevOpenRef = useRef(false)
  const systemsSeededRef = useRef(false)

  // Seed form and systems when dialog opens.
  useEffect(() => {
    const justOpened = open && !prevOpenRef.current
    prevOpenRef.current = open
    if (!open) { systemsSeededRef.current = false; return }
    if (!justOpened) return
    setForm(initial)
    setLogoFile(undefined)
    if (!isNew && existingKeys !== undefined) {
      setSelectedSystems(existingKeys)
      systemsSeededRef.current = true
    } else {
      // Default: all active systems. If activeSystems is empty (still loading),
      // leave seeded=false so the second effect can fill in once data arrives.
      setSelectedSystems(activeSystems.map((s) => s.key))
      systemsSeededRef.current = activeSystems.length > 0 && isNew
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial])

  // When active systems or existing keys load after dialog opens, apply them once.
  useEffect(() => {
    if (!open || systemsSeededRef.current) return
    if (isNew) {
      if (activeSystems.length === 0) return  // still loading
      setSelectedSystems(activeSystems.map((s) => s.key))
      systemsSeededRef.current = true
    } else {
      if (existingKeys === undefined) return  // still loading
      setSelectedSystems(existingKeys)
      systemsSeededRef.current = true
    }
  }, [existingKeys, activeSystems, open, isNew])

  const set = (k: keyof ProjectInput, v: string) => setForm((f) => ({ ...f, [k]: v }))

  function toggleSystem(key: string) {
    setSelectedSystems((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const code = (form.code ?? "").trim().toUpperCase()
  const codeValid = code === "" || /^[A-Z0-9]{2,6}$/.test(code)

  async function save() {
    setBusy(true)
    try {
      let pid: string
      if (isNew) {
        const project = await create.mutateAsync({ ...form, sort: projectsCount + 1 })
        pid = project.id
      } else {
        await update.mutateAsync({
          id: projectId,
          patch: {
            name: form.name.trim(),
            ...(code && code !== initial.code ? { code } : {}),
            description: form.description?.trim() || null,
            client_name: form.client_name?.trim() || null,
            client_po: form.client_po?.trim() || null,
            our_po: form.our_po?.trim() || null,
            site_location: form.site_location?.trim() || null,
            site_contact: form.site_contact?.trim() || null,
          },
        })
        pid = projectId
      }
      await setProjectSystems.mutateAsync({ projectId: pid, keys: selectedSystems })
      if (logoFile !== undefined) {
        await setLogo.mutateAsync({ projectId: pid, file: logoFile, previous: logoUrl })
      }
      toast.success(isNew ? `Project "${form.name.trim()}" created` : "Project updated")
      onClose()
    } catch (e) {
      toast.error(isNew ? "Could not save project" : "Could not update project", {
        description: errorMessage(e),
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !busy) onClose() }}>
      <DialogContent className="max-h-[90svh] overflow-x-hidden overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? "New project" : "Edit project"}</DialogTitle>
          <DialogDescription>
            These details pre-fill Delivery Notes and new item forms for this project.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              {...logoDrop.dropProps}
              onClick={logoDrop.open}
              disabled={busy}
              aria-label="Upload project logo"
              className={`group relative shrink-0 rounded-xl outline-offset-2 transition ${logoDrop.dragging ? "ring-2 ring-primary" : ""}`}
            >
              <ProjectLogo project={{ id: projectId, name: form.name || "New project" }} src={shownLogo} size={72} className="rounded-xl" />
              <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <ImagePlus className="size-5" />
              </span>
            </button>
            {logoDrop.input}
            <div className="grid min-w-0 flex-1 gap-1.5">
              <Label className="text-xs text-muted-foreground">Project name *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. MiSK Ilmi Phase 2" autoFocus />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Logo: click or drop an image (PNG, JPG, WebP · max 2 MB)</span>
                {shownLogo && (
                  <Button type="button" variant="ghost" size="sm" className="h-6 px-1.5 text-xs text-destructive" onClick={() => setLogoFile(null)} disabled={busy}>
                    <Trash2 className="size-3" /> Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="grid gap-1.5 sm:grid-cols-[10rem_1fr] sm:items-start sm:gap-4">
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">SKU abbreviation</Label>
              <Input
                value={form.code ?? ""}
                onChange={(e) => set("code", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                placeholder={isNew ? "Auto" : ""}
                className="font-mono uppercase"
                aria-invalid={!codeValid}
              />
            </div>
            <p className="text-xs text-muted-foreground sm:pt-6">
              Starts every SKU in this project, e.g. <span className="font-mono">{code || "MP"}-0042</span>. 2–6 letters or
              numbers, unique across projects.{!isNew && " Changing it only affects new items; existing SKUs keep their code."}
            </p>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Input value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="Short note" />
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Client / deliver to</Label>
              <Input value={form.client_name ?? ""} onChange={(e) => set("client_name", e.target.value)} placeholder="e.g. First Fix Team" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Site contact</Label>
              <Input value={form.site_contact ?? ""} onChange={(e) => set("site_contact", e.target.value)} placeholder="e.g. Ahmed Al-Rashid" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Our PO number</Label>
              <Input value={form.our_po ?? ""} onChange={(e) => set("our_po", e.target.value)} placeholder="e.g. PO-2025-001" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Client PO number</Label>
              <Input value={form.client_po ?? ""} onChange={(e) => set("client_po", e.target.value)} placeholder="e.g. CPO-8821" />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Site location</Label>
            <Input value={form.site_location ?? ""} onChange={(e) => set("site_location", e.target.value)} placeholder="e.g. MiSK Ilmi Campus, Riyadh" />
          </div>

          <Separator />

          {/* Systems */}
          <div className="grid gap-2">
            <Label className="text-xs text-muted-foreground">
              Systems enabled for this project
            </Label>
            {activeSystems.length === 0 ? (
              <p className="text-xs text-muted-foreground/60">No systems configured globally yet.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {activeSystems.map((s) => (
                  <label
                    key={s.key}
                    className="flex cursor-pointer items-center gap-2 text-sm select-none"
                  >
                    <Checkbox
                      checked={selectedSystems.includes(s.key)}
                      onCheckedChange={() => toggleSystem(s.key)}
                    />
                    {s.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy || !form.name.trim() || !codeValid || code.length === 1}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {isNew ? "Create project" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

