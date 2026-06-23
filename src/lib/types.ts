export const SYSTEMS = ["AV", "PAVA", "IPTV", "SCREENS"] as const
export type System = (typeof SYSTEMS)[number]

export const SYSTEM_LABELS: Record<System, string> = {
  AV: "AV",
  PAVA: "PAVA",
  IPTV: "IPTV",
  SCREENS: "Screens",
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
  system: System
  location: string | null
  sno: number | null
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
    | "sno"
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

export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  role: string
  created_at: string
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
