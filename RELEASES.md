# Frontline Tracker — Release Notes

---

## v2.23.0 — 2026-10-22

New layout and navigation, a full item page with in-place editing, smarter tables, a real dashboard, pinned projects and redesigned QR labels.

Migration `0031_project_pins.sql` (run in the SQL editor). New dependency: `recharts` (dashboard, lazy-loaded).

### Layout & navigation
- Floating rounded sidebar (collapses to icons); top bar = toggle + breadcrumb/project switcher, centred search, page actions
- Logistics / Operations sections; Procurement and Documentation naming
- Quick actions (hover) at the top of the sidebar replaces All projects and the New button
- Feedback + Settings above the profile; Settings window (Appearance, Navigation, Connected accounts, Advanced; others placeholders)

### Procurement
- Full item page (`/item/:id`) with in-place editing; hover card on item names
- Single multi-select Filter (status, brand, model); Columns, import, export and labels in the ⋯ menu

### Tables
- Shared DataTable: sorting, show/hide columns, selection + bulk delete, row ⋯ actions

### Home, dashboard, delivery notes
- Pin up to 5 projects (admin); quick actions; Recharts dashboard; delivery note detail popup

### QR labels
- Styled QR with logo (error correction H, decode-tested), rounded B/W labels, 15/12 mm print margins, tracking page `/t/:tag`

---

## v2.22.1 — 2026-10-19

Fixes the Claude connector sign-in link when it arrives with a double slash.

### Fixes
- `public/404.html` now ignores extra slashes, so `…/frontline-tracker//oauth/consent?authorization_id=…` (Site URL with a trailing slash + the `/oauth/consent` path) opens the approval page instead of the home page

---

## v2.22.0 — 2026-10-19

Work-email accounts, an installable app, a read-only Claude connector, and the logo now takes you home.

