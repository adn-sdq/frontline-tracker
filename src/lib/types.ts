// Systems are now editable in the DB (see the `systems` table / Admin page).
// These remain only as defaults / fallback labels.
export type System = string

export const DEFAULT_SYSTEM_KEYS = ["AV", "PAVA", "IPTV", "SCREENS"] as const

export const SYSTEM_LABELS: Record<string, string> = {
  AV: "AV",
  PAVA: "PAVA",
  IPTV: "IPTV",
  SCREENS: "Screens",
}

export interface SystemRow {
  key: string
  label: string
  sort: number
  active: boolean
  created_at: string
}

export const PROCUREMENT_STATUSES = [
  "not_started",
  "quoted",
  "po_issued",
  "ordered",
] as const
export type ProcurementStatus = (typeof PROCUREMENT_STATUSES)[number]

export const DELIVERY_STATUSES = ["pending", "partial", "delivered"] as const
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number]

export const INSTALLATION_STATUSES = [
  "not_started",
  "in_progress",
  "installed",
  "commissioned",
] as const
export type InstallationStatus = (typeof INSTALLATION_STATUSES)[number]

export const STATUS_LABELS: Record<string, string> = {
  not_started: "Not started",
  quoted: "Quoted",
  po_issued: "PO issued",
  ordered: "Ordered",
  pending: "Pending",
  partial: "Partial",
  delivered: "Delivered",
  in_progress: "In progress",
  installed: "Installed",
  commissioned: "Commissioned",
}

// Tailwind classes per status for color-coded badges.
export const STATUS_STYLES: Record<string, string> = {
  not_started: "bg-muted text-muted-foreground border-transparent",
  quoted: "bg-amber-100 text-amber-800 border-transparent dark:bg-amber-950 dark:text-amber-300",
  po_issued: "bg-blue-100 text-blue-800 border-transparent dark:bg-blue-950 dark:text-blue-300",
  ordered: "bg-violet-100 text-violet-800 border-transparent dark:bg-violet-950 dark:text-violet-300",
  pending: "bg-muted text-muted-foreground border-transparent",
  partial: "bg-amber-100 text-amber-800 border-transparent dark:bg-amber-950 dark:text-amber-300",
  delivered: "bg-emerald-100 text-emerald-800 border-transparent dark:bg-emerald-950 dark:text-emerald-300",
  in_progress: "bg-blue-100 text-blue-800 border-transparent dark:bg-blue-950 dark:text-blue-300",
  installed: "bg-emerald-100 text-emerald-800 border-transparent dark:bg-emerald-950 dark:text-emerald-300",
  commissioned: "bg-emerald-600 text-white border-transparent",
}

export interface Item {
  id: string
  project_id: string
  system: System
  location: string | null
  unique_id: string | null
  brand: string | null
  model_no: string | null
  description: string | null
  qty_required: number
  qty_ordered: number
  qty_delivered: number
  qty_installed: number
  procurement_status: ProcurementStatus
  delivery_status: DeliveryStatus
  installation_status: InstallationStatus
  supplier: string | null
  eta: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_by: string | null
  updated_at: string
  version: number
}

export type ItemPatch = Partial<
  Pick<
    Item,
    | "system"
    | "location"
    | "unique_id"
    | "brand"
    | "model_no"
    | "description"
    | "qty_required"
    | "qty_ordered"
    | "qty_delivered"
    | "qty_installed"
    | "procurement_status"
    | "delivery_status"
    | "installation_status"
    | "supplier"
    | "eta"
    | "notes"
  >
>

export const ORGS = ["frontline", "firstfix"] as const
export type Org = (typeof ORGS)[number]
export const ORG_LABELS: Record<string, string> = {
  frontline: "Frontline",
  firstfix: "First Fix",
}

export interface Project {
  id: string
  name: string
  description: string | null
  sort: number
  active: boolean
  created_by: string | null
  created_at: string
}

export interface ProjectMember {
  project_id: string
  user_id: string
  created_at: string
}

