/** Escape a string for safe interpolation into generated HTML. */
export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** Multi-line text → <br>-separated, escaped HTML. */
export function multiline(s: string): string {
  return esc(s).replace(/\r?\n/g, "<br>")
}

/** yyyy-MM-dd → dd/MM/yyyy */
export function fmtPrintDate(iso: string | null | undefined): string {
  if (!iso) return ""
  const [y, m, d] = iso.slice(0, 10).split("-")
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

/**
 * Render a full HTML document in a hidden iframe and open the browser's print
 * dialog (Save as PDF). An iframe avoids popup blockers.
 */
export function printHtml(html: string): void {
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
  let printed = false
  const triggerPrint = () => {
    if (printed) return
    printed = true
    win.focus()
    win.print()
    setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
    }, 1000)
  }

  // Wait for embedded images (logo) before printing.
  const img = doc.querySelector("img")
  if (img && !img.complete) {
    img.addEventListener("load", triggerPrint, { once: true })
    img.addEventListener("error", triggerPrint, { once: true })
    setTimeout(triggerPrint, 1500)
  } else {
    setTimeout(triggerPrint, 200)
  }
}
