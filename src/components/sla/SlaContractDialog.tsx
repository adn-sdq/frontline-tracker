import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/DatePicker"
import { useSaveSlaContract, type SlaContractInput } from "@/hooks/useSla"
import { useAllProjects } from "@/hooks/useProjects"
import { useAllProfiles } from "@/hooks/useAdmin"
import { useSystems } from "@/hooks/useSystems"
import { cn } from "@/lib/utils"
import {
  SLA_CONTRACT_STATUSES,
  SLA_CONTRACT_STATUS_LABELS,
  SLA_FREQUENCIES,
  SLA_FREQUENCY_LABELS,
  type SlaContract,
  type SlaContractStatus,
} from "@/lib/types"

const NONE = "__none"

function blank(): SlaContractInput {
  return {
    name: "",
    client: null,
    site: null,
    contract_ref: null,
    project_id: null,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: null,
    frequency_months: 1,
    preferred_day: null,
    systems: [],
    scope: null,
    contact_name: null,
    contact_phone: null,
    contact_email: null,
    account_manager: null,
    status: "active",
    notes: null,
  }
}

function fromContract(c: SlaContract): SlaContractInput {
  const { id: _id, created_by: _cb, created_at: _ca, updated_by: _ub, updated_at: _ua, ...rest } = c
  return rest
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

export function SlaContractDialog({
  open,
  onOpenChange,
  contract,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  contract: SlaContract | null
  onSaved?: (id: string) => void
}) {
  const save = useSaveSlaContract()
  const { data: projects = [] } = useAllProjects()
  const { data: profiles = [] } = useAllProfiles()
  const { activeSystems } = useSystems()
  const [f, setF] = useState<SlaContractInput>(blank())

  useEffect(() => {
    if (open) setF(contract ? fromContract(contract) : blank())
  }, [open, contract])

  const set = <K extends keyof SlaContractInput>(k: K, v: SlaContractInput[K]) =>
    setF((prev) => ({ ...prev, [k]: v }))
  const text = (k: keyof SlaContractInput) => ({
    value: (f[k] as string | null) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      set(k, (e.target.value || null) as never),
  })

  async function submit() {
    if (!f.name.trim()) return toast.error("Contract name is required")
    if (!f.start_date) return toast.error("Start date is required")
    if (f.end_date && f.end_date < f.start_date) return toast.error("End date is before the start date")
    try {
      const id = await save.mutateAsync({ id: contract?.id, input: { ...f, name: f.name.trim() } })
      toast.success(contract ? "Contract updated" : "Contract created")
      onOpenChange(false)
      onSaved?.(id)
    } catch (e) {
      toast.error("Could not save contract", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{contract ? "Edit SLA contract" : "New SLA contract"}</DialogTitle>
          <DialogDescription>
            A maintenance contract with recurring site visits. Visits are owed every period from the start date.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Contract name *" className="sm:col-span-2">
            <Input autoFocus value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. MiSK Ilmi — AV maintenance" />
          </Field>
          <Field label="Client">
            <Input {...text("client")} />
          </Field>
          <Field label="Site / location">
            <Input {...text("site")} />
          </Field>
          <Field label="Contract reference">
            <Input {...text("contract_ref")} placeholder="e.g. SLA-2026-014" />
          </Field>
          <Field label="Linked project (optional)">
            <Select value={f.project_id ?? NONE} onValueChange={(v) => set("project_id", v === NONE ? null : v)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Separator />

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Start date *">
            <DatePicker value={f.start_date} onChange={(v) => set("start_date", v)} clearable={false} />
          </Field>
          <Field label="End date">
            <DatePicker value={f.end_date ?? ""} onChange={(v) => set("end_date", v || null)} placeholder="Open-ended" />
          </Field>
          <Field label="Status">
            <Select value={f.status} onValueChange={(v) => set("status", v as SlaContractStatus)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SLA_CONTRACT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{SLA_CONTRACT_STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Visit frequency">
            <Select value={String(f.frequency_months)} onValueChange={(v) => set("frequency_months", Number(v))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SLA_FREQUENCIES.map((n) => (
                  <SelectItem key={n} value={String(n)}>{SLA_FREQUENCY_LABELS[n]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Preferred day of month">
            <Input
              type="number"
              min={1}
              max={28}
              value={f.preferred_day ?? ""}
              onChange={(e) => set("preferred_day", e.target.value ? Math.min(28, Math.max(1, Number(e.target.value))) : null)}
              placeholder="1–28"
            />
          </Field>
          <Field label="Account manager">
            <Select value={f.account_manager ?? NONE} onValueChange={(v) => set("account_manager", v === NONE ? null : v)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Unassigned</SelectItem>
                {profiles
                  .filter((p) => p.org !== "firstfix")
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name ?? p.username}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Systems covered">
          <div className="flex flex-wrap gap-1.5">
            {activeSystems.map((s) => {
              const on = f.systems.includes(s.key)
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => set("systems", on ? f.systems.filter((k) => k !== s.key) : [...f.systems, s.key])}
                  className={cn(
                    "rounded-sm border px-2 py-0.5 text-xs font-medium transition-colors",
                    on ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s.label}
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="Scope of work">
          <Textarea rows={2} {...text("scope")} placeholder="What each visit covers — preventive checks, cleaning, firmware…" />
        </Field>

        <Separator />

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Client contact">
            <Input {...text("contact_name")} />
          </Field>
          <Field label="Contact phone">
            <Input {...text("contact_phone")} />
          </Field>
          <Field label="Contact email">
            <Input type="email" {...text("contact_email")} />
          </Field>
        </div>

        <Field label="Internal notes">
          <Textarea rows={2} {...text("notes")} />
        </Field>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={save.isPending}>
            {save.isPending && <Loader2 className="size-4 animate-spin" />}
            {contract ? "Save" : "Create contract"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
