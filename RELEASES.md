# Frontline Tracker — Release Notes

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
