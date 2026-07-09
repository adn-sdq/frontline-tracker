import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { FitLogo } from "@/components/FitLogo"

// ── Release data ──────────────────────────────────────────────────────────────
// Add new releases at the top. type: "major" | "minor" | "patch"

export interface ReleaseEntry {
  version: string
  date: string
  summary: string
  type: "major" | "minor" | "patch"
  sections: { title: string; items: string[] }[]
}

export const RELEASES: ReleaseEntry[] = [
  {
    version: "v2.10.1",
    date: "2026-07-09",
    type: "patch",
    summary: "Consistent calendars — every date field now uses the same calendar picker.",
    sections: [
      {
        title: "Dates",
        items: [
          "Replaced the remaining native date inputs (technician requests, assignments, technician form, document date) with the shared calendar picker",
          "The picker now supports a minimum date, so 'to' dates can't be set before their 'from' date",
        ],
      },
    ],
  },
  {
    version: "v2.10.0",
    date: "2026-07-07",
    type: "minor",
    summary:
      "Kanban boards — drag-and-drop boards for support tickets and the feature roadmap.",
    sections: [
      {
        title: "Boards",
        items: [
          "Support Tickets now has a Board view — switch with the list/board toggle and drag tickets between status columns to update them",
          "The feature roadmap (Updates → Feature requests) now has a Board view; admins can drag requests between Pending / Planned / In Progress / Done / Rejected",
          "Both boards share one reusable drag-and-drop Kanban component",
        ],
      },
    ],
  },
  {
    version: "v2.9.0",
    date: "2026-07-07",
    type: "minor",
    summary:
      "Tabbed item detail — the item view is now organised into Details, Serials, Attachments and History tabs; plus more delete confirmations.",
    sections: [
      {
        title: "Item detail",
        items: [
          "Opening an item now shows tabs — Details, Serials, Attachments and History — so the form is far less crowded and its full record is easy to browse",
          "Added a History tab showing the full change timeline (who changed what, and when) right inside the item view",
          "Reused one shared history timeline for both the item tab and the side drawer",
        ],
      },
      {
        title: "Confirmations",
        items: [
          "Deleting a technician request or removing a schedule assignment now asks for confirmation first",
        ],
      },
    ],
  },
  {
    version: "v2.8.2",
    date: "2026-07-07",
    type: "patch",
    summary:
      "Avatar, item-detail and confirmation polish — coloured avatars, a compact quantities block, and a standardised delete dialog.",
    sections: [
      {
        title: "Avatars & profile",
        items: [
          "People without a profile photo now get consistent, colour-coded initials instead of a uniform grey circle — the colour stays stable per person across the app",
          "Unified the avatar into one shared component (sidebar + profile view) so it always looks and behaves the same",
        ],
      },
      {
        title: "Item detail",
        items: [
          "Redesigned the Quantities (Required / Ordered / Delivered / Installed) into a single compact, lower-emphasis group so it no longer dominates the item form",
          "Added separators between property groups (specs · status · schedule) to make the item detail easier to scan",
        ],
      },
      {
        title: "Confirmations",
        items: [
          "Deleting a delivery note now uses the shared confirmation dialog (with a proper spinner) instead of a one-off dialog",
        ],
      },
    ],
  },
  {
    version: "v2.8.1",
    date: "2026-07-07",
    type: "patch",
    summary:
      "Consistency pass — tickets, documents and delivery notes now share the same empty-state and loading treatment.",
    sections: [
      {
        title: "Consistency",
        items: [
          "Tickets, Documents and Delivery Notes now use the shared EmptyState, so 'nothing here yet' and 'no results' look identical everywhere",
          "Standardised loading indicators on the shared Spinner across the Documents page (list and action buttons)",
        ],
      },
    ],
  },
  {
    version: "v2.8.0",
    date: "2026-07-07",
    type: "minor",
    summary:
      "Foundations & polish — shared loading, empty-state and confirmation building blocks, a proper 404 page, and tighter control proportions.",
    sections: [
      {
        title: "New building blocks",
        items: [
          "Added a shared Spinner and a consistent EmptyState used across list views, so loading and 'nothing here yet' states look the same everywhere",
          "Added a reusable confirmation dialog — destructive actions now ask before they act (starting with removing item attachments)",
          "Added a friendly 404 page for unknown links, with quick ways back home or to the previous page",
        ],
      },
      {
        title: "Polish",
        items: [
          "Fixed the add / action button proportions so they line up cleanly with search boxes and dropdowns in every filter row (matched the 32px control height and softened the square look)",
          "Bulletproofed the collapsed sidebar rail so every icon centres on one axis regardless of scrolling, and softened the project switcher from a hard-bordered square",
        ],
      },
    ],
  },
  {
    version: "v2.7.1",
    date: "2026-07-07",
    type: "patch",
    summary: "Shell polish — aligned the collapsed rail, moved page actions inline, and tidied the sidebar footer.",
    sections: [
      {
        title: "Sidebar",
        items: [
          "Fixed icon alignment in the collapsed rail so the logo, toggle and every icon share one centre line (and the nav no longer shifts when a scrollbar appears)",
          "Delivery Notes now uses the truck icon in the sidebar and the New menu, matching its action button",
          "Updates now sits beside Docs in the footer meta row with matching link styling, instead of a separate row",
        ],
      },
      {
        title: "Page actions",
        items: [
          "Primary add buttons moved inline to the end of each page's search/filter row (e.g. next to the date filters on Delivery Notes) instead of the top bar",
          "Tracker keeps its delivery-note toggle and Import/Export overflow together with Add at the end of the filter row",
        ],
      },
    ],
  },
  {
    version: "v2.7.0",
    date: "2026-07-07",
    type: "minor",
    summary: "App-shell redesign — collapsible sidebar, cleaner top bar, and consistent icon action buttons across pages.",
    sections: [
      {
        title: "Sidebar",
        items: [
          "Collapse the sidebar to an icon-only rail (and expand it back) to give the main content more room — your preference is remembered across sessions",
          "Collapsed rail shows tooltips on hover so every nav item stays discoverable",
          "Profile moved into a dropdown at the bottom of the sidebar — open your profile or sign out from one place",
          "Theme toggle is now a minimal icon alongside Docs + version, instead of a full row",
        ],
      },
      {
        title: "Top Bar",
        items: [
          "Removed the account avatar and breadcrumb from the top bar — the account now lives in the sidebar and breadcrumbs sit just above each page title",
          "Search box is now a fixed width so it no longer resizes as page actions change — consistent on every page",
          "Page action buttons are compact icon buttons with tooltips; secondary actions (like Import / Export) collapse into an overflow menu to reduce clutter",
        ],
      },
      {
        title: "Pages",
        items: [
          "Removed the coloured category labels (Register, Support, Logistics, …) above page titles for a cleaner header",
          "Removed the lightbulb Feature Inbox from the Admin page — feature requests are managed on the Updates page now",
        ],
      },
    ],
  },
  {
    version: "v2.6.1",
    date: "2026-07-07",
    type: "patch",
    summary: "Shell UX polish — sidebar profile row, theme toggle relocated, and per-page action buttons in the top bar.",
    sections: [
      {
        title: "Sidebar",
        items: [
          "Profile row at the bottom of the sidebar — shows your avatar, name and @username; click to open your profile dialog",
          "Theme toggle (dark/light mode) moved from the top bar into the sidebar footer with a text label",
          "Profile row and theme toggle sit above the Updates link for a clean footer hierarchy",
        ],
      },
      {
        title: "Top Bar",
        items: [
          "Page action buttons (Add item, Import, Export, New delivery note, New ticket, Request technicians, etc.) now appear in the top-right of the top bar — keeps page bodies clean",
          "Visual separator between page actions and the user avatar",
          "\"My profile\" now opens on first click — fixed a Radix Dialog + DropdownMenu focus-trap race condition",
        ],
      },
      {
        title: "Bug Fixes",
        items: [
          "Fixed a React hooks ordering violation in ProfileDialog that caused \"view profile\" to silently fail on the first click",
        ],
      },
    ],
  },
  {
    version: "v2.6.0",
    date: "2026-07-07",
    type: "minor",
    summary: "Dedicated Updates page — changelog and feature requests now live inside the app as a first-class experience.",
    sections: [
      {
        title: "Updates Page",
        items: [
          "New /updates page inside the app shell — What's New tab (full changelog with type filters and collapsible cards) and Feature Requests tab (submit, upvote, and track status)",
          "Changelog cards are collapsible — the latest release opens by default, older ones are collapsed for scanning",
          "Type filter chips (All / Major / Minor / Patch with counts) let you quickly scan what kind of changes landed",
          "Feature Requests board: submit a new request inline, upvote others, and see status (Pending → Planned → In Progress → Done) in one place",
          "Upvotes are now tracked per-user with a one-vote guard — your vote persists across sessions",
          "\"Mine\" badge on requests you submitted, so they're easy to find",
          "Updates page is accessible to all team members (including read-only guests)",
        ],
      },
      {
        title: "Navigation",
        items: [
          "\"Request a feature\" dialog removed from the sidebar footer — consolidated into the Updates page",
          "Sidebar footer now links directly to Updates and Docs",
        ],
      },
      {
        title: "Database",
        items: [
          "Migration 0017: feature_requests SELECT opened to all authenticated users; admin-only write/delete policies enforced",
          "New upvote_feature_request() SECURITY DEFINER function — prevents users from modifying any field other than upvote count",
        ],
      },
    ],
  },
  {
    version: "v2.5.0",
    date: "2026-07-06",
    type: "minor",
    summary: "New Technicians module — coordinate field technicians with a request → approve → assign workflow.",
    sections: [
      {
        title: "Technicians",
        items: [
          "Roster: managers create, edit and delete technicians with Iqama number + expiry (with expiry warnings), trade, phone, nationality and notes",
          "Requests: members request technicians for their project over flexible date-to-date and time-to-time ranges, with a quantity, notes and quick-select gear tags (Ladder, Tools, Safety Vest, Harness, Scaffold, Drill/Power Tools, PPE, Access Card)",
          "Request inbox: managers filter by status and respond — Approve & assign specific technicians (optionally on adjusted dates), Propose change, or Decline, each with a note back",
          "Schedule board: see where each technician is today and where they're headed next, plus ad-hoc direct assignments",
          "My requests: members track their requests and the manager's response, and can cancel while pending",
        ],
      },
      {
        title: "Access & Roles",
        items: [
          "New Technicians manager role — admins are managers by default and can grant it to any member from their profile",
          "Technicians is an access-controlled page; First Fix users are excluded from all technician data at the database level",
        ],
      },
    ],
  },
  {
    version: "v2.4.2",
    date: "2026-07-05",
    type: "patch",
    summary: "Seven bugs identified by code review and fixed.",
    sections: [
      {
        title: "Bug Fixes",
        items: [
          "Project dialog: success toast now fires only after both the project row and system assignments are saved",
          "Project dialog: Escape / backdrop no longer dismiss the dialog while a save is in flight",
          "Project dialog: system checkboxes now default to all-checked even when the systems query loads after the dialog opens",
          "Dashboard: Overall totals now match the sum of per-system cards",
          "Delivery Notes: DN number field now fills in when the sequence query resolves after the dialog opens",
          "Hooks: useProjectSystemKeys and useAllProjectSystems now set staleTime: 30 000 to avoid extra refetches",
          "Repo: added missing migration file 0014_project_systems.sql",
        ],
      },
    ],
  },
  {
    version: "v2.4.1",
    date: "2026-07-01",
    type: "patch",
    summary: "Save a delivery note without generating a PDF — for notes created externally or handed in on paper.",
    sections: [
      {
        title: "Improvements",
        items: [
          "Delivery note dialog now has three action buttons: Preview only, Save, and Save & print",
          "\"Save\" records the note without opening the print dialog",
          "\"Save & print\" retains the previous behaviour",
          "\"Preview only\" generates the PDF without saving",
        ],
      },
    ],
  },
  {
    version: "v2.4.0",
    date: "2026-07-01",
    type: "minor",
    summary: "Create delivery notes manually from the Delivery Notes page without going through the Procurement flow.",
    sections: [
      {
        title: "Features",
        items: [
          "New \"New delivery note\" button on the Delivery Notes page opens the full form with all header fields and an empty item list",
          "All header fields editable: DN number, date, PO, customer PO, deliver to, location, and contact — pre-filled from project settings",
          "Add, edit, and remove line items freely before saving",
          "\"Preview / Print only\" option generates the PDF without saving to the database",
          "\"Save & generate\" saves the note and opens the printable PDF",
        ],
      },
    ],
  },
  {
    version: "v2.3.3",
    date: "2026-07-01",
    type: "patch",
    summary: "Fixed stale delete dialog appearing on ticket switch; added PO and VO document types.",
    sections: [
      {
        title: "Bug Fixes",
        items: [
          "Selecting a new ticket immediately after deleting one no longer shows a stale delete confirmation dialog",
        ],
      },
      {
        title: "Features",
        items: [
          "Added PO and VO to the document type dropdown in Documents",
        ],
      },
    ],
  },
  {
    version: "v2.3.2",
    date: "2026-07-01",
    type: "patch",
    summary: "Fixed long file names overflowing the upload area in the document dialog.",
    sections: [
      {
        title: "Bug Fixes",
        items: [
          "Selected file names now wrap across multiple lines instead of overflowing the dialog edge",
        ],
      },
    ],
  },
  {
    version: "v2.3.1",
    date: "2026-07-01",
    type: "patch",
    summary: "Fixed dialogs overflowing horizontally when an input field contains a long value.",
    sections: [
      {
        title: "Bug Fixes",
        items: [
          "Document, Item, Ticket, Delivery Note, and Project dialogs no longer expand beyond their width when a field has a very long value",
          "Root cause: input elements have an intrinsic min-width that lets them grow past their container; overflow-x: hidden on the dialog clips this correctly",
        ],
      },
    ],
  },
  {
    version: "v2.3.0",
    date: "2026-07-01",
    type: "minor",
    summary: "Each project now has its own set of enabled systems, configured independently by admins.",
    sections: [
      {
        title: "Features",
        items: [
          "Admin → Projects: system checkbox list in the create/edit dialog — choose which systems are active for each project",
          "System tabs in Tracker and Documents filter to the current project's assigned systems only",
          "Add/Edit item and Add document dropdowns show only the project's enabled systems",
          "Dashboard stats panel shows per-system breakdowns for the project's assigned systems",
          "Project rows in the Admin panel show badges for each assigned system at a glance",
          "Default: all globally active systems are pre-selected when creating a new project",
        ],
      },
    ],
  },
  {
    version: "v2.2.4",
    date: "2026-07-01",
    type: "patch",
    summary: "Fixed project list showing empty after login without a page refresh.",
    sections: [
      {
        title: "Bug Fixes",
        items: [
          "Projects now load correctly immediately after login — no refresh needed",
          "Root cause: the projects query ran before login and cached an empty result; subsequent logins reused that stale cache",
          "Fix: query key now includes the user ID so each login triggers a fresh fetch, and the query is disabled entirely when not authenticated",
        ],
      },
    ],
  },
  {
    version: "v2.2.3",
    date: "2026-07-01",
    type: "patch",
    summary: "Fixed account creation failing due to a stale Edge Function deployment.",
    sections: [
      {
        title: "Bug Fixes",
        items: [
          "Redeployed the admin-users Edge Function (v3) — create account, set password, and delete account now work again",
          "Root cause: the previously deployed bundle was unretrievable, causing all calls to fail at the network level",
        ],
      },
    ],
  },
  {
    version: "v2.2.2",
    date: "2026-07-01",
    type: "patch",
    summary: "Fixed form state resetting when switching tabs or when realtime updates fire while a dialog is open.",
    sections: [
      {
        title: "Bug Fixes",
        items: [
          "Project dialog no longer resets fields when the page re-renders in the background",
          "Item dialog no longer resets when switching system tabs while the dialog is open",
          "Ticket, Document, and Delivery Note dialogs all fixed with the same pattern",
          "Root cause: form seed effect now only fires on dialog open, not on every re-render triggered by realtime subscriptions",
        ],
      },
    ],
  },
  {
    version: "v2.2.1",
    date: "2026-07-01",
    type: "patch",
    summary: "Fixed serial column alignment and improved delivery note mode with an explicit toggle and sticky banner.",
    sections: [
      {
        title: "Delivery Note",
        items: [
          "Cart buttons are now hidden by default — activate with the Delivery note button in the header",
          "Sticky banner shows while in DN mode with item count, Cancel, and Generate actions",
          "Generating or cancelling exits DN mode and clears the cart automatically",
        ],
      },
      {
        title: "UI",
        items: [
          "Serial number column is now a fixed width so counts like 0/22 and 1/1 align across all rows",
        ],
      },
    ],
  },
  {
    version: "v2.2.0",
    date: "2026-06-30",
    type: "minor",
    summary: "Cart-based delivery note flow — add individual items with specific quantities and serial numbers before generating a DN.",
    sections: [
      {
        title: "Delivery Note — Cart Flow",
        items: [
          "Each procurement item now has a PackagePlus button to add it to a delivery cart",
          "Popover lets you set the quantity and pick specific serial numbers per item",
          "Cart persists across the page — build up a multi-item delivery without leaving the list",
          "Delivery note button in the header shows cart size and is disabled when cart is empty",
          "Mobile sticky banner shows cart size with Clear and Generate shortcuts",
          "Generating the DN clears the cart automatically",
          "Removed the old all-or-nothing checkbox selection mode",
        ],
      },
    ],
  },
  {
    version: "v2.1.1",
    date: "2026-06-30",
    type: "patch",
    summary: "Feature inbox polish — downvoting, delete, and removal of the notification bubble.",
    sections: [
      {
        title: "Admin — Feature Inbox",
        items: [
          "Downvote button added alongside upvote — score can go negative to deprioritise",
          "Delete button on each request card — removes it immediately with a confirmation toast",
          "Removed the pending count badge from the lightbulb icon",
          "Fixed query bug where the inbox showed empty due to a broken profiles join",
        ],
      },
    ],
  },
  {
    version: "v2.1.0",
    date: "2026-06-26",
    type: "minor",
    summary: "Feature inbox for admins to review, prioritise, and track submitted feature requests. Full Sonner toast coverage across every mutation in the app.",
    sections: [
      {
        title: "Admin — Feature Inbox",
        items: [
          "Subtle lightbulb icon button in the Admin page header opens a right-hand drawer — visible to admins but unobtrusive",
          "Pending count badge on the icon so nothing gets missed",
          "Filter requests by status: All / Pending / Planned / In Progress / Done / Rejected",
          "Upvote button (arrow + count) on each card to prioritise requests",
          "Change status inline via a color-coded badge dropdown (amber → blue → orange → green)",
          "Shows submitter name and submission date per request",
        ],
      },
      {
        title: "Toasts",
        items: [
          "Every create, update, and delete action now shows a success toast",
          "Previously missing: project member assign/remove, org change, admin role change, page access toggle",
          "Also added: project activate/deactivate, system enable/disable, comment posted, file date updated",
        ],
      },
    ],
  },
  {
    version: "v2.0.3",
    date: "2026-06-26",
    type: "patch",
    summary: "Complete Sonner toast coverage — every mutation now gives feedback.",
    sections: [
      {
        title: "Toasts",
        items: [
          "Admin: assign/remove user from project, org change, admin role toggle, page access toggle",
          "Admin: project activate/deactivate, system enable/disable",
          "Documents: comment posted, file date updated",
        ],
      },
    ],
  },
  {
    version: "v2.0.2",
    date: "2026-06-25",
    type: "patch",
    summary: "Docs page redesign — persistent sidebar on desktop, improved typography and hierarchy.",
    sections: [
      {
        title: "Docs Page",
        items: [
          "Persistent left sidebar (w-64, sticky) on desktop replaces the two-row horizontal scroll nav",
          "Mobile keeps the original compact tab rows",
          "Fraunces display serif applied to section headings and stat numbers",
          "Stat grid numbers now use tabular-nums and brand primary color",
          "FIT logo replaces PackageCheck icon in the top bar; back link corrected to '/'",
        ],
      },
    ],
  },
  {
    version: "v2.0.1",
    date: "2026-06-25",
    type: "patch",
    summary: "Auth timing fixes — sign-in now navigates to the project picker immediately, and refreshing inside a project returns to the picker.",
    sections: [
      {
        title: "Auth",
        items: [
          "Fixed race condition where loading cleared before profile fetch completed, causing wrong redirects on sign-in",
          "App now waits for both session and profile to resolve before rendering protected routes",
          "ProjectsPage clears any persisted project selection on mount — refresh or back always shows the picker",
          "Entering a project requires an explicit card click; localStorage still remembers last project for fast re-entry when intended",
        ],
      },
    ],
  },
  {
    version: "v2.0.0",
    date: "2026-06-25",
    type: "major",
    summary: "FIT 2.0 — a complete visual redesign. Every screen carries the brand identity established at sign-in: Fraunces serif titles, brand orange + navy palette, editorial page headers, and elevated cards throughout.",
    sections: [
      {
        title: "Brand & Identity",
        items: [
          "App renamed FIT — Frontline Internal Tools, with a new custom SVG logo",
          "Login headline updated: 'Built at the front. Tracked to Handover.' — resonates with Frontline's on-site mission",
          "Art panel quote: 'From the first PO to the final sign-off — nothing slips.'",
          "Brand orange (#E37C30) and navy (#1B354F) as primary palette in both light and dark mode",
          "Fraunces display serif registered as --font-display, used for all headlines",
        ],
      },
      {
        title: "Sign-in Page",
        items: [
          "Crystalline geometric SVG art panel — hand-built, no image assets, scales perfectly",
          "Desktop: split-card with art on left, form on right; floating card on ambient backdrop",
          "Mobile: art fills top 42svh, FIT logo pinned to art, form fills remaining height",
        ],
      },
      {
        title: "App-wide Design System",
        items: [
          "Shared PageHeader component: orange eyebrow + Fraunces serif title on every page",
          "App canvas: subtly tinted dot-textured background so white cards lift off the surface",
          "Consistent rounded-xl cards with hover lift and border transitions throughout",
        ],
      },
      {
        title: "Projects (landing)",
        items: [
          "Time-aware greeting ('Good morning / afternoon / evening') with user's first name",
          "Project cards: reveal-on-hover top accent bar, lift animation, branded icon tile",
        ],
      },
      {
        title: "Tickets",
        items: [
          "Cards redesigned with a two-zone desktop layout: title + meta on the left, badges + age pinned right",
          "Consistent max-width with all other pages (was narrower before)",
          "Empty state: editorial icon tile with Fraunces heading",
        ],
      },
      {
        title: "Request a Feature",
        items: [
          "Moved from the login page into the authenticated app (user menu + mobile nav)",
        ],
      },
    ],
  },
  {
    version: "v1.4.0",
    date: "2026-06-25",
    type: "minor",
    summary: "Carried the sign-in page's editorial design language across the whole app.",
    sections: [
      {
        title: "Design System",
        items: [
          "Shared PageHeader with Fraunces display-serif titles and an orange eyebrow label on every page",
          "App content sits on a subtly tinted, dot-textured canvas so white cards feel elevated",
          "Consistent brand orange/navy palette throughout",
        ],
      },
      {
        title: "Projects (landing)",
        items: [
          "Redesigned post-login project picker into a hero — time-aware greeting and a large serif welcome",
          "Elevated project cards: hover lift, reveal-on-hover accent bar, animated arrow, branded icon tiles",
        ],
      },
    ],
  },
  {
    version: "v1.3.0",
    date: "2026-06-25",
    type: "minor",
    summary: "Editorial redesign of the sign-in page with a brand-colored geometric art panel.",
    sections: [
      {
        title: "Login Page",
        items: [
          "Split-card layout: crystalline geometric artwork on the left, sign-in form on the right",
          "New Fraunces display serif headline — 'Where Every Part Finds Its Place'",
          "Hand-built SVG art panel in the brand palette (blue / orange / navy / maroon) — no image assets",
          "Soft minimal input fields, show/hide password toggle",
          "FIT branding + version in the footer; Request a feature lives inside the card",
          "Mobile: art renders as a top banner fading into the form",
        ],
      },
    ],
  },
  {
    version: "v1.2.0",
    date: "2026-06-25",
    type: "minor",
    summary: "Full rebrand to FIT (Frontline Internal Tools). New login page, orange+navy theme throughout.",
    sections: [
      {
        title: "Branding",
        items: [
          "App renamed to FIT — Frontline Internal Tools",
          "Custom SVG logo (orange + navy) replaces generic icon everywhere",
          "Primary color updated to brand orange (#E37C30); dark mode surfaces shift to navy-tinted",
          "New split-screen login page with brand panel, watermark logo, dot-grid texture",
          "Favicon and page title updated",
        ],
      },
      {
        title: "Mobile UX",
        items: [
          "Admin projects card: details no longer wrap word-by-word — grid layout with truncate",
          "Admin accounts: separate mobile card view alongside desktop table",
          "Tickets filter row: stacked search + wrapping select row for mobile",
          "Dashboard stat grid: 2-column on mobile, 4-column on larger screens",
          "Serial number list: 'Unit N' label now stays on a single line (whitespace-nowrap)",
        ],
      },
    ],
  },
  {
    version: "v1.1.0",
    date: "2026-06-25",
    type: "minor",
    summary: "Native PDF viewer, spreadsheet previewer, and file viewer modal improvements.",
    sections: [
      {
        title: "File Viewer",
        items: [
          "PDF viewer switched to native browser iframe — real text selection, Ctrl+F, zero maintenance",
          "SheetJS spreadsheet viewer for .xlsx and .xls — table preview with sheet tabs",
          "Fixed large blank space at top of viewer modal (DialogContent flex layout fix)",
          "Date picker in file item cards now compact (h-6, w-32)",
        ],
      },
    ],
  },
  {
    version: "v1.0.0",
    date: "2026-06-25",
    type: "major",
    summary: "First stable release. Full procurement coordination platform for MiSK Ilmi Campus AV/IT systems.",
    sections: [
      {
        title: "Serial Numbers",
        items: [
          "Per-unit serial tracking — one slot per unit driven by qty_required",
          "Serial inputs in the item edit dialog (Unit 1, Unit 2…), auto-save on blur, filled/total badge",
          "Detail sheet (read-only preview) now shows all serial slots with status badge",
          "Table rows: Hash button on each row expands a full-width serial grid below — shows N/M count",
          "Cards (mobile): full-width Serial Numbers toggle at the bottom of each card",
          "Delivery Note dialog auto-populates serial fields from recorded serials when opened",
        ],
      },
      {
        title: "Filters",
        items: [
          "Separate Brand and Model filter dropdowns in the Tracker toolbar (desktop)",
          "Both included in the clear-all action alongside status filters",
        ],
      },
    ],
  },
  {
    version: "v0.4.0",
    date: "2026-06-25",
    type: "minor",
    summary: "Project details hub with pre-fill across all forms. Navigation moved to top bar. Docs page expanded.",
    sections: [
      {
        title: "Project Details",
        items: [
          "Projects now store client name, our PO, client PO, site location and site contact",
          "Admin → Projects section has a full create/edit dialog for all project fields",
          "Project detail values shown inline under each project row in the admin panel",
        ],
      },
      {
        title: "Pre-fill",
        items: [
          "Delivery Note dialog auto-fills PO numbers, deliver-to, location and contact from the current project",
          "Add item dialog pre-fills location from the project's site location",
        ],
      },
      {
        title: "Navigation",
        items: [
          "Sidebar replaced with a sticky top navigation bar (desktop)",
          "Mobile keeps a slide-in sheet; logo and project switcher on the left",
          "Theme toggle and user menu on the right; Changelog and Docs moved into the user dropdown",
        ],
      },
      {
        title: "Docs Page",
        items: [
          "Navigation moved to two sticky rows at the top (section tabs + sub-page tabs)",
          "New sections: Quick Reference, Control Systems, DSP & Audio, Wireless Mics, Video Conferencing, Electrical & Power, Vendors & Brands, Project Documentation",
          "Visual elements: stat grids, progress bars, formula blocks, Accordion vendor breakdowns, tabbed system comparisons",
        ],
      },
      {
        title: "Accessibility & Feedback",
        items: [
          "Tooltips added to all icon-only buttons across Tracker, Documents, Admin and Delivery Notes",
          "Sonner toast notifications throughout — project switch, sign out, create/update/delete confirmations",
        ],
      },
    ],
  },
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
          "Generates a print-perfect PDF matching the Frontline Solutions template via browser Save-as-PDF",
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

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_BADGE: Record<ReleaseEntry["type"], string> = {
  major: "bg-primary/15 text-primary border-primary/25",
  minor: "bg-blue-500/10 text-blue-600 border-blue-500/25 dark:text-blue-400",
  patch: "bg-muted text-muted-foreground border-border",
}

const TYPE_LABELS: Record<ReleaseEntry["type"], string> = {
  major: "Major",
  minor: "Minor",
  patch: "Patch",
}

const TYPE_BORDER: Record<ReleaseEntry["type"], string> = {
  major: "border-l-primary",
  minor: "border-l-blue-500/60",
  patch: "border-l-border",
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ChangelogPage() {
  const latest = RELEASES[0]

  return (
    <div className="min-h-svh bg-background">

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
          <Link
            to="/login"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <div className="flex items-center gap-2">
            <FitLogo size={28} />
            <span className="text-sm font-semibold">FIT</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 pb-20">

        {/* ── Hero ── */}
        <div className="mb-10 flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Changelog</h1>
          <p className="text-muted-foreground">
            All notable changes to FIT, newest first.
            <span className="ml-2 font-mono text-xs text-muted-foreground/60">
              Latest: {latest.version}
            </span>
          </p>
        </div>

        {/* ── Release cards ── */}
        <div className="flex flex-col gap-5">
          {RELEASES.map((release, idx) => (
            <div
              key={release.version}
              id={release.version}
              className={[
                "rounded-xl border border-l-4 bg-card p-5 transition-colors",
                TYPE_BORDER[release.type],
                idx === 0 ? "shadow-sm" : "",
              ].join(" ")}
            >
              {/* ── Release header ── */}
              <div className="mb-1 flex flex-wrap items-center gap-2.5">
                <span className="text-xl font-bold tracking-tight">
                  {release.version}
                </span>
                <Badge
                  variant="outline"
                  className={["text-xs font-medium", TYPE_BADGE[release.type]].join(" ")}
                >
                  {TYPE_LABELS[release.type]}
                </Badge>
                <span className="font-mono text-xs text-muted-foreground">
                  {release.date}
                </span>
                {idx === 0 && (
                  <Badge className="ml-auto bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold">
                    Latest
                  </Badge>
                )}
              </div>

              {/* Summary */}
              <p className="mb-5 text-sm text-muted-foreground leading-relaxed">
                {release.summary}
              </p>

              {/* ── Sections ── */}
              <div className="flex flex-col gap-5">
                {release.sections.map((section) => (
                  <div key={section.title}>
                    <div className="mb-2.5 flex items-center gap-2">
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {section.title}
                      </span>
                    </div>
                    <ul className="space-y-1.5 pl-1">
                      {section.items.map((item, i) => (
                        <li key={i} className="flex gap-2.5 text-sm">
                          <span className="mt-1.75 size-1.5 shrink-0 rounded-full bg-primary/50" />
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  )
}
