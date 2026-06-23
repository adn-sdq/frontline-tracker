import Papa from "papaparse"

import { STATUS_LABELS, type Item, type SystemRow } from "@/lib/types"

const EXPORT_COLUMNS: { key: keyof Item; header: string }[] = [
  { key: "system", header: "System" },
  { key: "location", header: "Location" },
  { key: "unique_id", header: "Unique ID" },
  { key: "brand", header: "Brand" },
  { key: "model_no", header: "Model No" },
  { key: "description", header: "Description" },
  { key: "qty_required", header: "Required" },
  { key: "qty_ordered", header: "Ordered" },
  { key: "qty_delivered", header: "Delivered" },
  { key: "qty_installed", header: "Installed" },
  { key: "procurement_status", header: "Procurement" },
  { key: "delivery_status", header: "Delivery" },
  { key: "installation_status", header: "Installation" },
  { key: "supplier", header: "Supplier" },
  { key: "eta", header: "ETA" },
  { key: "notes", header: "Notes" },
]

export function exportItemsCsv(items: Item[], filename = "frontline-tracker.csv") {
  const rows = items.map((i) => {
    const row: Record<string, unknown> = {}
    for (const col of EXPORT_COLUMNS) {
      const v = i[col.key]
      row[col.header] =
        col.key.endsWith("_status") && typeof v === "string"
          ? STATUS_LABELS[v] ?? v
          : v ?? ""
    }
    return row
  })
  const csv = Papa.unparse(rows)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const IMPORT_TEMPLATE =
  "system,location,unique_id,brand,model_no,description,qty_required,supplier,eta,notes\n" +
  "AV,L03-005,AV-001,Samsung,LH85QMCEBGCXUE,85\" Smart Signage Display,3,,,\n"

const SYSTEM_ALIASES: Record<string, Item["system"]> = {
  av: "AV",
  "audio visual": "AV",
  "audio-visual": "AV",
  pava: "PAVA",
  "pa": "PAVA",
  iptv: "IPTV",
  screens: "SCREENS",
  screen: "SCREENS",
  display: "SCREENS",
}

export interface ParsedImport {
  rows: Partial<Item>[]
  errors: string[]
}

const num = (v: unknown) => {
  const n = Number(v)
  return Number.isNaN(n) ? 0 : n
}

export function parseImportCsv(text: string, knownSystems?: SystemRow[]): ParsedImport {
  const result = Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  })
  const errors: string[] = []
  const rows: Partial<Item>[] = []

  // Build a lookup: lowercase key/label → canonical key
  const systemLookup: Record<string, string> = {}
  if (knownSystems?.length) {
    for (const s of knownSystems) {
      systemLookup[s.key.toLowerCase()] = s.key
      systemLookup[s.label.toLowerCase()] = s.key
    }
  }
  // Always include static aliases as fallback
  for (const [alias, key] of Object.entries(SYSTEM_ALIASES)) {
    if (!systemLookup[alias]) systemLookup[alias] = key
  }

  result.data.forEach((raw, idx) => {
    const line = idx + 2
    const sysRaw = (raw.system ?? "").trim()
    const system = systemLookup[sysRaw.toLowerCase()] ?? (sysRaw ? sysRaw.toUpperCase() : null)
    if (!system) {
      errors.push(`Row ${line}: missing system value`)
      return
    }
    rows.push({
      system,
      location: raw.location?.trim() || null,
      unique_id: (raw.unique_id ?? raw.sno ?? raw["s.no"])?.trim() || null,
      brand: raw.brand?.trim() || null,
      model_no: (raw.model_no ?? raw.model_number ?? raw.model)?.trim() || null,
      description: raw.description?.trim() || null,
      qty_required: num(raw.qty_required ?? raw.required ?? raw.qty),
      qty_ordered: num(raw.qty_ordered ?? raw.ordered),
      qty_delivered: num(raw.qty_delivered ?? raw.delivered),
      qty_installed: num(raw.qty_installed ?? raw.installed),
      supplier: raw.supplier?.trim() || null,
      eta: raw.eta?.trim() || null,
      notes: raw.notes?.trim() || null,
    })
  })

  return { rows, errors }
}
