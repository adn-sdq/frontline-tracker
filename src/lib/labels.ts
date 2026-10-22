import { esc, printHtml } from "@/lib/print"

export interface LabelData {
  tag: string
  /** Styled QR as an SVG string. */
  qrSvg: string
  projectName: string
  projectCode: string
  system: string
  /** Brand · model */
  title: string
  description: string | null
  serial: string | null
  /** "Unit 2 of 5" / "Lot · 40 pcs" */
  caption: string
}

const STYLE = `
  /* Generous page margins so the first row isn't on the paper edge and sheets
     survive printers that can't print edge-to-edge. */
  @page { size: A4; margin: 15mm 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #000; background: #fff;
    font-family: -apple-system, "SF Pro Text", "Segoe UI", Inter, "Helvetica Neue", Helvetica, Arial, sans-serif;
    -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .sheet { display: grid; grid-template-columns: repeat(2, 1fr); gap: 5mm; }
  @media screen { body { padding: 15mm 12mm; } }
  .label { display: flex; gap: 3.5mm; height: 40mm; padding: 3mm; border: 0.3mm solid #000; border-radius: 3mm;
    break-inside: avoid; overflow: hidden; background: #fff; }
  .qr { width: 34mm; height: 34mm; flex: none; }
  .qr svg { width: 100%; height: 100%; display: block; }
  .body { min-width: 0; flex: 1; display: flex; flex-direction: column; }
  .top { display: flex; justify-content: space-between; align-items: center; gap: 2mm;
    font-size: 5.6pt; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; }
  .pill { border: 0.25mm solid #000; border-radius: 99px; padding: 0.3mm 1.6mm; letter-spacing: 0.06em; white-space: nowrap; }
  .project { font-size: 6.6pt; margin-top: 0.8mm; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tag { font-size: 13pt; font-weight: 700; letter-spacing: 0.01em; margin-top: 1.4mm; line-height: 1.05;
    font-variant-numeric: tabular-nums; white-space: nowrap; }
  .title { font-size: 7.6pt; font-weight: 600; margin-top: 1.2mm; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .desc { font-size: 6.4pt; margin-top: 0.4mm; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0.75; }
  .foot { margin-top: auto; padding-top: 1.2mm; border-top: 0.25mm solid #000; display: flex; justify-content: space-between;
    gap: 2mm; font-size: 6pt; font-variant-numeric: tabular-nums; }
  .foot b { font-weight: 600; }
  .foot span:first-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .foot span:last-child { white-space: nowrap; }
`

function labelHtml(l: LabelData) {
  return `
  <div class="label">
    <div class="qr">${l.qrSvg}</div>
    <div class="body">
      <div class="top"><span>Frontline</span><span class="pill">${esc(l.system)}</span></div>
      <div class="project">${esc(l.projectName)}${l.projectCode ? ` · ${esc(l.projectCode)}` : ""}</div>
      <div class="tag">${esc(l.tag)}</div>
      <div class="title">${esc(l.title || "—")}</div>
      ${l.description ? `<div class="desc">${esc(l.description)}</div>` : ""}
      <div class="foot"><span>S/N <b>${l.serial ? esc(l.serial) : "—"}</b></span><span>${esc(l.caption)}</span></div>
    </div>
  </div>`
}

/** Printable A4 sheet of rounded, black-and-white labels, two across. */
export function buildLabelsHtml(labels: LabelData[]): string {
  return `<!doctype html><html><head><meta charset="utf-8" /><title>FIT labels</title><style>${STYLE}</style></head>
<body><div class="sheet">${labels.map(labelHtml).join("")}</div></body></html>`
}

export function printLabels(labels: LabelData[]): void {
  printHtml(buildLabelsHtml(labels))
}
