# Frontline Tracker — Release Notes

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
