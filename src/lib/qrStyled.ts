import QRCode from "qrcode"

// FIT mark (from the brand SVG, 512×384 viewBox), drawn in a single colour.
const MARK = [
  "M257.214 8.5H161.195L257.962 113.166H342.879L296.276 66.5628H445.187L503.25 8.5H257.214Z",
  "M291.159 149.073L330.741 191.886L161.195 375.273H250.214L421.6 191.886L378.786 149.073H291.159Z",
  "M8.50024 8.5L193.046 191.886L8.50024 375.273H104.519L277.905 191.886L104.519 8.5H8.50024Z",
]

/**
 * A clean black-and-white QR as an SVG string: rounded modules, rounded
 * "eye" corners and the FIT mark in the centre. Uses the highest error
 * correction (H, ~30%) so the logo doesn't stop it scanning.
 */
export function styledQrSvg(
  text: string,
  { color = "#000", logo = true, quiet = 4, rounded = true }: { color?: string; logo?: boolean; quiet?: number; rounded?: boolean } = {}
): string {
  const qr = QRCode.create(text, { errorCorrectionLevel: "H" })
  const n = qr.modules.size
  const at = (r: number, c: number) => qr.modules.get(r, c) === 1

  // Centre area kept clear for the logo (in modules, odd so it's centred).
  const hole = logo ? Math.floor(n * 0.24) | 1 : 0
  const h0 = (n - hole) / 2
  const inHole = (r: number, c: number) => logo && r >= h0 - 0.5 && r < h0 + hole && c >= h0 - 0.5 && c < h0 + hole
  const inEye = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7)

  const parts: string[] = []
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!at(r, c) || inEye(r, c) || inHole(r, c)) continue
      parts.push(
        rounded
          ? `<rect x="${c}" y="${r}" width="1.01" height="1.01" rx="0.22"/>`
          : `<rect x="${c}" y="${r}" width="1.01" height="1.01"/>`
      )
    }
  }

  // Three finder "eyes": rounded ring + rounded centre.
  const eye = (x: number, y: number) =>
    `<path fill-rule="evenodd" d="M${x + 2} ${y}h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2zM${x + 2.2} ${y + 1}h2.6a1.2 1.2 0 0 1 1.2 1.2v2.6a1.2 1.2 0 0 1-1.2 1.2h-2.6a1.2 1.2 0 0 1-1.2-1.2v-2.6a1.2 1.2 0 0 1 1.2-1.2z"/>` +
    `<rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx="0.9"/>`
  parts.push(eye(0, 0), eye(n - 7, 0), eye(0, n - 7))

  let mark = ""
  if (logo) {
    const pad = hole * 0.12
    const w = hole - pad * 2
    const scale = w / 512
    const y = h0 + (hole - 384 * scale) / 2
    mark =
      `<rect x="${h0 - 0.5}" y="${h0 - 0.5}" width="${hole + 1}" height="${hole + 1}" rx="${hole * 0.22}" fill="#fff"/>` +
      `<g transform="translate(${h0 + pad} ${y}) scale(${scale})" fill="none" stroke="${color}" stroke-width="30" stroke-linecap="round" stroke-linejoin="round">` +
      MARK.map((d) => `<path d="${d}"/>`).join("") +
      `</g>`
  }

  const q = quiet // quiet zone (4 modules is the standard)
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-q} ${-q} ${n + q * 2} ${n + q * 2}" shape-rendering="geometricPrecision">` +
    `<rect x="${-q}" y="${-q}" width="${n + q * 2}" height="${n + q * 2}" fill="#fff"/>` +
    `<g fill="${color}">${parts.join("")}</g>${mark}</svg>`
  )
}
