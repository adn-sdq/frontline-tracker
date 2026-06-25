import { useState, useEffect, useRef, useCallback } from "react"
import * as pdfjsLib from "pdfjs-dist"
import { TextLayer } from "pdfjs-dist"
import type { PDFDocumentProxy } from "pdfjs-dist"
import * as XLSX from "xlsx"
import {
  ZoomIn,
  ZoomOut,
  Download,
  Loader2,
  FileSpreadsheet,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  X,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).href

// ── Text layer CSS injected once ─────────────────────────────────────────────
let _cssInjected = false
function injectTextLayerCss() {
  if (_cssInjected) return
  _cssInjected = true
  const s = document.createElement("style")
  s.textContent = `
    .pdfjsTextLayer {
      position: absolute; top: 0; left: 0;
      overflow: hidden; line-height: 1;
      user-select: text; cursor: text;
      forced-color-adjust: none;
    }
    .pdfjsTextLayer span, .pdfjsTextLayer br {
      color: transparent; position: absolute;
      white-space: pre; cursor: text;
      transform-origin: 0% 0%;
    }
    .pdfjsTextLayer span::selection {
      background: rgba(0, 100, 255, 0.28);
      color: transparent;
    }
    .pdfjsMatch {
      background: rgba(255, 190, 0, 0.55) !important;
      color: transparent !important;
    }
    .pdfjsMatchCurrent {
      background: rgba(255, 80, 0, 0.7) !important;
      color: transparent !important;
      outline: 2px solid rgba(255, 80, 0, 0.9);
      outline-offset: 1px;
    }
  `
  document.head.appendChild(s)
}

// ── helpers ──────────────────────────────────────────────────────────────────

function fileType(name: string): "pdf" | "spreadsheet" | "unknown" {
  const e = name.split(".").pop()?.toLowerCase() ?? ""
  if (e === "pdf") return "pdf"
  if (["csv", "xlsx", "xls"].includes(e)) return "spreadsheet"
  return "unknown"
}

function fileExt(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? ""
}

// ── Per-page renderer ────────────────────────────────────────────────────────

interface PageProps {
  pdf: PDFDocumentProxy
  pageNum: number
  containerWidth: number
  zoom: number
  onVisible: (n: number) => void
}

function PdfPageRenderer({ pdf, pageNum, containerWidth, zoom, onVisible }: PageProps) {
  const wrapRef     = useRef<HTMLDivElement>(null)
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const textRef     = useRef<HTMLDivElement>(null)
  const tlRef       = useRef<TextLayer | null>(null)

  // Track which page is visible via IntersectionObserver
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onVisible(pageNum) },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [pageNum, onVisible])

  // Render canvas + TextLayer
  useEffect(() => {
    let cancelled = false
    async function render() {
      if (!canvasRef.current || !textRef.current) return
      const pdfPage  = await pdf.getPage(pageNum)
      if (cancelled) return

      const baseVp   = pdfPage.getViewport({ scale: 1 })
      const fitScale = containerWidth > 0 ? containerWidth / baseVp.width : 1
      const viewport = pdfPage.getViewport({ scale: fitScale * zoom })

      // Canvas
      const canvas = canvasRef.current
      const ctx    = canvas.getContext("2d")!
      canvas.width  = viewport.width
      canvas.height = viewport.height
      const rt = pdfPage.render({ canvasContext: ctx, viewport } as Parameters<typeof pdfPage.render>[0])
      await rt.promise
      if (cancelled) return

      // Text layer — enables real text selection
      const textDiv = textRef.current
      textDiv.innerHTML = ""
      textDiv.style.width  = `${viewport.width}px`
      textDiv.style.height = `${viewport.height}px`
      const textContent = await pdfPage.getTextContent()
      if (cancelled) return
      tlRef.current?.cancel()
      tlRef.current = new TextLayer({
        textContentSource: textContent,
        container: textDiv,
        viewport,
      })
      await tlRef.current.render()
    }
    render().catch((e: Error & { name?: string }) => {
      if (e?.name === "RenderingCancelledException" || e?.name === "AbortException") return
    })
    return () => {
      cancelled = true
      tlRef.current?.cancel()
    }
  }, [pdf, pageNum, containerWidth, zoom])

  return (
    <div ref={wrapRef} data-page={pageNum} className="relative mb-6 shadow-2xl bg-white">
      <canvas ref={canvasRef} className="block" />
      <div ref={textRef} className="pdfjsTextLayer" />
      <span className="absolute bottom-1.5 right-2 text-[10px] text-neutral-400 select-none pointer-events-none">
        {pageNum}
      </span>
    </div>
  )
}

