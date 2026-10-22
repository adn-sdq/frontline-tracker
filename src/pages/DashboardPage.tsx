import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, CheckCircle2, FileText, FolderKanban, Layers, Package, Truck, Wrench } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { PageHeader } from "@/components/PageHeader"
import { ProjectLogo } from "@/components/ProjectLogo"
import { StatTile } from "@/components/ui/stat-tile"
import { Spinner } from "@/components/ui/spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useProject } from "@/contexts/ProjectContext"
import { useSystems } from "@/hooks/useSystems"
import { supabase } from "@/lib/supabase"
import { DOC_STATUS_LABELS, STATUS_LABELS, type Project } from "@/lib/types"
import { cn } from "@/lib/utils"

// ── Data ─────────────────────────────────────────────────────────────────────

type Row = {
  project_id: string
  system: string
  procurement_status: string
  delivery_status: string
  installation_status: string
  qty_required: number
  qty_ordered: number
  qty_delivered: number
  qty_installed: number
  eta: string | null
}
type DocRow = { project_id: string; status: string }

/** Everything the dashboard needs across every project you can see (RLS limits it). */
function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard_overview"],
    queryFn: async () => {
      const [items, docs] = await Promise.all([
        supabase
          .from("items")
          .select("project_id, system, procurement_status, delivery_status, installation_status, qty_required, qty_ordered, qty_delivered, qty_installed, eta"),
        supabase.from("documents").select("project_id, status"),
      ])
      if (items.error) throw items.error
      if (docs.error) throw docs.error
      return { items: (items.data ?? []) as Row[], docs: (docs.data ?? []) as DocRow[] }
    },
  })
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const n = (v: unknown) => Number(v ?? 0) || 0
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)

function totals(rows: Row[]) {
  return rows.reduce(
    (t, r) => ({
      required: t.required + n(r.qty_required),
      ordered: t.ordered + n(r.qty_ordered),
      delivered: t.delivered + n(r.qty_delivered),
      installed: t.installed + n(r.qty_installed),
    }),
    { required: 0, ordered: 0, delivered: 0, installed: 0 }
  )
}

/** One colour per status, matching the badges elsewhere in the app. */
const STATUS_COLOR: Record<string, string> = {
  not_started: "#cbd5e1",
  pending: "#cbd5e1",
  quoted: "#f59e0b",
  po_issued: "#3b82f6",
  ordered: "#8b5cf6",
  partial: "#f59e0b",
  delivered: "#10b981",
  in_progress: "#3b82f6",
  installed: "#10b981",
  commissioned: "#047857",
  under_review: "#f59e0b",
  code_a: "#10b981",
  code_b: "#3b82f6",
  code_c: "#ef4444",
}
const SERIES = ["#E37C30", "#1B354F", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#14b8a6", "#64748b"]

function countBy<T>(rows: T[], key: (r: T) => string, order: string[], label: (k: string) => string) {
  const m = new Map<string, number>()
  for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + 1)
  return order.filter((k) => m.get(k)).map((k) => ({ key: k, name: label(k), value: m.get(k)!, color: STATUS_COLOR[k] ?? "#94a3b8" }))
}

const INSTALL_ORDER = ["not_started", "in_progress", "installed", "commissioned"]
const DELIVERY_ORDER = ["pending", "partial", "delivered"]
const PROCURE_ORDER = ["not_started", "quoted", "po_issued", "ordered"]
const DOC_ORDER = ["pending", "under_review", "code_a", "code_b", "code_c"]

// ── Building blocks ──────────────────────────────────────────────────────────

