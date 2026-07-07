import {
  BarChart3,
  ClipboardList,
  FileText,
  LayoutGrid,
  LifeBuoy,
  PenTool,
  Shield,
  UsersRound,
} from "lucide-react"

import type { AppPage, Profile } from "@/lib/types"

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
    label: "Procurement",
    items: [
      { to: "/", label: "Tracker", icon: LayoutGrid, page: "tracker" },
      { to: "/delivery-notes", label: "Delivery Notes", icon: ClipboardList, page: "tracker" },
      { to: "/documents", label: "Documents", icon: FileText, page: "documents" },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/tickets", label: "Tickets", icon: LifeBuoy, page: "tickets" },
      { to: "/technicians", label: "Technicians", icon: UsersRound, page: "technicians" },
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

export function allowedPagesFor(profile: Profile | null): Set<AppPage> {
  if (!profile) return new Set()
  if (profile.is_admin) return new Set<AppPage>(["tracker", "documents", "dashboard", "tickets", "technicians"])
  if (profile.org === "firstfix") return new Set<AppPage>(["documents"])
  if (!profile.allowed_pages || profile.allowed_pages.length === 0) {
    return new Set<AppPage>(["tracker", "documents", "dashboard", "tickets", "technicians"])
  }
  return new Set(profile.allowed_pages as AppPage[])
}

export function navSectionsFor(profile: Profile | null): NavSection[] {
  const allowed = allowedPagesFor(profile)
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
  "/projects": "Projects",
  "/changelog": "Changelog",
  "/docs": "Docs",
}

export function pageLabelFor(pathname: string): string | undefined {
  for (const section of SECTIONS) {
    const hit = section.items.find((i) => i.to === pathname)
    if (hit) return hit.label
  }
  return EXTRA_LABELS[pathname]
}