// ── Outline item (bookmarks) ─────────────────────────────────────────────────

type OutlineItem = { title: string; dest: unknown; items: OutlineItem[] }

function OutlineTree({
  items,
  pdf,
  scrollEl,
}: {
  items: OutlineItem[]
  pdf: PDFDocumentProxy
  scrollEl: HTMLDivElement | null
}) {
  async function jump(dest: unknown) {
    if (!scrollEl) return
    let ref: { num: number } | null = null
    if (Array.isArray(dest) && dest[0]) {
      ref = dest[0] as { num: number }
    } else if (typeof dest === "string") {
      const d = await pdf.getDestination(dest)
      if (Array.isArray(d) && d[0]) ref = d[0] as { num: number }
    }
    if (!ref) return
    const idx = await pdf.getPageIndex(ref as Parameters<PDFDocumentProxy["getPageIndex"]>[0])
    const el = scrollEl.querySelector<HTMLElement>(`[data-page="${idx + 1}"]`)
    el?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <ul className="space-y-0.5">
      {items.map((item, i) => (
        <li key={i}>
          <button
            type="button"
            onClick={() => void jump(item.dest)}
            className="w-full text-left text-xs px-2 py-1 rounded hover:bg-accent truncate"
          >
            {item.title}
          </button>
          {item.items?.length > 0 && (
            <div className="ml-3 border-l pl-1 mt-0.5">
              <OutlineTree items={item.items} pdf={pdf} scrollEl={scrollEl} />
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

// ── PDF viewer ────────────────────────────────────────────────────────────────

function PdfViewer({ url, fileName }: { url: string; fileName: string }) {
  injectTextLayerCss()

  const scrollRef  = useRef<HTMLDivElement>(null)
  const findRef    = useRef<HTMLInputElement>(null)

  const [pdf,           setPdf]          = useState<PDFDocumentProxy | null>(null)
  const [total,         setTotal]        = useState(0)
  const [zoom,          setZoom]         = useState(1)
  const [containerW,    setContainerW]   = useState(800)
  const [currentPage,   setCurrentPage]  = useState(1)
  const [loading,       setLoading]      = useState(true)
  const [error,         setError]        = useState<string | null>(null)
  const [outline,       setOutline]      = useState<OutlineItem[]>([])
  const [outlineOpen,   setOutlineOpen]  = useState(false)
  const [findOpen,      setFindOpen]     = useState(false)
  const [findQuery,     setFindQuery]    = useState("")
  const [matchTotal,    setMatchTotal]   = useState(0)
  const [matchIdx,      setMatchIdx]     = useState(0)
  const [useNative,     setUseNative]    = useState(false)

  // Load PDF
  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(null); setPdf(null); setTotal(0)
    const task = pdfjsLib.getDocument({ url })
    task.promise.then(async (doc) => {
      if (cancelled) return
      setPdf(doc)
      setTotal(doc.numPages)
      const ol = await doc.getOutline().catch(() => null)
      if (!cancelled) setOutline((ol as OutlineItem[]) ?? [])
      setLoading(false)
    }).catch((e: Error & { name?: string }) => {
      if (cancelled || e?.name === "AbortException") return
      setError(e?.message ?? "Failed to load PDF")
      setLoading(false)
    })
    return () => { cancelled = true; void task.destroy() }
  }, [url])

  // Measure scroll container width
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setContainerW(entry.contentRect.width - 32))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Ctrl+F → open find bar
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault()
        setFindOpen(true)
        setTimeout(() => findRef.current?.focus(), 40)
      }
      if (e.key === "Escape") { setFindOpen(false); setFindQuery("") }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Ctrl+scroll → zoom
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoom((z) => Math.min(3, Math.max(0.5, +(z + delta).toFixed(2))))
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [loading])

  // Find: highlight matching spans after text layers have rendered
  useEffect(() => {
    if (!scrollRef.current) return
    const spans = scrollRef.current.querySelectorAll<HTMLElement>(".pdfjsTextLayer span")
    const q = findQuery.trim().toLowerCase()
    const hits: HTMLElement[] = []
    spans.forEach((s) => {
      s.classList.remove("pdfjsMatch", "pdfjsMatchCurrent")
      if (q && s.textContent?.toLowerCase().includes(q)) {
        s.classList.add("pdfjsMatch")
        hits.push(s)
      }
    })
    setMatchTotal(hits.length)
    setMatchIdx(hits.length > 0 ? 0 : -1)
    if (hits[0]) {
      hits[0].classList.add("pdfjsMatchCurrent")
      hits[0].scrollIntoView({ behavior: "smooth", block: "center" })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [findQuery])

  const goMatch = useCallback((dir: 1 | -1) => {
    const hits = scrollRef.current?.querySelectorAll<HTMLElement>(".pdfjsMatch") ?? []
    if (!hits.length) return
    const next = ((matchIdx + dir) + hits.length) % hits.length
    hits.forEach((s, i) => s.classList.toggle("pdfjsMatchCurrent", i === next))
    hits[next].scrollIntoView({ behavior: "smooth", block: "center" })
    setMatchIdx(next)
  }, [matchIdx])

  const onVisible = useCallback((n: number) => setCurrentPage(n), [])

  if (loading) return <ViewerSpinner label="Loading PDF…" />
  if (error)   return <ViewerError  message={error} />

  // Native iframe mode
  if (useNative) {
    return (
      <div className="flex flex-col h-full">
        <div className="shrink-0 flex items-center gap-2 border-b px-4 py-2 bg-muted/30">
          <span className="text-xs text-muted-foreground">Native browser renderer — text selectable, scroll &amp; zoom built-in</span>
          <div className="ml-auto flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => setUseNative(false)}>
              ← PDF.js mode
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" asChild>
              <a href={url} download={fileName} target="_blank" rel="noopener noreferrer">
                <Download className="size-3.5 mr-1" /> Download
              </a>
            </Button>
          </div>
        </div>
        <iframe src={url} title={fileName} className="flex-1 w-full border-0" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-2 border-b px-3 py-1.5 bg-muted/30 flex-wrap">

        {/* Page counter */}
        <span className="text-xs tabular-nums text-muted-foreground select-none min-w-15">
          {currentPage} / {total}
        </span>

        <div className="w-px h-4 bg-border" />

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" className="size-7"
            disabled={zoom <= 0.5} onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}>
            <ZoomOut className="size-3.5" />
          </Button>
          <span className="text-xs tabular-nums text-muted-foreground w-10 text-center select-none">
            {Math.round(zoom * 100)}%
          </span>
          <Button type="button" variant="ghost" size="icon" className="size-7"
            disabled={zoom >= 3} onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}>
            <ZoomIn className="size-3.5" />
          </Button>
        </div>

        <div className="w-px h-4 bg-border" />

        {/* Find */}
        <Button type="button" variant={findOpen ? "secondary" : "ghost"} size="sm" className="h-7 gap-1 text-xs"
          onClick={() => { setFindOpen((v) => !v); setTimeout(() => findRef.current?.focus(), 40) }}>
          <Search className="size-3.5" /> Find
        </Button>

        {/* Bookmarks */}
        {outline.length > 0 && (
          <Button type="button" variant={outlineOpen ? "secondary" : "ghost"} size="sm" className="h-7 gap-1 text-xs"
            onClick={() => setOutlineOpen((v) => !v)}>
            <BookOpen className="size-3.5" /> Contents
          </Button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground"
            onClick={() => setUseNative(true)}>
            Try native →
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs" asChild>
            <a href={url} download={fileName} target="_blank" rel="noopener noreferrer">
              <Download className="size-3.5 mr-1" /> Download
            </a>
          </Button>
        </div>
      </div>

      {/* ── Find bar ────────────────────────────────────────────── */}
      {findOpen && (
        <div className="shrink-0 flex items-center gap-2 border-b px-3 py-1.5 bg-yellow-50 dark:bg-yellow-950/30">
          <Search className="size-3.5 text-muted-foreground shrink-0" />
          <Input
            ref={findRef}
            value={findQuery}
            onChange={(e) => setFindQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") goMatch(e.shiftKey ? -1 : 1)
            }}
            placeholder="Search in PDF… (Enter to jump)"
            className="h-7 text-xs flex-1 max-w-xs border-0 bg-transparent focus-visible:ring-0 px-0"
          />
          {findQuery && (
            <span className="text-xs text-muted-foreground shrink-0">
              {matchTotal === 0 ? "No matches" : `${matchIdx + 1} / ${matchTotal}`}
            </span>
          )}
          {matchTotal > 0 && (
            <>
              <Button type="button" variant="ghost" size="icon" className="size-6" onClick={() => goMatch(-1)}>
                <ChevronLeft className="size-3.5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="size-6" onClick={() => goMatch(1)}>
                <ChevronRight className="size-3.5" />
              </Button>
            </>
          )}
          <Button type="button" variant="ghost" size="icon" className="size-6 ml-auto"
            onClick={() => { setFindOpen(false); setFindQuery("") }}>
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {/* ── Body: optional outline sidebar + scroll area ─────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Bookmarks / outline panel */}
        {outlineOpen && outline.length > 0 && (
          <div className="w-52 shrink-0 border-r overflow-y-auto p-2 bg-muted/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-2">Contents</p>
            <OutlineTree items={outline} pdf={pdf!} scrollEl={scrollRef.current} />
          </div>
        )}

        {/* All pages — continuous scroll */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto bg-neutral-300 dark:bg-neutral-700 p-4 flex flex-col items-center"
        >
          {pdf && Array.from({ length: total }, (_, i) => i + 1).map((n) => (
            <PdfPageRenderer
              key={n}
              pdf={pdf}
              pageNum={n}
              containerWidth={containerW}
              zoom={zoom}
              onVisible={onVisible}
            />
          ))}
          <div className="text-xs text-neutral-400 py-4 select-none">End of document</div>
        </div>
      </div>
    </div>
  )
}

// ── Spreadsheet viewer ───────────────────────────────────────────────────────

const MAX_ROWS = 1000

type CellValue = string | number | boolean | null

function SpreadsheetViewer({ url, fileName }: { url: string; fileName: string }) {
  const [sheets,      setSheets]      = useState<Record<string, CellValue[][]>>({})
  const [sheetNames,  setSheetNames]  = useState<string[]>([])
  const [activeSheet, setActiveSheet] = useState("")
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(null)
    async function load() {
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const buffer = await res.arrayBuffer()
        const isCSV  = fileExt(fileName) === "csv"
        const wb     = isCSV
          ? XLSX.read(new TextDecoder().decode(buffer), { type: "string" })
          : XLSX.read(new Uint8Array(buffer), { type: "array" })
        if (cancelled) return
        const parsed: Record<string, CellValue[][]> = {}
        for (const name of wb.SheetNames) {
          parsed[name] = XLSX.utils.sheet_to_json<CellValue[]>(wb.Sheets[name], { header: 1, defval: null })
        }
        setSheets(parsed); setSheetNames(wb.SheetNames); setActiveSheet(wb.SheetNames[0] ?? "")
        setLoading(false)
      } catch (e) {
        if (cancelled) return
        setError((e as Error)?.message ?? "Failed to parse file"); setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [url, fileName])

  if (loading) return <ViewerSpinner label="Parsing file…" />
  if (error)   return <ViewerError  message={error} />

  const rows      = sheets[activeSheet] ?? []
  const headers   = (rows[0] ?? []) as CellValue[]
  const dataRows  = rows.slice(1, MAX_ROWS + 1)
  const truncated = rows.length - 1 > MAX_ROWS

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex items-center gap-1 border-b px-4 py-2 bg-muted/30 overflow-x-auto">
        {sheetNames.map((name) => (
          <button key={name} type="button" onClick={() => setActiveSheet(name)}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors shrink-0 ${
              name === activeSheet ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}>
            <FileSpreadsheet className="size-3" />{name}
          </button>
        ))}
        <div className="ml-auto shrink-0 pl-2">
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs" asChild>
            <a href={url} download={fileName} target="_blank" rel="noopener noreferrer">
              <Download className="size-3.5 mr-1" /> Download
            </a>
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {rows.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Sheet is empty</div>
        ) : (
          <table className="min-w-full text-sm border-collapse">
            <thead className="sticky top-0 z-10 bg-muted shadow-sm">
              <tr>
                <th className="w-9 border-b border-r px-2 py-2 text-right text-xs text-muted-foreground font-normal select-none">#</th>
                {headers.map((h, i) => (
                  <th key={i} className="border-b border-r px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">
                    {h != null ? String(h) : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, ri) => (
                <tr key={ri} className="hover:bg-accent/40 even:bg-muted/20">
                  <td className="border-b border-r px-2 py-1.5 text-right text-xs text-muted-foreground select-none">{ri + 1}</td>
                  {headers.map((_, ci) => (
                    <td key={ci} className="border-b border-r px-3 py-1.5 whitespace-nowrap max-w-70 truncate text-xs">
                      {(row as CellValue[])[ci] != null ? String((row as CellValue[])[ci]) : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="shrink-0 border-t px-4 py-1.5 flex items-center gap-3 bg-muted/30 text-xs text-muted-foreground">
        <span>{Math.min(dataRows.length, MAX_ROWS).toLocaleString()} rows</span>
        <span>·</span>
        <span>{headers.length} columns</span>
        {truncated && (
          <><span>·</span>
          <span className="text-amber-600 dark:text-amber-400">
            Showing first {MAX_ROWS.toLocaleString()} of {(rows.length - 1).toLocaleString()} rows
          </span></>
        )}
      </div>
    </div>
  )
}

// ── Shared sub-components ────────────────────────────────────────────────────

function ViewerSpinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col h-full items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="size-8 animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

function ViewerError({ message }: { message: string }) {
  return (
    <div className="flex flex-col h-full items-center justify-center gap-2 text-destructive">
      <AlertCircle className="size-8 opacity-80" />
      <p className="text-sm font-medium">Failed to load file</p>
      <p className="text-xs text-muted-foreground max-w-xs text-center">{message}</p>
    </div>
  )
}

// ── Public API ───────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onClose: () => void
  url: string | null
  fileName: string
}

export function FileViewerModal({ open, onClose, url, fileName }: Props) {
  const type = fileType(fileName)
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-[96vw] w-[96vw] p-0 gap-0 overflow-hidden [&>button]:top-3 [&>button]:right-3"
        style={{ height: "93vh", maxHeight: "93vh" }}
      >
        <DialogTitle className="sr-only">{fileName}</DialogTitle>
        <div className="shrink-0 flex items-center gap-2 border-b px-4 py-2.5 pr-12 bg-background">
          <p className="truncate text-sm font-medium">{fileName}</p>
          <span className="shrink-0 text-xs text-muted-foreground uppercase tracking-wide">
            {fileExt(fileName)}
          </span>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          {!url ? (
            <ViewerSpinner label="Preparing file…" />
          ) : type === "pdf" ? (
            <PdfViewer url={url} fileName={fileName} />
          ) : type === "spreadsheet" ? (
            <SpreadsheetViewer url={url} fileName={fileName} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Preview not supported for this file type.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
