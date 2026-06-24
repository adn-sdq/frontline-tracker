import { Link } from "react-router-dom"
import { ArrowLeft, PackageCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"

// ── Release data ──────────────────────────────────────────────────────────────
// Add new releases at the top. type: "major" | "minor" | "patch"

interface ReleaseEntry {
  version: string
  date: string
  summary: string
  type: "major" | "minor" | "patch"
  sections: { title: string; items: string[] }[]
}

const RELEASES: ReleaseEntry[] = [
  {
    version: "v0.3.0",
    date: "2026-06-24",
    type: "minor",
    summary: "UI/UX improvements across Procurement and Documents.",
    sections: [
      {
        title: "Procurement — Item Cards (mobile)",
        items: [
          "Complete card redesign: clear three-zone layout — identity top, labeled status grid middle, footer attribution",
          "Status grid shows three columns (Procurement / Delivery / Installation) each with a category label above the badge",
          "Brand · Model is now the headline; description removed from list view (still visible inside the detail sheet)",
          "Unique ID displayed as bold primary-colour monospace next to system badge",
          "Location on its own row with pin icon",
          "Subtle scale animation on tap for mobile feedback",
        ],
      },
      {
        title: "Procurement — Item Table (desktop)",
        items: [
          "Status badges now in a horizontal row (Ordered · Partial · In progress) instead of stacked vertically",
          "On medium screens only the delivery status badge is shown; all three appear at large breakpoint",
          "Description removed from list view; attribution line simplified",
        ],
      },
      {
        title: "Documents",
        items: [
          "New Document type field — dropdown with 11 types: Shop Drawing, Schematic, O&M Manual, Training Manual, Method Statement, Commissioning Report, Submittal, As-Built, Inspection Request, RFI, Other",
          "Type badge shown on each document card",
          "New 'All types' filter dropdown on the Documents page",
        ],
      },
      {
        title: "Delivery Notes",
        items: [
          "Separate Delivery Notes page with search and date range filters",
          "Auto-naming: DN-[PROJECT_INITIALS]-[YYYYMMDD]-[NNN]",
        ],
      },
    ],
  },
  {
    version: "v0.2.0",
    date: "2026-06-24",
    type: "minor",
    summary: "Delivery note generation from procurement items.",
    sections: [
      {
        title: "Delivery Notes",
        items: [
          "New 'Delivery note' button on the Procurement page — select items, then Generate",
          "Pre-fills form from selected items (description, quantity, serial); all fields editable",
          "Generates a print-perfect PDF matching the Frontline Solutions template via browser Save-as-PDF — no extra libraries",
          "Auto-incrementing per-project delivery number (atomic, conflict-safe via Postgres advisory lock)",
          "Each generated note saved to the database with a snapshot of its items",
          "'Preview / Print only' option to generate without saving",
        ],
      },
      {
        title: "Navigation",
        items: [
          "Replaced top navbar with a collapsible left sidebar (desktop) and slide-in sheet (mobile)",
          "Delivery Notes listed as a sub-item under Procurement in the sidebar",
        ],
      },
      {
        title: "Procurement",
        items: [
          "Status filters (Procurement / Delivery / Installation) with removable chips",
          "Loading skeletons instead of spinning Loader2",
          "CSV export label shows filtered count vs total",
          "Empty state on mobile cards has 'Add item' call-to-action",
        ],
      },
      {
        title: "Fixes",
        items: [
          "Fixed item ordering query still referencing the old sno column (renamed to unique_id in v0.1)",
          "Fixed ItemDetailSheet action buttons being cut off on tall content (sticky footer)",
        ],
      },
    ],
  },
  {
    version: "v0.1.0",
    date: "2026-06-24",
    type: "major",
    summary: "Initial production release.",
    sections: [
      {
        title: "Procurement",
        items: [
          "Line-item tracker with system tabs (AV, PAVA, IPTV, Screens + custom)",
          "Compact row list — click any row to open a detail sheet (quantities, statuses, notes)",
          "Edit / History / Delete from the detail sheet",
          "Unique ID field (any string, e.g. SN-001) replaces the old numeric S.No",
          "Real-time updates across all connected clients",
          "CSV import (supports custom systems by key or label) and export",
          "Optimistic concurrency guard — conflicts are caught and shown, never silently lost",
          "Full edit history per item",
        ],
      },
      {
        title: "Documents",
        items: [
          "Document register with stacked file uploads (every revision kept)",
          "Per-file date picker, rev label, notes, inline PDF preview",
          "Status codes: Pending → Under Review → Code A / B / C",
          "Bulk status update (select multiple → apply status)",
          "Comments thread per document",
          "Real-time file count badges",
        ],
      },
      {
        title: "Dashboard",
        items: [
          "Quantity progress bars per system (ordered / delivered / installed vs required)",
          "Item-count analytics by procurement, delivery and installation status",
          "Overdue ETA alert panel",
        ],
      },
      {
        title: "Admin",
        items: [
          "Create / delete accounts; reset passwords",
          "Edit user full name and username (updates auth login)",
          "Assign org (Frontline / First Fix) and role (Member / Admin)",
          "Per-user page access control (Tracker, Documents, Dashboard)",
          "Multi-project support — create projects, assign users, admins see all",
          "Systems management — add custom systems, activate / deactivate",
        ],
      },
      {
        title: "Platform",
        items: [
          "shadcn/ui with Tailwind v4, React 19, Vite 8, TypeScript 6",
          "Supabase Postgres + Auth + Realtime + Storage + Edge Functions",
          "GitHub Pages hosting via GitHub Actions CI/CD",
          "Dark / light theme toggle, mobile-responsive",
          "Self-service password change from user menu",
        ],
      },
    ],
  },
]

// ── Badge colours ─────────────────────────────────────────────────────────────

const TYPE_STYLES: Record<ReleaseEntry["type"], string> = {
  major: "bg-primary text-primary-foreground",
  minor: "bg-blue-600 text-white dark:bg-blue-500",
  patch: "bg-muted text-muted-foreground",
}

const TYPE_LABELS: Record<ReleaseEntry["type"], string> = {
  major: "Major",
  minor: "Minor",
  patch: "Patch",
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ChangelogPage() {
  return (
    <div className="min-h-svh bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <Link
            to="/login"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <PackageCheck className="size-4" />
            </div>
            <span className="text-sm font-semibold">Frontline Tracker</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        {/* Hero */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight">Changelog</h1>
          <p className="mt-2 text-muted-foreground">
            All notable changes to Frontline Tracker, newest first.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute top-0 bottom-0 left-[7px] w-px bg-border" />

          <div className="flex flex-col gap-12">
            {RELEASES.map((release) => (
              <div key={release.version} className="relative pl-8">
                {/* Dot */}
                <div className="absolute left-0 top-1.5 size-3.5 rounded-full border-2 border-primary bg-background" />

                {/* Header */}
                <div className="flex flex-wrap items-center gap-2.5 mb-1">
                  <span className="text-xl font-bold">{release.version}</span>
                  <Badge className={TYPE_STYLES[release.type]}>
                    {TYPE_LABELS[release.type]}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{release.date}</span>
                </div>

                <p className="text-muted-foreground mb-5">{release.summary}</p>

                {/* Sections */}
                <div className="flex flex-col gap-5">
                  {release.sections.map((section) => (
                    <div key={section.title}>
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        {section.title}
                      </h3>
                      <ul className="space-y-1.5">
                        {section.items.map((item, i) => (
                          <li key={i} className="flex gap-2 text-sm">
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