function Card({ title, hint, children, className }: { title: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4", className)}>
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

function Empty({ text = "Nothing to show yet." }: { text?: string }) {
  return <div className="grid h-48 place-items-center text-sm text-muted-foreground">{text}</div>
}

const tooltipStyle = {
  contentStyle: { borderRadius: 8, border: "1px solid var(--border)", background: "var(--popover)", color: "var(--popover-foreground)", fontSize: 12 },
  itemStyle: { color: "var(--popover-foreground)" },
}

/** Donut with the total in the middle. Clicking a slice (or legend chip) highlights it. */
function Donut({ data, unit }: { data: { key: string; name: string; value: number; color: string }[]; unit: string }) {
  const [active, setActive] = useState<string | null>(null)
  const total = data.reduce((s, d) => s + d.value, 0)
  if (!total) return <Empty />
  const shown = active ? data.find((d) => d.key === active) : null
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-44 w-full">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={data.length > 1 ? 2 : 0}
              stroke="none"
              onClick={(d) => setActive((a) => ((d as { key?: string }).key === a ? null : (d as { key?: string }).key ?? null))}
              className="cursor-pointer outline-none"
            >
              {data.map((d) => (
                <Cell key={d.key} fill={d.color} opacity={active && active !== d.key ? 0.25 : 1} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} formatter={(v) => [`${v} ${unit}`, ""]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-2xl font-semibold tabular-nums">{shown ? shown.value : total}</div>
            <div className="text-[11px] text-muted-foreground">{shown ? `${shown.name} · ${pct(shown.value, total)}%` : unit}</div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-1.5">
        {data.map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => setActive((a) => (a === d.key ? null : d.key))}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] transition-opacity",
              active && active !== d.key && "opacity-40"
            )}
          >
            <span className="size-2 rounded-full" style={{ background: d.color }} />
            {d.name} <span className="tabular-nums text-muted-foreground">{d.value}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── All projects ─────────────────────────────────────────────────────────────

function Overview({ projects, items, docs, onPick }: { projects: Project[]; items: Row[]; docs: DocRow[]; onPick: (id: string) => void }) {
  const t = totals(items)
  const approved = docs.filter((d) => d.status === "code_a" || d.status === "code_b").length
  const overdue = items.filter((i) => i.eta && i.eta < new Date().toISOString().slice(0, 10) && i.delivery_status !== "delivered").length

  const byProject = projects
    .map((p) => {
      const rows = items.filter((i) => i.project_id === p.id)
      const pt = totals(rows)
      return {
        id: p.id,
        name: p.code ?? p.name,
        full: p.name,
        lines: rows.length,
        Delivered: pct(pt.delivered, pt.required),
        Installed: pct(pt.installed, pt.required),
      }
    })
    .filter((p) => p.lines > 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={FolderKanban} label="Active projects" value={projects.filter((p) => p.active).length} hint={`${byProject.length} with items`} />
        <StatTile icon={Package} label="Units delivered" value={`${pct(t.delivered, t.required)}%`} hint={`${t.delivered} of ${t.required}`} />
        <StatTile icon={Wrench} label="Units installed" value={`${pct(t.installed, t.required)}%`} hint={`${t.installed} of ${t.required}`} tone={pct(t.installed, t.required) === 100 && t.required ? "success" : "default"} />
        <StatTile icon={AlertTriangle} label="Overdue deliveries" value={overdue} hint="Past ETA, not delivered" tone={overdue ? "danger" : "default"} />
      </div>

      <Card title="Progress by project" hint="Share of required units delivered and installed. Click a project to open its view.">
        {byProject.length === 0 ? (
          <Empty text="No project has items yet." />
        ) : (
          <div style={{ height: Math.max(180, byProject.length * 46 + 40) }}>
            <ResponsiveContainer>
              <BarChart data={byProject} layout="vertical" margin={{ left: 8, right: 16 }} barGap={2}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <Tooltip
                  {...tooltipStyle}
                  cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                  labelFormatter={(_, p) => (p?.[0]?.payload as { full?: string })?.full ?? ""}
                  formatter={(v, name) => [`${v}%`, name]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Delivered" fill="#3b82f6" radius={[0, 4, 4, 0]} className="cursor-pointer" onClick={(d) => onPick((d as unknown as { id: string }).id)} />
                <Bar dataKey="Installed" fill="#10b981" radius={[0, 4, 4, 0]} className="cursor-pointer" onClick={(d) => onPick((d as unknown as { id: string }).id)} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Installation" hint="Item lines, all projects">
          <Donut unit="lines" data={countBy(items, (i) => i.installation_status, INSTALL_ORDER, (k) => STATUS_LABELS[k] ?? k)} />
        </Card>
        <Card title="Delivery" hint="Item lines, all projects">
          <Donut unit="lines" data={countBy(items, (i) => i.delivery_status, DELIVERY_ORDER, (k) => STATUS_LABELS[k] ?? k)} />
        </Card>
        <Card title="Documents" hint={`${approved} approved (Code A / B)`}>
          <Donut unit="documents" data={countBy(docs, (d) => d.status, DOC_ORDER, (k) => DOC_STATUS_LABELS[k] ?? k)} />
        </Card>
      </div>
    </div>
  )
}

// ── One project ──────────────────────────────────────────────────────────────

function ProjectView({ project, items, docs }: { project: Project; items: Row[]; docs: DocRow[] }) {
  const { labelFor } = useSystems(project.id)
  const [system, setSystem] = useState<string | null>(null)
  const rows = system ? items.filter((i) => i.system === system) : items
  const t = totals(rows)
  const overdue = rows.filter((i) => i.eta && i.eta < new Date().toISOString().slice(0, 10) && i.delivery_status !== "delivered").length

  const funnel = [
    { stage: "Required", units: t.required, fill: "#94a3b8" },
    { stage: "Ordered", units: t.ordered, fill: "#8b5cf6" },
    { stage: "Delivered", units: t.delivered, fill: "#3b82f6" },
    { stage: "Installed", units: t.installed, fill: "#10b981" },
  ]

  const systems = [...new Set(items.map((i) => i.system))]
  const bySystem = systems
    .map((s, i) => ({ key: s, name: labelFor(s) || s, value: items.filter((r) => r.system === s).length, color: SERIES[i % SERIES.length] }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <ProjectLogo project={project} size={40} />
        <div className="min-w-0">
          <div className="truncate font-semibold">{project.name}</div>
          <div className="text-xs text-muted-foreground">{[project.code, project.client_name].filter(Boolean).join(" · ")}</div>
        </div>
        {system && (
          <button type="button" onClick={() => setSystem(null)} className="ml-auto rounded-full border px-2.5 py-1 text-xs hover:bg-muted">
            {labelFor(system) || system} ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={Layers} label="Item lines" value={rows.length} hint={`${t.required} units`} />
        <StatTile icon={Truck} label="Delivered" value={`${pct(t.delivered, t.required)}%`} hint={`${t.delivered} of ${t.required} units`} />
        <StatTile icon={CheckCircle2} label="Installed" value={`${pct(t.installed, t.required)}%`} hint={`${t.installed} of ${t.required} units`} tone={t.required && t.installed === t.required ? "success" : "default"} />
        <StatTile icon={AlertTriangle} label="Overdue" value={overdue} hint="Past ETA, not delivered" tone={overdue ? "danger" : "default"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card title="From order to installation" hint={system ? `Units — ${labelFor(system) || system} only` : "Units across the project"} className="lg:col-span-3">
          {t.required === 0 ? (
            <Empty />
          ) : (
            <div className="h-60">
              <ResponsiveContainer>
                <BarChart data={funnel} margin={{ left: -12, right: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="stage" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <Tooltip {...tooltipStyle} cursor={{ fill: "var(--muted)", opacity: 0.5 }} formatter={(v) => [`${v} units (${pct(Number(v), t.required)}%)`, ""]} />
                  <Bar dataKey="units" radius={[6, 6, 0, 0]}>
                    {funnel.map((f) => <Cell key={f.stage} fill={f.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card title="By system" hint="Click a system to focus the whole view on it" className="lg:col-span-2">
          {bySystem.length === 0 ? (
            <Empty />
          ) : (
            <div className="flex flex-col gap-2">
              {bySystem.map((s) => {
                const sr = items.filter((i) => i.system === s.key)
                const st = totals(sr)
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSystem((cur) => (cur === s.key ? null : s.key))}
                    className={cn(
                      "grid gap-1 rounded-lg border px-3 py-2 text-left transition-colors hover:bg-muted/50",
                      system === s.key && "border-primary bg-primary/5",
                      system && system !== s.key && "opacity-50"
                    )}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        <span className="size-2.5 rounded-full" style={{ background: s.color }} /> {s.name}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">{s.value} lines · {pct(st.installed, st.required)}% installed</span>
                    </div>
                    <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="bg-emerald-500" style={{ width: `${pct(st.installed, st.required)}%` }} />
                      <div className="bg-blue-500/70" style={{ width: `${Math.max(0, pct(st.delivered, st.required) - pct(st.installed, st.required))}%` }} />
                    </div>
                  </button>
                )
              })}
              <p className="text-[11px] text-muted-foreground">
                <span className="mr-1 inline-block size-2 rounded-full bg-emerald-500" />installed
                <span className="mr-1 ml-3 inline-block size-2 rounded-full bg-blue-500/70" />delivered, not yet installed
              </p>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Procurement" hint="Item lines">
          <Donut unit="lines" data={countBy(rows, (i) => i.procurement_status, PROCURE_ORDER, (k) => STATUS_LABELS[k] ?? k)} />
        </Card>
        <Card title="Installation" hint="Item lines">
          <Donut unit="lines" data={countBy(rows, (i) => i.installation_status, INSTALL_ORDER, (k) => STATUS_LABELS[k] ?? k)} />
        </Card>
        <Card title="Documents" hint="Review status">
          <Donut unit="documents" data={countBy(docs, (d) => d.status, DOC_ORDER, (k) => DOC_STATUS_LABELS[k] ?? k)} />
        </Card>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

const ALL = "__all__"

export default function DashboardPage() {
  const { projects } = useProject()
  const { data, isLoading } = useDashboardData()
  const [scope, setScope] = useState<string>(ALL)
  const project = projects.find((p) => p.id === scope) ?? null

  const scoped = useMemo(() => {
    if (!data) return { items: [], docs: [] }
    if (!project) return data
    return { items: data.items.filter((i) => i.project_id === project.id), docs: data.docs.filter((d) => d.project_id === project.id) }
  }, [data, project])

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Dashboard" subtitle={project ? "One project at a glance." : "Every project you can see, at a glance."}>
        <div className="inline-flex rounded-md border p-0.5">
          <button
            type="button"
            onClick={() => setScope(ALL)}
            className={cn("rounded-[5px] px-3 py-1 text-sm transition-colors", !project ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            All projects
          </button>
          <Select value={project ? project.id : ""} onValueChange={setScope}>
            <SelectTrigger
              size="sm"
              className={cn("h-7 min-w-36 border-0 shadow-none", project && "bg-primary text-primary-foreground [&_svg]:text-primary-foreground")}
            >
              <SelectValue placeholder="Pick a project" />
            </SelectTrigger>
            <SelectContent align="end">
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <span className="block max-w-64 truncate">
                    {p.code ? `${p.code} · ` : ""}
                    {p.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {isLoading || !data ? (
        <div className="flex justify-center py-16"><Spinner className="size-6" /></div>
      ) : projects.length === 0 ? (
        <Card title="No projects yet"><Empty text="Create a project to see it here." /></Card>
      ) : project ? (
        <ProjectView project={project} items={scoped.items} docs={scoped.docs} />
      ) : (
        <Overview projects={projects} items={data.items} docs={data.docs} onPick={setScope} />
      )}

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <FileText className="size-3.5" /> Figures use quantities on each item line; open the Tracker for the details.
      </p>
    </div>
  )
}
