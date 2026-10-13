import {
  BarChart3,
  CalendarCheck2,
  FileText,
  FolderKanban,
  LayoutGrid,
  LifeBuoy,
  PenTool,
  Shield,
  Truck,
  UsersRound,
} from "lucide-react"

import { APP_PAGES, type AccessRole, type AppPage, type Profile } from "@/lib/types"
import { pageAccessFor } from "@/lib/access"

/**
 * Single source of truth for app navigation.
 * The sidebar, mobile nav, command palette and breadcrumbs all render from
 * this config so access rules and labels never drift apart.
 */
export interface NavItem {
  to: string
  label: string
  icon: typeof LayoutGrid
  /** Access-controlled page key; undefined = visible to every signed-in user */
  page?: AppPage
  adminOnly?: boolean
  /** Roadmap item — rendered disabled with a "Soon" tag */
  soon?: boolean
}

export interface NavSection {
  label?: string
  items: NavItem[]
}

const SECTIONS: NavSection[] = [
  {
    // Home — the project picker. Always reachable from inside a project.
    items: [{ to: "/projects", label: "All projects", icon: FolderKanban }],
  },
  {
    label: "Procurement",
    items: [
      { to: "/", label: "Tracker", icon: LayoutGrid, page: "tracker" },
      { to: "/delivery-notes", label: "Delivery Notes", icon: Truck, page: "tracker" },
      { to: "/documents", label: "Documents", icon: FileText, page: "documents" },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/tickets", label: "Tickets", icon: LifeBuoy, page: "tickets" },
      { to: "/technicians", label: "Technicians", icon: UsersRound, page: "technicians" },
      { to: "/sla", label: "SLA", icon: CalendarCheck2, page: "sla" },
      { to: "/schematics", label: "Schematics", icon: PenTool, soon: true },
    ],
  },
  {
    label: "Insights",
    items: [{ to: "/dashboard", label: "Dashboard", icon: BarChart3, page: "dashboard" }],
  },
  {
    label: "Admin",
    items: [{ to: "/admin", label: "Admin Console", icon: Shield, adminOnly: true }],
  },
]

/** Pages a profile can open (view or edit). */
export function allowedPagesFor(profile: Profile | null, role?: AccessRole | null): Set<AppPage> {
  return new Set(APP_PAGES.filter((pg) => pageAccessFor(profile, role, pg) !== "none"))
}

export function navSectionsFor(profile: Profile | null, role?: AccessRole | null): NavSection[] {
  const allowed = allowedPagesFor(profile, role)
  const isAdmin = !!profile?.is_admin
  const isFirstfix = profile?.org === "firstfix"

  return SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (item.adminOnly) return isAdmin
      if (item.soon) return !isFirstfix
      if (item.page) return allowed.has(item.page)
      return true
    }),
  })).filter((section) => section.items.length > 0)
}

const EXTRA_LABELS: Record<string, string> = {
  "/changelog": "Changelog",
  "/updates": "Updates",
  "/docs": "Docs",
  "/legal": "Legal",
}

export function pageLabelFor(pathname: string): string | undefined {
  for (const section of SECTIONS) {
    const hit = section.items.find((i) => i.to === pathname)
    if (hit) return hit.label
  }
  if (pathname.startsWith("/sla/")) return "SLA"
  return EXTRA_LABELS[pathname]
}

/** The access-controlled page a route belongs to, if any. */
export function pageForPath(pathname: string): AppPage | undefined {
  for (const section of SECTIONS) {
    for (const i of section.items) {
      if (!i.page) continue
      if (i.to === "/" ? pathname === "/" : pathname === i.to || pathname.startsWith(i.to + "/")) return i.page
    }
  }
  return undefined
}
