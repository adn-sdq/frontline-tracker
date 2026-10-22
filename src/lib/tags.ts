import { styledQrSvg } from "@/lib/qrStyled"

/**
 * Tags identify what a QR label points at.
 *   lot tag  = the SKU itself            "MP-0042"      (accessories, one label per line)
 *   unit tag = SKU + 2-digit unit number "MP-0042-03"   (devices, one label per unit)
 * They are derived, so a label can be printed before a serial number is known.
 *
 * The QR holds a FIT link (…/#/t/<tag>). Opening it requires signing in, and
 * row-level security only shows the unit to members of its project — anyone
 * else just sees a sign-in page or "not found".
 */
const PREFIX = "FIT:"

export function unitTag(sku: string, unit: number): string {
  return `${sku}-${String(unit).padStart(2, "0")}`
}

export function parseTag(raw: string): { sku: string; unit: number | null } {
  const tag = raw.trim().toUpperCase()
  const m = /^(.+-\d{4,})-(\d{1,3})$/.exec(tag)
  return m ? { sku: m[1], unit: Number(m[2]) } : { sku: tag, unit: null }
}

/** What the QR encodes: the tracking link for this tag. */
export function qrPayload(tag: string): string {
  return `${window.location.origin}${window.location.pathname}#/t/${encodeURIComponent(tag)}`
}

/** Accepts a scanned payload, a typed tag/SKU, or a serial number; returns the bare text. */
export function extractTag(scanned: string): string {
  const s = scanned.trim()
  if (s.toUpperCase().startsWith(PREFIX)) return s.slice(PREFIX.length).trim()
  const legacy = /#\/[tu]\/([^?#\s]+)/.exec(s)
  return legacy ? decodeURIComponent(legacy[1]) : s
}

export function qrSvg(text: string): Promise<string> {
  return Promise.resolve(styledQrSvg(text))
}
