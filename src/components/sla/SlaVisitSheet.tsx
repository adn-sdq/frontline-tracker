import { useEffect, useMemo, useState } from "react"
import { errorMessage } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import {
  ChevronDown,
  Download,
  FileCheck2,
  Loader2,
  Plus,
  Printer,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileDropzone } from "@/components/ui/file-dropzone"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { DatePicker } from "@/components/DatePicker"
import { SignatureBadge } from "@/components/SignatureBadge"
import { PeriodStateBadge } from "@/components/sla/SlaBadges"
import { SlaIssueRow } from "@/components/sla/SlaIssueRow"
import {
  useDeleteSlaVisit,
  useRemoveVisitReport,
  useSaveSlaVisit,
  useUploadVisitReport,
  type SlaVisitInput,
} from "@/hooks/useSla"
import { getSignedUrl } from "@/hooks/useDocuments"
import { useAuth } from "@/contexts/AuthContext"
import { carriedOverIssues, periodLabel, periodState } from "@/lib/sla"
import { printVisitReport } from "@/lib/slaVisitReport"
import {
  SLA_VISIT_STATUSES,
  SLA_VISIT_STATUS_LABELS,
  type Profile,
  type SlaContract,
  type SlaIssue,
  type SlaIssueStatus,
  type SlaVisit,
  type SlaVisitStatus,
  type Technician,
} from "@/lib/types"

const NONE = "__none"

function suggestedDate(c: SlaContract, period: string) {
  const day = String(c.preferred_day ?? 1).padStart(2, "0")
  return `${period.slice(0, 8)}${day}`
}

function blank(c: SlaContract, period: string, uid: string | null): SlaVisitInput {
  return {
    contract_id: c.id,
    period,
    scheduled_date: suggestedDate(c, period),
    visited_on: null,
    status: "scheduled",
    technician_ids: [],
    lead_by: uid,
    work_done: null,
    customer_signatory: c.contact_name,
    notes: null,
  }
}

export interface VisitTarget {
  contract: SlaContract
  period: string
}