Migrations `0029_frontline_emails.sql` (moves logins to @frontline.sa) and `0030_oauth_clients_read_only.sql` (connector tokens can't write). Edge functions: `admin-users` redeployed, new `fit-mcp`.

### Accounts
- Accounts are @frontline.sa work emails (mandatory); the allowed domains are one list in `src/lib/email.ts` and the `admin-users` function, so client domains can be added later
- Sign in with the full email or the name before the @
- Admins can change a work email from the profile

### Install & scanning
- PWA: manifest, icons and a minimal service worker (production only)
- Scanning moved to Admin Console → Scan

### Claude connector
- Hosted read-only MCP server (`supabase/functions/fit-mcp`) using Supabase's OAuth 2.1 server, approval page at `/oauth/consent` (plus `404.html` for GitHub Pages)
- Local stdio version in `mcp/` for Claude Desktop / Claude Code; both share the same five tools
- Setup steps: `docs/mcp-setup.md`

### Navigation
- Logo links to the Home Page (all projects)

---

## v2.21.0 — 2026-10-18

SKUs and QR labels for every item, an in-app scanner, a cleaner tracker list, and a fix for saving PO/VO documents.

Migrations `0027_sku_qr_tracking.sql` and `0028_doc_types_po_vo.sql` (already applied to the database). New packages: `qrcode`, `jsqr`.

### SKUs
- Every item gets its own SKU, unique across all projects — a project abbreviation plus a number, e.g. `MP-0042`. Assigned once, never changes
- Each project has an abbreviation (auto-created, editable in the project dialog)
- Old Unique ID kept as "Your reference"; SKU is searchable and in CSV export
- Items are tracked as a device (per-unit tags and QR, optional serial) or an accessory (one tag for the line)

### QR labels & scanning
- Print QR labels for an item, one unit, or the filtered list — square layout, one sans-serif font
- The QR holds only `FIT:<tag>`, not a link; details open only in the in-app Scan dialog for signed-in project members
- Camera scan (native BarcodeDetector, jsQR fallback) or type a SKU / unit tag / serial
- Scanned unit: status, serial, and Received / Moved / Installed / Issue / Note updates with history. Scans are never logged

### Tracker
- List is a real table with aligned columns and headings
- Removed ×quantity; the serials box shows the count
- Simpler cards with a Procure → Deliver → Install track; location hidden from cards and rows

### Fixes
- Saving a PO or VO document failed (DB check constraint never allowed them) — made document uploads look broken

---

## v2.20.0 — 2026-10-14

Project logos, a full-screen project view, a contact person on delivery notes, a steadier home page and a new animated loader.

Migrations 0018–0026 are now applied to the database, `admin-users` is redeployed and the SLA demo data is loaded.

### Projects
- Every project can have a logo — click or drop an image when creating or editing a project (PNG, JPG or WebP, up to 2 MB). Projects without one show coloured initials
- Logos appear on the projects home page, the project switcher and the Admin project cards
- Admin Console → Projects: clicking a project opens it full screen (stats, details, systems, team with roles) instead of leaving the console; edit, archive or open its workspace from there

### Delivery notes
- Choose our contact person when creating a delivery note — name, job title, mobile and email print under the company address (defaults to you)
- The contact is saved with the note, so reprints and previews match

### Home page
- The project list and details panel keep a fixed size — selecting a project no longer resizes the page
- All project rows are the same height, and the first project is shown straight away
- Removed the Edit button; edit projects from Admin Console → Projects
- Your badge now shows your role name

### Loader
- New loader: the FIT mark draws itself with a soft glow and a gradient progress bar (static with reduced motion)
- The loader shows for at least 1.8 seconds so the animation can finish

### Database
- `0024_privacy_cleanup.sql`: drops profile change history and last-seen tracking
- `0025_project_logos.sql`: `projects.logo_url` and the public `project-logos` bucket (admins upload)
- `0026_dn_contact_person.sql`: `delivery_notes.contact_person_id` and `company_contact` snapshot
- `0021` now also normalises the owner account's legacy role before deriving admin rights

---

## v2.19.0 — 2026-10-14

Roles are now the only way to grant access, plus a cleaner Admin Console and bigger loader.

Requires migration `0023_roles_only.sql` (after 0022) and redeploying `admin-users`.

### Roles & access
- Every person has exactly one role, and it alone decides what they can view or edit — no more separate base roles, per-person page lists or capabilities
- Built-in roles: Admin (everything, including the Admin Console), Guest (view Documents & Tickets) and No access. Built-ins can't be deleted; Admin and No access can't be changed
- Starter roles added: Project Engineer, Document Controller, Site Supervisor, Procurement Officer and Viewer — edit or delete them freely
- Each page is None, View or Edit. Edit on Technicians now covers managing the roster; Edit on SLA covers managing contracts
- Roles are assigned only by admins, in Admin Console → Access. Everyone can see their own role and access levels in their profile
- Existing accounts are moved onto roles automatically, keeping what they could do before
- Tickets is now properly restricted by role (it was reachable by URL regardless of access)

### Privacy
- Removed the profile Activity tab and the Admin audit log
- Stopped tracking when people were last active

### Admin Console
- Systems tab: rename inline, reorder (sets dropdown order everywhere), see how many items, documents and projects use each system, and delete unused ones

### Interface
- Bigger loading logo

---

## v2.18.0 — 2026-10-14

Delivery note versions with signed/unsigned uploads and previews, clearer upload errors, and Admin Console tidy-up.

Requires migration `0022_delivery_note_files.sql` (after 0021).

### Delivery notes
- Each note now has a Files view listing every version: the generated note plus any number of uploaded files
- Upload anything — scans, photos or manually made notes — and mark each file Signed or Unsigned; change it later from the file row
- A note shows Signed once any of its files is signed; the Signed/Unsigned filter follows the same rule
- New “Upload existing note” button creates a delivery note straight from files made outside the app
- Preview every version in-app: the generated note, PDFs, spreadsheets and now images; each file can also be downloaded or deleted
- Deleting a note removes all of its stored files; scans from the earlier single signed-copy field are carried over

### Uploads
- Upload errors now show the real reason instead of “Unknown error” (database errors weren't being read correctly anywhere in the app)
- Document uploads no longer depend on the approved-copy column unless an approved copy is being uploaded
- Document files can also preview images

### Admin Console
- Removed the Overview tab; Users is now the landing tab
- The Access grid lists every member, including admins, Firstfix and suspended accounts, shown locked with their effective access

### SLA
- Added a demo-data script (supabase/seed/sla_demo_data.sql) for trying the SLA module; every demo contract is tagged DEMO- and removable in one line

---

## v2.17.1 — 2026-10-14

Access UI clarity.

### Fixes
- Page access levels now read as plain labels (“Can edit”, “View only”, “No access”) with a coloured dot, instead of button-like pills
- Access grid toasts now say exactly what changed, e.g. “Procurement access removed from …”
- Super admin row is no longer listed in the Access grid

---

## v2.17.0 — 2026-10-13

Custom access roles with view-only and edit levels, project cards in the Admin Console, and access fixes.

Requires migration `0021_roles_superadmin.sql` and redeploying `admin-users`.

### Access roles
- Admins can create roles (Admin Console → Roles) that bundle page access — each page set to None, View or Edit — plus Technicians/SLA manager capabilities
- Assign a role to a member from their profile or from the Access grid; everyone on a role updates when the role changes
- View-only is enforced by the database, not just hidden: view-only users can't create, edit or delete on that page, and see a “view-only” notice
- Guest accounts are now genuinely read-only

### Admin Console
- Projects are now cards: status, description, item/document/delivery-note/ticket counts, client and PO details, systems and team avatars, with search and Active / Archived filters
- Archiving a project asks for confirmation; open a project straight from its card
- New Roles tab; the Access grid has a Role column per member

### Fixes
- Accounts created as Admin were shown as “Member” while having full admin rights (including the Admin Console). The visible role is now the single source of truth — check your user list after updating
- Members can no longer see access controls; their own profile shows a read-only summary, and other people's access isn't shown to them
- Clicking the version number now opens the changelog

### Internal
- Hidden super-admin account (`adnan`) with an Admin-mode switch in the account menu; protected from changes by other admins.
- Legal page is no longer linked anywhere — reachable only at `#/legal`.

---

## v2.16.0 — 2026-10-13

Smoother page transitions — content appears together with its data.

### Navigation
- Page transitions show a loader for a minimum of 1 second, even when data arrives instantly, then the page appears together with its data
- The loader never waits more than 8 seconds — after that the page appears with its own loading states
- Projects home: branded loader, and stat numbers show placeholders instead of popping in after the layout
- Thin progress bar at the top of the screen while data refreshes in the background

---

## v2.15.0 — 2026-10-13

SLA tracking module, a reworked profile system, and a tabbed Admin Console.

Requires migrations `0019_profiles_access.sql` and `0020_sla.sql`, and redeploying the `admin-users` edge function.

### SLA tracking (new)
- New SLA page under Operations: maintenance contracts with monthly (or 2/3/6/12-monthly) visits owed from the contract start date
- This month view lists every visit due or overdue across all contracts; KPI tiles for due, overdue, unsigned reports and open issues
- Visit record: status, scheduled/visited dates, lead engineer, technicians from the roster, client signatory and work carried out
- Printable visit report (outstanding issues, new issues, work done, signature blocks) to get signed on site; upload the signed copy, which marks the visit Signed (Unsigned by default)
- Issues found on site carry over to every following visit until resolved; at each visit, resolve them with a note or keep them for the next visit
- Each issue has a timeline showing when it was raised, deferred and resolved, and at which visit
- Contract page with visit history, compliance %, issues and contract details; SLA managers (new capability) and admins manage contracts

### Profiles
- Profile is now tabbed: Overview, Access, Security, Activity
- New details: job title, department, phone, contact email, employee ID, location and an About section, editable by the user or an admin
- Access tab gathers role, organisation, capabilities (Technicians manager, SLA manager), page access and project membership in one place
- Accounts can be suspended and reactivated with a reason; suspended users are signed out and blocked from signing in
- Activity tab shows every change to the profile: who changed which field, from what, to what
- Last-active tracking

### Admin Console
- Reorganised into tabs: Overview, Users, Access, Projects, Systems, Audit log
- Overview lists accounts without projects, accounts inactive for 30+ days, and projects with no members
- Users: search plus filters by role, team and status; each row opens the profile on the right tab
- Access: grids for managing everyone's pages, capabilities and project membership at once
- Audit log: one combined feed of account, procurement and document changes, filterable by source and person
- Add account now sets role, job details and projects up front, and can generate a password

### Documents
- Table view now shows selection checkboxes in Select mode (previously only the card view had them)

### Security & fixes
- Users could grant themselves extra pages or the Technicians manager capability through the API; the database now blocks this
- Admin username changes now actually update the profile
- Profile edits now refresh names and avatars across the whole app

### Legal
- Ownership notice, Terms of Use and Privacy Policy at `#/legal`, linked only from the version label (sidebar footer, login page). LICENSE file added.

---

## v2.14.0 — 2026-10-13

Back-to-projects navigation, drag-and-drop uploads everywhere, document versioning and approved copies, signed delivery notes.

Requires migration `0018_doc_versions_signed_dn.sql`.

### Navigation
- "All projects" link at the top of the sidebar, in the project switcher menu, in ⌘K and as a breadcrumb — always one click back to the project list

### Uploads
- Every upload is now drag-and-drop (document files, new-document dialog, item attachments, CSV import, profile photo, signed delivery notes), with click-to-browse still available
- Multiple files can be dropped at once on documents and item attachments
- Delete option for document files, profile photos and signed delivery notes; deleting a document or delivery note also removes its stored files

### Documents
- Rename document files inline (the extension is kept)
- Upload a file as an "Approved copy" with its review code — the document's status updates automatically and the file is marked with an approved badge
- Version history: a History tab shows every saved change (field edits, uploads, renames, deletions), who made it, when, and the version number it produced; the drawer header shows the current version and who last saved it

### Delivery Notes
- Delivery notes are Unsigned by default; upload the signed scan to mark one Signed, or replace/remove it later
- Filter by All / Unsigned / Signed

### Fixes
- Deleting an item attachment now actually removes the stored file (the storage bucket was missing a delete policy)

---

## v2.13.2 — 2026-09-06

Build fix — production deploy was failing `tsc -b`.

### Fixes

- `MyRequests` was calling `RequestCard` with the old `children` API (a Cancel button); rewired it to the current `onView` / `onDelete` props with a detail dialog — the trash action cancels the member's own request
- Removed an unused `Input` import in `RespondRequestDialog` that tripped `noUnusedLocals`

---

## v2.13.1 — 2026-07-09

Technician requests — card polish, expired state, deduped actions.

### Requests

- Compact card layout: project name + status badge on one line, date / time / qty / requester on the next, tags below; notes and response notes moved to a detail dialog (eye icon)
- Requests sort automatically: actionable (pending/changed, date not yet passed) float to the top, expired in the middle, resolved at the bottom
- Expired state: a pending or changed request whose work date has passed now shows an "Expired" badge and hides the Respond button
- "New request" button moved inside the Requests tab; redundant global ActionButton removed from the tab header row

---

## v2.13.0 — 2026-07-09

Technician schedule board overhaul — global project Kanban.

### Schedule board

- Board is now the default view (replaces the list-first layout)
- Items are **technicians** (one card per person), not individual assignments — a tech's column is their current or next upcoming assignment's project
- Columns are all projects in the system (not just ones that already have assignments), plus a permanent **Unassigned** column at the left
- Drag a tech to a project column: if they have an existing assignment, the project is updated in place; if they're unassigned, the assign dialog opens pre-filled with that project and technician
- Drag a tech to Unassigned: confirms then removes their current placement, returning them to the pool
- Each card shows the tech's trade and their assignment date range (or "Available" if none)
- `AssignTechnicianDialog` now accepts a `projectId` prop so drop-to-assign pre-fills the project picker

---

## v2.12.2 — 2026-07-09

Collapsed sidebar icon centering — definitive fix.

### Collapsed rail

- Replaced `flex flex-col items-center` container centering with explicit `px-3.5` padding on every collapsed section — since the rail is 64 px and icons are 36 px (size-9), 14 px each side is arithmetically exact and can't drift with subpixel flex rounding or scrollbar-gutter offsets
- Dividers now fill the padded content area (`h-px bg-sidebar-border`, no explicit width) so they align to the same 36 px column as the icons

---

## v2.12.1 — 2026-07-09

Calendar redesign + collapsed-sidebar polish.

### Calendar

- Rewrote `ui/calendar.tsx` classNames: fixed the weekday/day width mismatch (`week` was `flex w-full` while `weekdays` was `flex`, so header and grid didn't line up), tightened cell sizing to a uniform `size-9`, absolutely-positioned nav over the caption row, and cleaned the selected/today styles

### Sidebar

- Standardised all collapsed-rail icons to `size-4.5` + `rounded-lg` (the collapse toggle and theme toggle were `size-4`), simplified the section containers, and widened dividers to `w-8` so the rail reads as one centred column

---

## v2.12.0 — 2026-07-09

Phase 3 — technician scheduling board (third Kanban), using existing data (no migration).

### Technicians

- Schedule gains a **by-place board view**: columns are sites (projects), cards are technician placements (name · dates · times)
- Managers drag a card to another site column to reassign the placement (`useUpdateAssignment`, gated by existing tech-manager RLS)
- Toggle between the by-technician roster and the by-place board

### Deferred (need a DB migration / can't be verified here)

- **Manual PDF upload for delivery notes** — delivery notes are generated client-side; storing an uploaded PDF needs a new `storage_path` column + bucket + an upload/download round-trip that can't be verified without a live environment
- **Server-side pagination for the Tracker** — the tracker relies on the full dataset for system-grouping and delivery-note multi-select; paginating server-side would break those flows and needs a UX rethink first (the new `DataTable` already gives client-side pagination for flatter lists like Documents)

---

## v2.11.0 — 2026-07-09

Phase 2 — reusable data grid, first applied to Documents.

### Tables

- New reusable `DataTable` (`src/components/ui/data-table.tsx`) built on `@tanstack/react-table` + the shared Table primitives: sortable columns, global filter, and client-side pagination
- **Documents** gains a cards/table view toggle; the table sorts by column, filters, paginates, and opens the document drawer on row click
- Note: server-side pagination for the Tracker is intentionally deferred — the tracker relies on the full dataset for system-grouping and delivery-note multi-select; revisiting once dataset sizes warrant it

---

## v2.10.1 — 2026-07-09

Calendar consistency pass.

### Dates

- Swapped the remaining native `<input type="date">` fields (technician request/respond/assign dialogs, technician form iqama expiry, document date) for the shared `DatePicker` (Calendar)
- Added an optional `min` prop to `DatePicker` (disables earlier dates via react-day-picker) so end dates can't precede start dates

---

## v2.10.0 — 2026-07-07

Phase 3 — Kanban boards for tickets and the feature roadmap.

### Boards

- New reusable `KanbanBoard` component (native HTML5 drag-and-drop, no new dependency) in `src/components/kanban/`
- **Support Tickets**: list/board view toggle; drag tickets between status columns (open · in progress · pending · resolved · closed) to update status via `useUpdateTicket`
- **Feature roadmap** (Updates → Feature requests): list/board toggle; admins drag requests across Pending · Planned · In Progress · Done · Rejected via `useUpdateFeatureRequest` (non-admins get a read-only board)

---

## v2.9.0 — 2026-07-07

Phase 2 begins — the item detail is now tabbed, and more destructive actions are confirmed.

### Item detail

- The item dialog is now organised into **Details · Serials · Attachments · History** tabs (when editing an existing item); adding a new item still shows the single form
- New **History** tab renders the full edit timeline inside the item view
- Extracted a shared `ItemHistoryList` used by both the item History tab and the `HistoryDrawer` (removes duplicated timeline rendering)

### Confirmations

- Technician request deletion and schedule assignment removal now go through the shared `useConfirm` dialog

---

## v2.8.2 — 2026-07-07

Continued Phase 1 polish — avatars, item-detail density, and confirmation consistency.

### Avatars & profile

- New shared `UserAvatar` with deterministic colour-coded initials fallbacks (stable per user id); adopted in the sidebar profile and the profile view large avatar
- Removed the duplicated `initials()` helpers in favour of the shared component

### Item detail

- Redesigned the Quantities block (Required / Ordered / Delivered / Installed) into a single compact, lower-emphasis grouped control (`QtyInput`)
- Added `Separator`s between property groups (specs · status · schedule) for scannability

### Confirmations

- Delivery-note deletion migrated to the shared `useConfirm` dialog; removed the bespoke dialog and its placeholder emoji spinner

---

## v2.8.1 — 2026-07-07

Consistency pass adopting the new v2.8.0 primitives across the list pages.

### Consistency

- Tickets, Documents and Delivery Notes now render the shared `EmptyState` for both "nothing yet" and "no results" cases
- Documents page loading indicators standardised on the shared `Spinner` (list and inline action buttons)

---

## v2.8.0 — 2026-07-07

Foundations & polish — the first phase of the broader UI overhaul. Introduces shared building blocks (loading, empty states, confirmations), a real 404 page, and tighter control proportions that later phases build on.

### New building blocks

- Shared `Spinner` and a consistent `EmptyState` component adopted across list views for uniform loading and empty presentation
- Reusable, imperative confirmation dialog (`useConfirm`) so destructive/irreversible actions are gated behind a dialog — wired first into item attachment removal
- Friendly 404 page for unknown routes with "Go back" and "Go home" actions

### Polish

- Fixed action/add button proportions to match the 32px control height and `rounded-sm` radius of inputs and selects, so they align cleanly in every filter row; softened the square-button look
- Hardened the collapsed sidebar rail — every section is an explicit full-width centered column so icons share one axis regardless of scroll gutter; softened the project switcher from a hard-bordered square

---

## v2.7.1 — 2026-07-07

Shell polish following the v2.7.0 redesign — collapsed-rail alignment, inline page actions, and a tidier sidebar footer.

### Sidebar

- Fixed icon alignment in the collapsed rail so the logo, collapse toggle and every icon share a single centre line; the nav no longer shifts when a scrollbar appears
- Delivery Notes uses the truck icon in the sidebar and the New menu, matching its action button
- Updates now sits beside Docs in the footer meta row with matching link styling, instead of its own row

### Page actions

- Primary add buttons moved inline to the end of each page's search/filter row (e.g. beside the date filters on Delivery Notes) rather than the top bar
- Tracker keeps its delivery-note toggle and Import/Export overflow together with Add at the end of the filter row

---

## v2.7.0 — 2026-07-07

App-shell redesign — collapsible sidebar, a cleaner top bar, and consistent icon action buttons across every page.

### Sidebar

- **Collapsible rail:** collapse the sidebar to an icon-only rail (and expand it back) for a wider view of the main content; the state persists across sessions
- Collapsed rail shows tooltips on hover so nav items stay discoverable
- **Profile dropdown:** the profile row at the bottom now opens a menu with "My profile" and "Sign out" — the account no longer lives in the top bar
- **Minimal theme toggle:** dark/light switch is now a small icon next to Docs + version, not a full row

### Top Bar

- Removed the account avatar and the breadcrumb from the top bar
- **Fixed-width search:** the search box no longer resizes as page actions change — it stays consistent on every page
- **Icon action buttons:** each page's actions are now compact icon buttons with tooltips; secondary actions (Import / Export) collapse into an overflow menu to reduce clutter

### Pages

- Breadcrumbs now sit just above each page title instead of in the top bar
- Removed the coloured category eyebrows (Register, Support, Logistics, …) above page titles
- Removed the lightbulb Feature Inbox from the Admin page — feature requests live on the Updates page now

---

## v2.6.1 — 2026-07-07

Shell UX polish — profile access in sidebar, theme toggle relocated, and page action buttons promoted to the top bar.

### Sidebar

- **Profile row:** avatar + name + @username at the bottom of the sidebar; click to open your profile dialog directly
- **Theme toggle:** dark/light mode switch moved from the top bar into the sidebar footer (below the profile row), now with a text label
- Theme toggle and profile row sit above the Updates link for a consistent footer ordering

### Top Bar

- **Page action buttons:** each page's primary CTA buttons (Add, Import, Export, New, Request…) now appear in the top-right corner of the top bar via a React portal — keeps the page body clean and matches the professional app-shell pattern
- Separator between page actions and the user avatar for visual grouping
- "My profile" dropdown item now opens reliably on first click (fixed Radix Dialog + DropdownMenu focus-trap race condition)

### Bug Fix

- Fixed a React hooks ordering violation in `ProfileDialog` where a `useEffect` appeared after a conditional return — caused "view profile" to silently fail on the first click

---

## v2.6.0 — 2026-07-07

Dedicated Updates page — changelog and feature requests now live inside the app as a first-class experience.

### Updates Page
- **What's New tab:** full changelog with type filter chips (All / Major / Minor / Patch with counts) and collapsible release cards — the latest opens by default, older ones collapse for easy scanning
- **Feature Requests tab:** submit a request inline (no dialog), upvote others (one vote per user, persists in localStorage), and track status (Pending → Planned → In Progress → Done) in one place
- "Mine" badge on requests you submitted; upvote button shows filled state after voting
- Page is accessible to all team members including read-only guests

### Navigation
- "Request a feature" dialog removed from the sidebar footer — consolidated into the Updates page
- Sidebar footer now links directly to Updates (with icon) and Docs

### Database
- Migration `0017`: `feature_requests` SELECT opened to all authenticated users; admin-only policies enforced for UPDATE/DELETE
- New `upvote_feature_request()` SECURITY DEFINER function — safe increment, cannot touch status or other fields

---

## v2.5.0 — 2026-07-06

New Technicians module — coordinate field technicians across projects with a request → approve → assign workflow.

### Technicians
- **Roster:** a technicians manager can create, edit and delete technicians with Iqama number + expiry (with expiry warnings), trade, phone, nationality and notes
- **Requests:** any member can request technicians for their project's upcoming work — flexible date-to-date and time-to-time ranges, a quantity, free-text notes, and quick-select requirement tags (Ladder, Tools, Safety Vest, Harness, Scaffold, Drill/Power Tools, PPE, Access Card) so common gear needn't be spelled out
- **Request inbox:** the manager sees all requests, filters by status, and responds — Approve & assign specific technicians (optionally on adjusted dates), Propose change, or Decline, each with a note back to the requester
- **Schedule board:** per-technician view of where each person is assigned today and where they're headed next, plus ad-hoc direct assignments and one-click removal
- **My requests:** members track their own requests and the manager's response, and can cancel while pending

### Access & roles
- New **Technicians manager** flag (`profiles.is_tech_manager`) — admins are managers by default; admins can grant the role to any member from their profile
- Technicians is now an access-controlled page; First Fix users don't see it
- Firstfix users are excluded from all technician data at the database (RLS) level

### Database
- Migration `0016_technicians.sql` — `technicians`, `technician_requests`, `technician_assignments` tables with RLS, stamping triggers and realtime; adds `profiles.is_tech_manager` and the `is_tech_manager()` helper

---

## v2.4.2 — 2026-07-05

Seven bugs identified by code review and fixed.

### Bug Fixes

- **Project dialog:** success toast now fires only after both the project row and system assignments are saved — previously fired after the first write, misleading users if the second write failed
- **Project dialog:** Escape key and backdrop click no longer dismiss the dialog while a save is in flight — previously could leave a project with no system assignments
- **Project dialog:** system checkboxes now correctly default to all-checked when the dialog opens before the systems query has loaded — previously left all unchecked with no recovery path
- **Dashboard:** Overall totals now match the sum of per-system cards — previously items in systems removed from a project inflated Overall but were invisible in the breakdown
- **Delivery Notes:** DN number field now fills in when the sequence query resolves after the dialog opens — previously left blank, causing saves to use a raw integer instead of the formatted DN-XXX-YYYYMMDD-NNN string
- **Hooks:** `useProjectSystemKeys` and `useAllProjectSystems` now both set `staleTime: 30_000` — previously defaulted to 0, causing extra refetches on every window focus
- **Repo:** Added missing migration file `supabase/migrations/0014_project_systems.sql` — the table was applied via MCP but never committed, which would break any fresh clone

---

## v2.4.1 — 2026-07-01

Added "Save" button to the delivery note form — record a note without generating a PDF.

### Bug Fixes / Improvements

- Delivery note dialog now has three action buttons: Preview only, Save, and Save & print
- "Save" records the note to the database without opening the print dialog — for notes created externally or handed in on paper
- "Save & print" retains the previous behaviour (save + open PDF)
- "Preview only" still generates the PDF without saving

---

## v2.4.0 — 2026-07-01

Manual delivery note creation from the Delivery Notes page.

### Features

- New "New delivery note" button on the Delivery Notes page — opens the full delivery note form with all header fields and an empty item list
- All header fields are editable: DN number, date, PO, customer PO, deliver to, location, contact
- Add, edit, and remove line items freely before saving
- Preview / Print only option available (does not save to database)
- Save & generate saves to the database and opens the PDF
- Empty state updated to mention manual creation as an option

---

## v2.3.3 — 2026-07-01

Fixed stale delete dialog on tickets and added PO / VO document types.

### Bug Fixes

- Selecting a new ticket immediately after deleting one no longer shows the delete confirmation dialog
- Root cause: delete dialog state persisted in the sheet component between ticket switches

### Features

- Added PO and VO to the document type dropdown

---

## v2.3.2 — 2026-07-01

Fixed long file names overflowing the upload area in the document dialog.

### Bug Fixes

- Selected file names now wrap across multiple lines instead of overflowing the dialog edge

---

## v2.3.1 — 2026-07-01

Fixed dialogs overflowing horizontally when an input field contains a long value.

### Bug Fixes

- Document, Item, Ticket, Delivery Note, and Project dialogs no longer expand beyond their declared width
- Root cause: `<input>` elements have an intrinsic min-width that lets them grow past their container; adding `overflow-x: hidden` on the dialog clips this correctly

---

## v2.3.0 — 2026-07-01

Per-project system assignment — each project now has its own set of enabled systems.

### Features

- Admin → Projects: "Systems enabled for this project" checkbox list in the create/edit dialog
- Systems assigned to a project filter all system tabs (Tracker, Documents), dropdowns (Add/Edit item, Add document), and Dashboard stats
- Project rows in the admin panel show badges for each assigned system at a glance
- Default: all globally active systems are pre-selected when creating a new project
- Powered by a `project_systems` junction table with RLS — each project independently opts in to specific systems

---

## v2.2.4 — 2026-07-01

Fixed "No projects assigned" showing on every login without a page refresh.

### Bug Fixes

- Projects load correctly immediately after login
- Root cause: query ran pre-login, cached `[]`, then reused that stale empty result after auth
- Fix: user ID is now part of the query key; query is disabled when not authenticated

---

## v2.2.3 — 2026-07-01

Fixed account creation / password reset failing with "Failed to send a request to the Edge Function".

### Bug Fixes

- Redeployed admin-users Edge Function (v2 → v3) — bundle was corrupt/unretrievable
- Affects: Create account, Set password, Delete account, Edit username

---

## v2.2.2 — 2026-07-01

Fixed form state resetting on background re-renders caused by realtime subscriptions.

### Bug Fixes

- All dialogs (Project, Item, Ticket, Document, Delivery Note) now seed form only on open
- Switching system tabs while item dialog is open no longer wipes entered values
- Root cause: effect deps included query-cache objects with new references on every realtime push

---

## v2.2.1 — 2026-07-01

Fixed serial column alignment + improved DN mode with explicit toggle and sticky banner.

### Delivery Note

- Cart buttons hidden by default; "Delivery note" header button enters DN mode
- Sticky banner shows item count with Cancel and Generate actions
- Generating or cancelling exits DN mode and clears cart

### Fixes

- Serial column is now fixed-width so `0/22` and `1/1` align across all rows

---

## v2.2.0 — 2026-06-30

Cart-based delivery note flow — add items one by one with specific qty and serials before generating.

### Delivery Note
- Each item row/card now has a **PackagePlus** button to add it to a delivery cart
- Popover lets you set the quantity and pick specific serial numbers for that delivery
- Cart persists while you browse — add multiple items before generating
- Delivery note button shows cart size; disabled when cart is empty
- Mobile sticky banner shows cart count with Clear and Generate shortcuts
- Generating the DN clears the cart
- Removed the old all-or-nothing checkbox selection mode

---

## v2.1.0 — 2026-06-26

Feature inbox for admins + full Sonner toast coverage across the app.

### Admin
- New **Feature Inbox** drawer — subtle lightbulb icon button in the Admin header opens a right-hand sheet showing all submitted feature requests
- Filter by status (All / Pending / Planned / In Progress / Done / Rejected)
- Upvote requests to prioritise them; change status inline via a colored badge dropdown
- Pending count badge on the icon so nothing gets missed

### Toasts
- Every create, update, and delete action across the app now shows a success toast
- Previously missing: assign/remove project members, org/role/page-access changes, project & system toggles, comment posting, file date updates

## v1.4.0 — 2026-06-25

Carried the sign-in page's editorial design language across the whole app.

### Design System
- New shared `PageHeader` — Fraunces display-serif title with an orange eyebrow label, used on every page (Procurement, Documents, Delivery Notes, Admin, Dashboard, Tickets)
- App content now sits on a subtly tinted, dot-textured "canvas" so white cards feel elevated
- Consistent brand-orange/navy palette throughout

### Projects (landing)
- Redesigned post-login project picker into a hero: time-aware greeting ("Good morning/afternoon/evening"), large serif welcome, ambient brand glows
- Elevated project cards with hover lift, reveal-on-hover accent bar, animated arrow, and branded icon tiles

## v1.3.0 — 2026-06-25

Editorial redesign of the sign-in page with a brand-colored geometric art panel.

### Login Page
- Split-card layout: crystalline geometric artwork (blue / orange / navy / maroon brand palette) on the left, sign-in form on the right
- New Fraunces display serif for the headline ("Where Every Part Finds Its Place")
- Hand-built SVG art panel (`LoginArt`) — no image assets, scales crisply at any size
- Soft, minimal input fields; show/hide password toggle
- FIT logo + branding and version pinned to the footer; "Request a feature" lives inside the card
- Mobile: art renders as a top banner that fades into the form

### Theme
- Registered Fraunces as the `--font-display` / `font-display` family

## v1.2.0 — 2026-06-25

In-browser file viewer for Documents — no download needed to review files.

### File Viewer
- PDF: full PDF.js viewer with page navigation (← →), zoom (50%–300%), page counter, keyboard arrow navigation, and a Download button
- CSV / XLSX / XLS: spreadsheet viewer with a scrollable table, row numbers, sheet tabs for multi-sheet Excel files, row/column count footer, and a 1,000-row cap with a notice for large files
- Eye icon on each file in the Documents drawer opens the viewer in a full-screen modal (95vw × 92vh)
- Loading spinner while the signed URL is being fetched; error state if the file fails to load

## v1.1.0 — 2026-06-25

Internal support ticket tracking for the team.

### Support Tickets (new page)
- New Tickets page accessible to all non-firstfix team members
- Create tickets with title, description, category (AV / PAVA / IPTV / Screens / Network / Power / Access Control / General / Other), and priority (Low / Medium / High / Critical)
- Ticket ID auto-generated from project name initials: `[PREFIX]-TKT-[YEAR]-[NNN]` — e.g. `MIC-TKT-2026-001`, per-project sequence, collision-safe via advisory lock
- Project field accepts a registered project (pre-fills site contact and location) **or** any free-text name for old/unregistered projects
- Site contact, phone, and location fields per ticket
- Assign tickets to any team member
- Status flow: Open → In Progress → Pending → Resolved → Closed; quick-change pills in the detail view
- Comment thread on each ticket with bubble-style chat UI (Cmd+Enter to send)
- Delete with confirmation dialog
- List view with search + status / priority / category filters

## v1.0.0 — 2026-06-25

First stable release. Full procurement coordination platform for MiSK Ilmi Campus AV/IT systems.

### Per-unit serial number tracking
- Each item tracks one serial number per physical unit, driven by qty_required
- Serial inputs appear in the item edit dialog (Unit 1, Unit 2…), auto-save on blur
- Detail sheet (read-only preview) shows all serial slots with filled/total badge
- Tracker table: expandable serial sub-row toggled by a Hash button on each row, shows N/M count
- Cards (mobile): full-width "Serial Numbers" toggle at the bottom of each card
- Delivery Note dialog auto-populates serial fields from recorded serials when opened

### Brand and model filters
- Separate Brand and Model dropdowns in the Tracker toolbar (desktop)
- Both included in the clear-all action

### Comprehensive seed data
- 22 realistic items across AV, PAVA, IPTV and SCREENS systems
- 38 serial number rows for delivered units
- 8 documents with varied types and review codes
- 3 delivery notes with pre-filled serials

---

## v0.4.0 — 2026-06-25

Project details hub with pre-fill across all forms. Navigation moved to top bar. Docs page expanded with visual content.

### Project details
- Projects now store client name, our PO, client PO, site location, and site contact
- Admin → Projects section has a full create/edit dialog for all project fields
- Project detail values shown inline under each project row in the admin panel

### Pre-fill
- Delivery Note dialog auto-fills PO numbers, deliver-to, location, and contact from the current project
- Add item dialog pre-fills location from the project's site location

### Navigation
- Sidebar replaced with a sticky top navigation bar (desktop)
- Mobile keeps a slide-in sheet; logo and project switcher on the left
- Theme toggle and user menu on the right with Changelog/Docs in the dropdown

### Docs page
- Navigation moved to two sticky rows at the top (section tabs + sub-page tabs)
- Added sections: Quick Reference, Control Systems, DSP & Audio, Wireless Mics, Video Conferencing, Electrical & Power, Vendors & Brands, Project Documentation
- Visual elements: stat grids, progress bars, formula blocks, Accordion vendor breakdowns, tabbed system comparisons
- Callout components for notes, warnings, and tips

### Accessibility & feedback
- Tooltips added to all icon-only buttons (Tracker, Documents, Document Drawer, Admin, Delivery Notes)
- Sonner toast notifications throughout — project switch, sign out, create/update/delete confirmations

---

## v0.3.0 — 2026-06-24

UI/UX improvements across Procurement and Documents.

### Procurement — Item Cards (mobile)
- Complete card redesign: clear three-zone layout — identity top, labeled status
  grid middle, footer attribution
- Status grid shows three columns (Procurement / Delivery / Installation) each
  with a category label above the badge — no more ambiguous unlabeled badges
- Brand · Model is now the headline; description removed from list view
  (still visible inside the detail sheet)
- Unique ID displayed as bold primary-colour monospace next to system badge
- Location on its own row with pin icon
- Subtle scale animation on tap for mobile feedback

### Procurement — Item Table (desktop)
- Status badges are now in a horizontal row (`Ordered · Partial · In progress`)
  instead of stacked vertically — consistent row height across all items
- On medium screens only the delivery status badge is shown to avoid crowding;
  all three appear at large breakpoint and above
- Description removed from list view; attribution line simplified

### Documents
- New "Document type" field — dropdown with 11 types: Shop Drawing, Schematic,
  O&M Manual, Training Manual, Method Statement, Commissioning Report,
  Submittal, As-Built, Inspection Request, RFI, Other
- Type badge shown on each document card
- New "All types" filter dropdown on the Documents page

### Delivery Notes
- Separate Delivery Notes page with search and date range filters
- Auto-naming: `DN-[PROJECT_INITIALS]-[YYYYMMDD]-[NNN]`

---

## v0.2.0 — 2026-06-24

Delivery note generation from procurement items.

### Delivery Notes
- New "Delivery note" button on the Procurement page enters a selection mode —
  tick the items being delivered, then "Generate"
- Pre-fills a form from the selected items (description from brand/model,
  quantity, serial from Unique ID); all fields editable, lines can be added/removed
- Generates a print-perfect PDF matching the Frontline Solutions template
  (orange/navy branding, logo, T&C, signature blocks) via the browser's
  Save-as-PDF — no extra libraries
- Auto-incrementing per-project delivery number (atomic, conflict-safe)
- Each generated note is saved to the database with a snapshot of its items
- "Preview / Print only" option to generate without saving

### Fixes
- Fixed item ordering query still referencing the old `sno` column (renamed to
  `unique_id` in v0.1) — Procurement list now sorts correctly again

---

## v0.1.0 — 2026-06-24

**Initial production release.**

### Procurement
- Line-item tracker with system tabs (AV, PAVA, IPTV, Screens + custom)
- Compact row list — click any row to open a detail sheet (quantities, statuses, notes)
- Edit / History / Delete from the detail sheet
- Unique ID field (any string, e.g. SN-001) replaces the old numeric S.No
- Real-time updates across all connected clients
- CSV import (supports custom systems by key or label) and export
- Optimistic concurrency guard — conflicts are caught and shown, never silently lost
- Full edit history per item

### Documents
- Document register with stacked file uploads (every revision kept)
- Per-file date picker, rev label, notes, inline PDF preview
- Status codes: Pending → Under Review → Code A/B/C
- Bulk status update (select multiple → apply status)
- Comments thread per document
- Real-time file count badges

### Dashboard
- Quantity progress bars per system (ordered / delivered / installed vs required)
- Item-count analytics by procurement, delivery and installation status
- Overdue ETA alert panel

### Admin
- Create / delete accounts; reset passwords
- Edit user full name and username (updates auth login)
- Assign org (Frontline / First Fix) and role (Member / Admin)
- Per-user page access control (Tracker, Documents, Dashboard)
- Multi-project support — create projects, assign users, admins see all
- Systems management — add custom systems, activate / deactivate

### Platform
- shadcn/ui with Tailwind v4, React 19, Vite 8, TypeScript 6
- Supabase Postgres + Auth + Realtime + Storage + Edge Functions
- GitHub Pages hosting via GitHub Actions CI/CD
- Dark / light theme toggle
- Mobile-responsive (card view on phones, row list on desktop)
- Self-service password change from user menu
