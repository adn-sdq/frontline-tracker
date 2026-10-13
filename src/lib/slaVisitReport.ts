import { FRONTLINE_LOGO_DATA_URL } from "@/assets/frontlineLogo"
import { esc, fmtPrintDate, multiline, printHtml } from "@/lib/print"
import { periodLabel } from "@/lib/sla"
import {
  SLA_ISSUE_STATUS_LABELS,
  SLA_SEVERITY_LABELS,
  type SlaContract,
  type SlaIssue,
  type SlaVisit,
} from "@/lib/types"

export interface VisitReportData {
  contract: SlaContract
  visit: SlaVisit
  technicianNames: string[]
  leadName: string
  carriedOver: SlaIssue[]
  foundThisVisit: SlaIssue[]
}

const NAVY = "#1f3a5f"
const ORANGE = "#e8702a"
const MIN_ROWS = 4

function issueRows(issues: SlaIssue[], startAt = 1): string {
  const rows = issues.map(
    (i, n) => `
      <tr>
        <td class="c-no">${startAt + n}</td>
        <td class="c-desc"><b>${esc(i.title)}</b>${i.description ? `<br>${multiline(i.description)}` : ""}${i.location ? `<br><i>${esc(i.location)}</i>` : ""}</td>
        <td class="c-sev">${SLA_SEVERITY_LABELS[i.severity]}</td>
        <td class="c-status">${SLA_ISSUE_STATUS_LABELS[i.status]}</td>
        <td class="c-act">${i.resolution ? multiline(i.resolution) : ""}</td>
      </tr>`
  )
  while (rows.length < MIN_ROWS) {
    rows.push(`<tr><td class="c-no"></td><td></td><td></td><td></td><td></td></tr>`)
  }
  return rows.join("")
}

function buildHtml(d: VisitReportData): string {
  const { contract: c, visit: v } = d
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>SLA Visit Report — ${esc(c.name)} — ${esc(periodLabel(v.period))}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; font-size: 11px; line-height: 1.35;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #2b2b2b; padding: 4px 6px; vertical-align: top; }
  .topbar { background: ${ORANGE}; color: #fff; text-align: center; font-weight: 700; letter-spacing: 1px;
    font-size: 12px; padding: 4px; border: 1px solid #2b2b2b; border-bottom: none; }
  .brandrow { border: 1px solid #2b2b2b; border-bottom: none; line-height: 0; }
  .brandrow img { width: 100%; height: auto; display: block; }
  .band { background: ${NAVY}; color: #fff; font-weight: 700; font-size: 12px; padding: 4px 8px;
    border: 1px solid #2b2b2b; border-bottom: none; }
  .kv .k { font-weight: 700; width: 18%; background: #f4f4f4; }
  .kv .v { width: 32%; }
  .issues th { background: ${NAVY}; color: #fff; font-weight: 700; text-align: center; }
  .issues td { height: 28px; }
  .c-no { width: 5%; text-align: center; }
  .c-desc { width: 43%; }
  .c-sev { width: 11%; text-align: center; }
  .c-status { width: 14%; text-align: center; }
  .c-act { width: 27%; }
  .text td { height: 70px; }
  .sign td { height: 60px; width: 50%; }
  .sign .h { height: auto; background: #f4f4f4; font-weight: 700; text-align: center; }
  .line { margin-top: 6px; }
  .gap { height: 8px; }
  .foot { margin-top: 8px; font-size: 9px; color: #555; }
</style>
</head>
<body>
  <div class="topbar">SLA MAINTENANCE VISIT REPORT</div>
  <div class="brandrow"><img src="${FRONTLINE_LOGO_DATA_URL}" alt="" /></div>
  <div class="band">Contract</div>
  <table class="kv">
    <tr><td class="k">Contract</td><td class="v">${esc(c.name)}</td><td class="k">Reference</td><td class="v">${esc(c.contract_ref ?? "")}</td></tr>
    <tr><td class="k">Client</td><td class="v">${esc(c.client ?? "")}</td><td class="k">Site</td><td class="v">${esc(c.site ?? "")}</td></tr>
    <tr><td class="k">Visit period</td><td class="v">${esc(periodLabel(v.period))}</td><td class="k">Visit date</td><td class="v">${fmtPrintDate(v.visited_on ?? v.scheduled_date)}</td></tr>
    <tr><td class="k">Lead engineer</td><td class="v">${esc(d.leadName)}</td><td class="k">Technicians</td><td class="v">${esc(d.technicianNames.join(", "))}</td></tr>
  </table>
  <div class="gap"></div>

  <div class="band">Outstanding issues from previous visits</div>
  <table class="issues">
    <tr><th>#</th><th>Issue</th><th>Severity</th><th>Status</th><th>Action taken</th></tr>
    ${issueRows(d.carriedOver)}
  </table>
  <div class="gap"></div>

  <div class="band">Issues found this visit</div>
  <table class="issues">
    <tr><th>#</th><th>Issue</th><th>Severity</th><th>Status</th><th>Action taken</th></tr>
    ${issueRows(d.foundThisVisit, d.carriedOver.length + 1)}
  </table>
  <div class="gap"></div>

  <div class="band">Work carried out</div>
  <table class="text"><tr><td>${v.work_done ? multiline(v.work_done) : ""}</td></tr></table>
  <div class="gap"></div>

  <table class="sign">
    <tr><td class="h">Frontline representative</td><td class="h">Client representative</td></tr>
    <tr>
      <td>Name: ${esc(d.leadName)}<div class="line">Signature:</div><div class="line">Date:</div></td>
      <td>Name: ${esc(v.customer_signatory ?? "")}<div class="line">Signature &amp; stamp:</div><div class="line">Date:</div></td>
    </tr>
  </table>
  <div class="foot">By signing, the client representative confirms the visit took place and the issues above were reviewed.</div>
</body>
</html>`
}

export function printVisitReport(data: VisitReportData): void {
  printHtml(buildHtml(data))
}