export function SlaVisitSheet({
  target,
  visit,
  issues,
  visitsById,
  profiles,
  technicians,
  canManage,
  onClose,
  onOpenIssue,
  onIssueStatus,
  onAddIssue,
}: {
  target: VisitTarget | null
  visit: SlaVisit | undefined
  issues: SlaIssue[]
  visitsById: Map<string, SlaVisit>
  profiles: Record<string, Profile>
  technicians: Technician[]
  canManage: boolean
  onClose: () => void
  onOpenIssue: (issue: SlaIssue) => void
  onIssueStatus: (issue: SlaIssue, status: SlaIssueStatus, visitId: string) => void
  onAddIssue: (visitId: string) => void
}) {
  const { user } = useAuth()
  const save = useSaveSlaVisit()
  const del = useDeleteSlaVisit()
  const upload = useUploadVisitReport()
  const removeReport = useRemoveVisitReport()
  const confirm = useConfirm()
  const [f, setF] = useState<SlaVisitInput | null>(null)

  const contract = target?.contract
  const key = target ? `${target.contract.id}:${target.period}:${visit?.id ?? "new"}` : null

  // Reset the form whenever a different visit (or new slot) is opened.
  useEffect(() => {
    if (!target) return setF(null)
    if (visit) {
      setF({
        contract_id: visit.contract_id,
        period: visit.period,
        scheduled_date: visit.scheduled_date,
        visited_on: visit.visited_on,
        status: visit.status,
        technician_ids: visit.technician_ids,
        lead_by: visit.lead_by,
        work_done: visit.work_done,
        customer_signatory: visit.customer_signatory,
        notes: visit.notes,
      })
    } else {
      setF(blank(target.contract, target.period, user?.id ?? null))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const carried = useMemo(
    () => (visit ? carriedOverIssues(issues, visit, visitsById) : []),
    [issues, visit, visitsById]
  )
  const foundHere = useMemo(() => (visit ? issues.filter((i) => i.found_visit_id === visit.id) : []), [issues, visit])

  const activeTechs = technicians.filter((t) => t.active || f?.technician_ids.includes(t.id))
  const techName = (id: string) => technicians.find((t) => t.id === id)?.full_name ?? "Unknown"
  const who = (id: string | null) => (id ? profiles[id]?.full_name ?? profiles[id]?.username ?? "Unknown" : "")

  const set = <K extends keyof SlaVisitInput>(k: K, v: SlaVisitInput[K]) =>
    setF((prev) => (prev ? { ...prev, [k]: v } : prev))

  async function submit() {
    if (!f) return
    const input = { ...f }
    // Completing a visit without a date assumes it happened today.
    if (input.status === "completed" && !input.visited_on) input.visited_on = new Date().toISOString().slice(0, 10)
    try {
      await save.mutateAsync({ id: visit?.id, input })
      toast.success(visit ? "Visit saved" : "Visit created — you can now log issues and upload the signed report")
    } catch (e) {
      toast.error("Could not save visit", { description: errorMessage(e) })
    }
  }

  async function onReport([file]: File[]) {
    if (!visit || !file) return
    try {
      await upload.mutateAsync({ visit, file })
      toast.success("Signed report uploaded")
    } catch (e) {
      toast.error("Upload failed", { description: errorMessage(e) })
    }
  }

  async function askRemoveReport() {
    if (!visit) return
    const ok = await confirm({
      title: "Remove signed report?",
      description: "The file is deleted and the visit goes back to Unsigned.",
      confirmText: "Remove",
      destructive: true,
    })
    if (!ok) return
    try {
      await removeReport.mutateAsync(visit)
      toast.success("Signed report removed")
    } catch (e) {
      toast.error("Could not remove", { description: errorMessage(e) })
    }
  }

  async function askDelete() {
    if (!visit) return
    const ok = await confirm({
      title: "Delete this visit?",
      description: "The visit record and its signed report are removed. Issues raised at it are kept.",
      confirmText: "Delete visit",
      destructive: true,
    })
    if (!ok) return
    try {
      await del.mutateAsync(visit)
      toast.success("Visit deleted")
      onClose()
    } catch (e) {
      toast.error("Could not delete", { description: errorMessage(e) })
    }
  }

  async function openReport() {
    if (!visit?.signed_storage_path) return
    try {
      window.open(await getSignedUrl(visit.signed_storage_path), "_blank", "noopener")
    } catch {
      toast.error("Could not open file")
    }
  }

  function print() {
    if (!contract || !visit || !f) return
    printVisitReport({
      contract,
      visit: { ...visit, ...f },
      technicianNames: f.technician_ids.map(techName),
      leadName: who(f.lead_by),
      carriedOver: carried,
      foundThisVisit: foundHere,
    })
  }

  return (
    <Sheet open={!!target} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        {target && contract && f && (
          <>
            <SheetHeader>
              <SheetTitle>{periodLabel(target.period)} visit</SheetTitle>
              <SheetDescription>{[contract.name, contract.site].filter(Boolean).join(" · ")}</SheetDescription>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <PeriodStateBadge state={periodState(target.period, visit)} />
                {visit && <SignatureBadge signed={!!visit.signed_storage_path} />}
              </div>
            </SheetHeader>

            <div className="flex flex-col gap-5 px-4 pb-8 sm:px-6">
              {/* ── Visit details ─────────────────────────────────────── */}
              <section className="grid gap-3 sm:grid-cols-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={f.status} onValueChange={(v) => set("status", v as SlaVisitStatus)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SLA_VISIT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{SLA_VISIT_STATUS_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs text-muted-foreground">Scheduled for</Label>
                  <DatePicker value={f.scheduled_date ?? ""} onChange={(v) => set("scheduled_date", v || null)} />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs text-muted-foreground">Visited on</Label>
                  <DatePicker value={f.visited_on ?? ""} onChange={(v) => set("visited_on", v || null)} placeholder="Not yet" />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs text-muted-foreground">Lead engineer</Label>
                  <Select value={f.lead_by ?? NONE} onValueChange={(v) => set("lead_by", v === NONE ? null : v)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>—</SelectItem>
                      {Object.values(profiles)
                        .filter((p) => p.org !== "firstfix" && p.status !== "suspended")
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.full_name ?? p.username}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">Technicians</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between font-normal">
                        <span className="truncate">
                          {f.technician_ids.length ? f.technician_ids.map(techName).join(", ") : "Select technicians"}
                        </span>
                        <ChevronDown className="size-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="max-h-72 w-64 overflow-y-auto">
                      {activeTechs.length === 0 && (
                        <p className="px-2 py-1.5 text-xs text-muted-foreground">No technicians on the roster.</p>
                      )}
                      {activeTechs.map((t) => (
                        <DropdownMenuCheckboxItem
                          key={t.id}
                          checked={f.technician_ids.includes(t.id)}
                          onSelect={(e) => e.preventDefault()}
                          onCheckedChange={(on) =>
                            set(
                              "technician_ids",
                              on ? [...f.technician_ids, t.id] : f.technician_ids.filter((x) => x !== t.id)
                            )
                          }
                        >
                          <span className="min-w-0 truncate">{t.full_name}</span>
                          {t.trade && <span className="ml-auto shrink-0 text-xs text-muted-foreground">{t.trade}</span>}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="grid gap-1.5 sm:col-span-3">
                  <Label className="text-xs text-muted-foreground">Client signatory</Label>
                  <Input
                    value={f.customer_signatory ?? ""}
                    onChange={(e) => set("customer_signatory", e.target.value || null)}
                    placeholder="Who signs the visit report on site"
                  />
                </div>
                <div className="grid gap-1.5 sm:col-span-3">
                  <Label className="text-xs text-muted-foreground">Work carried out</Label>
                  <Textarea
                    rows={3}
                    value={f.work_done ?? ""}
                    onChange={(e) => set("work_done", e.target.value || null)}
                    placeholder={contract.scope ?? "Preventive checks, cleaning, tests performed…"}
                  />
                </div>
                <div className="grid gap-1.5 sm:col-span-3">
                  <Label className="text-xs text-muted-foreground">Internal notes</Label>
                  <Textarea rows={2} value={f.notes ?? ""} onChange={(e) => set("notes", e.target.value || null)} />
                </div>
                <div className="flex justify-end gap-2 sm:col-span-3">
                  {visit && canManage && (
                    <Button variant="ghost" className="mr-auto text-destructive" onClick={askDelete} disabled={del.isPending}>
                      <Trash2 className="size-4" /> Delete visit
                    </Button>
                  )}
                  <Button onClick={submit} disabled={save.isPending}>
                    {save.isPending && <Loader2 className="size-4 animate-spin" />}
                    {visit ? "Save visit" : "Create visit"}
                  </Button>
                </div>
              </section>

              {!visit ? (
                <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  Create the visit to review carried-over issues, log new ones and attach the signed report.
                </p>
              ) : (
                <>
                  <Separator />

                  {/* ── Carried-over issues ──────────────────────────── */}
                  <section className="flex flex-col gap-2">
                    <div>
                      <h3 className="text-sm font-semibold">Outstanding from previous visits ({carried.length})</h3>
                      <p className="text-xs text-muted-foreground">
                        Resolve what was fixed today; keep the rest for the next visit.
                      </p>
                    </div>
                    {carried.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nothing outstanding.</p>
                    ) : (
                      carried.map((i) => (
                        <SlaIssueRow
                          key={i.id}
                          issue={i}
                          onOpen={() => onOpenIssue(i)}
                          onStatus={(s) => onIssueStatus(i, s, visit.id)}
                        />
                      ))
                    )}
                  </section>

                  {/* ── New issues ───────────────────────────────────── */}
                  <section className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">Found this visit ({foundHere.length})</h3>
                      <Button size="sm" variant="outline" onClick={() => onAddIssue(visit.id)}>
                        <Plus className="size-4" /> Log issue
                      </Button>
                    </div>
                    {foundHere.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No new issues logged.</p>
                    ) : (
                      foundHere.map((i) => (
                        <SlaIssueRow
                          key={i.id}
                          issue={i}
                          onOpen={() => onOpenIssue(i)}
                          onStatus={(s) => onIssueStatus(i, s, visit.id)}
                        />
                      ))
                    )}
                  </section>

                  <Separator />

                  {/* ── Signed report ────────────────────────────────── */}
                  <section className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="flex items-center gap-2 text-sm font-semibold">
                          Visit report <SignatureBadge signed={!!visit.signed_storage_path} />
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Print the report, get it signed on site, then upload the signed copy.
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={print}>
                        <Printer className="size-4" /> Print report
                      </Button>
                    </div>

                    {visit.signed_storage_path && (
                      <div className="flex items-start gap-2 rounded-lg border border-emerald-600/40 bg-emerald-50/40 p-2.5 dark:bg-emerald-950/20">
                        <FileCheck2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{visit.signed_file_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {who(visit.signed_uploaded_by)}
                            {visit.signed_uploaded_at && ` · ${format(parseISO(visit.signed_uploaded_at), "d MMM yyyy, HH:mm")}`}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="size-7" aria-label="Open signed report" onClick={openReport}>
                          <Download className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive"
                          aria-label="Remove signed report"
                          onClick={askRemoveReport}
                          disabled={removeReport.isPending}
                        >
                          {removeReport.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                        </Button>
                      </div>
                    )}

                    <FileDropzone
                      accept=".pdf,image/*"
                      onFiles={onReport}
                      busy={upload.isPending}
                      title={visit.signed_storage_path ? "Drop a file to replace the signed report" : "Drop the signed report or click to browse"}
                      hint="PDF or photo of the signed page"
                    />
                  </section>
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
