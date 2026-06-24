import { FRONTLINE_LOGO_DATA_URL } from "@/assets/frontlineLogo"
import type { DeliveryNoteItem } from "@/lib/types"

export interface DeliveryNotePrintData {
  dnNumber: string
  date: string // yyyy-MM-dd
  projectName: string
  po: string
  customerPo: string
  deliverTo: string
  location: string
  contact: string
  items: DeliveryNoteItem[]
}

const NAVY = "#1f3a5f"
const ORANGE = "#e8702a"

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

// Multi-line cell content (serials, descriptions) → <br>-separated HTML.
function multiline(s: string): string {
  return esc(s).replace(/\r?\n/g, "<br>")
}

function fmtDate(iso: string): string {
  if (!iso) return ""
  const [y, m, d] = iso.split("-")
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

const TERMS = [
  "By signing this delivery note, the receiver confirm that all hardware has been received in full and good condition.",
  "Any missing or damaged items must be reported and noted on the delivery note before signing.",
  "The customer is responsible for ensuring proper storage and handling of the delivered items after receipt.",
  "Warranty coverage shall be subject to the terms and conditions stated in the relevant contract or warranty certificate.",
  "This delivery note does not constitute an invoice or proof of payment.",
]

// Always render at least this many item rows so the layout matches the
// printed template even for short deliveries.
const MIN_ROWS = 5

function buildHtml(d: DeliveryNotePrintData): string {
  const rows = [...d.items]
  while (rows.length < MIN_ROWS) {
    rows.push({ description: "", qty: 0, serial: "" })
  }

  const itemRows = rows
    .map((it, i) => {
      const hasContent = it.description || it.serial || it.qty
      return `
      <tr>
        <td class="c-no">${hasContent ? i + 1 : ""}</td>
        <td class="c-desc">${multiline(it.description)}</td>
        <td class="c-qty">${hasContent && it.qty ? it.qty : ""}</td>
        <td class="c-serial">${multiline(it.serial)}</td>
      </tr>`
    })
    .join("")

  const termRows = TERMS.map(
    (t, i) => `
      <tr>
        <td class="t-no">${i + 1}</td>
        <td class="t-text">${esc(t)}</td>
      </tr>`
  ).join("")

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Delivery Note ${esc(d.dnNumber)}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    color: #1a1a1a;
    font-size: 11px;
    line-height: 1.35;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .sheet { width: 100%; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #2b2b2b; padding: 4px 6px; vertical-align: top; }

  .topbar {
    background: ${ORANGE};
    color: #fff;
    text-align: center;
    font-weight: 700;
    letter-spacing: 1px;
    font-size: 12px;
    padding: 4px;
    border: 1px solid #2b2b2b;
    border-bottom: none;
  }
  .brandrow { border: 1px solid #2b2b2b; border-bottom: none; line-height: 0; }
  .brandrow img { width: 100%; height: auto; display: block; }

  .band {
    background: ${NAVY}; color: #fff; font-weight: 700; font-size: 12px;
    padding: 4px 8px; border: 1px solid #2b2b2b; border-bottom: none;
  }

  .info td { padding: 0; }
  .info .label-cell { background: #fff; font-weight: 700; width: 22%; padding: 4px 6px; }
  .info .contact-cell { width: 50%; white-space: pre-line; padding: 6px 8px; vertical-align: middle; }
  .info .contact-head { background: #f0f0f0; font-weight: 700; text-align: center; }
  .kv td { padding: 4px 6px; }
  .kv .k { font-weight: 700; width: 42%; }

  .deliverto td { padding: 4px 6px; }
  .deliverto .k { font-weight: 700; width: 22%; }

  .items th {
    background: ${NAVY}; color: #fff; font-weight: 700; text-align: center;
    font-size: 11px;
  }
  .items .c-no { width: 6%; text-align: center; }
  .items .c-desc { width: 46%; font-weight: 600; }
  .items .c-qty { width: 14%; text-align: center; }
  .items .c-serial { width: 34%; }
  .items td { height: 30px; }

  .terms .t-no { width: 6%; text-align: center; }
  .terms .t-text { width: 94%; }

  .sign td { height: 54px; vertical-align: top; padding: 6px 8px; }
  .sign .k { font-weight: 700; width: 14%; vertical-align: top; }

  .nobottom { border-bottom: none; }
</style>
</head>
<body>
  <div class="sheet">
    <div class="topbar">FRONTLINE SOLUTIONS</div>
    <div class="brandrow">
      <img src="${FRONTLINE_LOGO_DATA_URL}" alt="Frontline Solutions" />
    </div>

    <div class="band">DELIVERY NOTE</div>

    <table class="info">
      <tr>
        <td class="contact-head" style="width:50%">COMPANY CONTACT</td>
        <td class="label-cell">Delivery Number</td>
        <td>${esc(d.dnNumber)}</td>
      </tr>
      <tr>
        <td class="contact-cell" rowspan="4">Frontline Investment Company
شركة الخط الأمامي للإستثمار
P.O. Box: 200435 Riyadh, Saudi Arabia
Tel.: +96611 288 2999
VAT: 302007992700003
https://frontlinesolution.com</td>
        <td class="label-cell">Project Name</td>
        <td>${esc(d.projectName)}</td>
      </tr>
      <tr>
        <td class="label-cell">PO</td>
        <td>${esc(d.po)}</td>
      </tr>
      <tr>
        <td class="label-cell">Customer PO</td>
        <td>${esc(d.customerPo)}</td>
      </tr>
      <tr>
        <td class="label-cell">Date</td>
        <td>${esc(fmtDate(d.date))}</td>
      </tr>
    </table>

    <div class="band">Delivery to:</div>
    <table class="deliverto">
      <tr><td class="k">Delivery to:</td><td>${esc(d.deliverTo)}</td></tr>
      <tr><td class="k">Location:</td><td>${esc(d.location)}</td></tr>
      <tr><td class="k">Contact:</td><td>${esc(d.contact)}</td></tr>
    </table>

    <table class="items">
      <thead>
        <tr>
          <th class="c-no">No.</th>
          <th class="c-desc">Item Description</th>
          <th class="c-qty">Quantity</th>
          <th class="c-serial">Serial Number</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div class="band" style="margin-top:0">Terms and Conditions</div>
    <table>
      <tr><td style="text-align:center;font-style:italic">For General Terms and Conditions please refer to attached Frontline Solution T&amp;C</td></tr>
    </table>
    <div class="band">Project Terms and Conditions and Scope of Work:</div>
    <table class="terms"><tbody>${termRows}</tbody></table>

    <table class="sign">
      <tr>
        <td class="k">Delivered By</td><td></td>
        <td class="k">Checked By</td><td></td>
      </tr>
      <tr>
        <td class="k">Signature</td><td></td>
        <td class="k">Signature</td><td></td>
      </tr>
      <tr>
        <td class="k">Date</td><td></td>
        <td class="k">Date</td><td></td>
      </tr>
    </table>
  </div>
</body>
</html>`
}

// Render the delivery note in a hidden iframe and trigger the browser's print
// dialog (Save as PDF). Using an iframe avoids popup blockers.
export function printDeliveryNote(data: DeliveryNotePrintData): void {
  const html = buildHtml(data)
  const iframe = document.createElement("iframe")
  iframe.style.position = "fixed"
  iframe.style.right = "0"
  iframe.style.bottom = "0"
  iframe.style.width = "0"
  iframe.style.height = "0"
  iframe.style.border = "0"
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc) {
    document.body.removeChild(iframe)
    return
  }
  doc.open()
  doc.write(html)
  doc.close()

  const win = iframe.contentWindow!
  const cleanup = () => {
    setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
    }, 1000)
  }

  // Wait for the embedded logo to load before printing.
  const triggerPrint = () => {
    win.focus()
    win.print()
    cleanup()
  }

  const img = doc.querySelector("img")
  if (img && !img.complete) {
    img.addEventListener("load", triggerPrint, { once: true })
    img.addEventListener("error", triggerPrint, { once: true })
    // Safety fallback in case neither event fires.
    setTimeout(triggerPrint, 1500)
  } else {
    setTimeout(triggerPrint, 200)
  }
}