// Pages that can be individually granted/revoked per frontline user.
// Admins see all pages; firstfix users only see "documents" regardless.
export const APP_PAGES = ["tracker", "documents", "dashboard"] as const
export type AppPage = (typeof APP_PAGES)[number]
export const APP_PAGE_LABELS: Record<AppPage, string> = {
  tracker: "Procurement",
  documents: "Documents",
  dashboard: "Dashboard",
}

export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  role: string
  org: Org | null
  is_admin: boolean
  allowed_pages: string[] | null
  created_at: string
}

// ---- Documents ----------------------------------------------------------
export const DOC_TYPES = [
  "shop_drawing",
  "schematic",
  "om_manual",
  "training_manual",
  "method_statement",
  "commissioning_report",
  "submittal",
  "as_built",
  "inspection_request",
  "rfi",
  "other",
] as const
export type DocType = (typeof DOC_TYPES)[number]

export const DOC_TYPE_LABELS: Record<string, string> = {
  shop_drawing: "Shop Drawing",
  schematic: "Schematic",
  om_manual: "O&M Manual",
  training_manual: "Training Manual",
  method_statement: "Method Statement",
  commissioning_report: "Commissioning Report",
  submittal: "Submittal",
  as_built: "As-Built",
  inspection_request: "Inspection Request",
  rfi: "RFI",
  other: "Other",
}

export const DOC_STATUSES = [
  "pending",
  "under_review",
  "code_a",
  "code_b",
  "code_c",
] as const
export type DocStatus = (typeof DOC_STATUSES)[number]

export const DOC_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  under_review: "Under review",
  code_a: "Code A",
  code_b: "Code B",
  code_c: "Code C",
}

export const DOC_STATUS_HINTS: Record<string, string> = {
  pending: "Awaiting review",
  under_review: "Being reviewed by Frontline",
  code_a: "Approved — no comments",
  code_b: "Approved with comments",
  code_c: "Revise & resubmit",
}

export const DOC_STATUS_STYLES: Record<string, string> = {
  pending: "bg-muted text-muted-foreground border-transparent",
  under_review:
    "bg-blue-100 text-blue-800 border-transparent dark:bg-blue-950 dark:text-blue-300",
  code_a: "bg-emerald-600 text-white border-transparent",
  code_b:
    "bg-amber-100 text-amber-800 border-transparent dark:bg-amber-950 dark:text-amber-300",
  code_c:
    "bg-red-100 text-red-800 border-transparent dark:bg-red-950 dark:text-red-300",
}

export interface DocumentRow {
  id: string
  project_id: string
  title: string
  doc_number: string | null
  system: string | null
  description: string | null
  status: DocStatus
  doc_type: DocType | null
  revision: string | null
  created_by: string | null
  created_at: string
  updated_by: string | null
  updated_at: string
  version: number
}

export interface DocumentFile {
  id: string
  document_id: string
  storage_path: string
  file_name: string
  file_size: number | null
  rev_label: string | null
  note: string | null
  dated: string
  uploaded_by: string | null
  uploaded_at: string
}

export interface DocumentComment {
  id: number
  document_id: string
  body: string
  code: string | null
  author: string | null
  created_at: string
}

// ---- Delivery notes -----------------------------------------------------
export interface DeliveryNoteItem {
  description: string
  qty: number
  serial: string
}

export interface DeliveryNote {
  id: string
  project_id: string
  seq: number
  dn_number: string
  dn_date: string
  po: string | null
  customer_po: string | null
  deliver_to: string | null
  location: string | null
  contact: string | null
  items: DeliveryNoteItem[]
  notes: string | null
  generated_by: string | null
  generated_at: string
}

export interface ItemHistory {
  id: number
  item_id: string
  action: "create" | "update" | "delete"
  changed_by: string | null
  changed_at: string
  diff: Record<string, { old: unknown; new: unknown }> | null
  snapshot: Record<string, unknown> | null
}

export interface ItemFile {
  id: string
  item_id: string
  storage_path: string
  file_name: string
  file_size: number | null
  note: string | null
  dated: string
  uploaded_by: string | null
  uploaded_at: string
}
