import { esc, printHtml } from "@/lib/print"

export interface LabelData {
  tag: string
  /** URL/text the QR encodes (already built). */
  qrSvg: string
  sku: string
  title: string
  serial: string | null
  /** "Unit 2 of 5" / "Lot · 40 pcs" */
  caption: string
  projectCode: string
}

/** Printable A4 sheet of QR labels, three across. Cut along the dashed lines. */
export function buildLabelsHtml(labels: LabelData[]): string {
  const cells = labels
    .map(
      (l) => `
    <div class="label">
      <div class="qr">${l.qrSvg}</div>
      <div class="txt">
        <div class="brand">Frontline${l.projectCode ? ` &middot; ${esc(l.projectCode)}` : ""}</div>
        <div class="tag">${esc(l.tag)}</div>
        <div class="title">${esc(l.title || "—")}</div>
        <div class="foot"><span>${esc(l.caption)}</span><span>S/N ${l.serial ? esc(l.serial) : "&mdash;"}</span></div>
      </div>
    </div>`
    )
    .join("")

  return `<!doctype html>
<html><head><meta charset="utf-8" /><title>QR labels</title>
<style>
  @page { size: A4; margin: 8mm; }
  * { box-sizing: border-box; border-radius: 0 !important; }
  body { margin: 0; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .sheet { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2mm; }
  .label { display: flex; align-items: center; gap: 3mm; height: 30mm; padding: 2.5mm 3mm; border: 0.25mm solid #000; background: #fff; break-inside: avoid; overflow: hidden; }
  .qr { width: 23mm; height: 23mm; flex: none; }
  .qr svg { width: 100%; height: 100%; display: block; }
  .txt { min-width: 0; flex: 1; display: flex; flex-direction: column; justify-content: center; line-height: 1.2; }
  .brand { font-size: 5.5pt; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #555; }
  .tag { font-size: 11.5pt; font-weight: 800; letter-spacing: 0.02em; margin-top: 0.6mm; white-space: nowrap; }
  .title { font-size: 7pt; font-weight: 500; margin-top: 0.8mm; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .foot { display: flex; justify-content: space-between; gap: 2mm; margin-top: 1.4mm; padding-top: 1mm; border-top: 0.2mm solid #999; font-size: 5.8pt; color: #333; white-space: nowrap; }
  .foot span:last-child { overflow: hidden; text-overflow: ellipsis; }
</style></head>
<body><div class="sheet">${cells}</div></body></html>`
}

export function printLabels(labels: LabelData[]): void {
  printHtml(buildLabelsHtml(labels))
}
