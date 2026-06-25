import { useState, useEffect, useRef, useCallback } from "react"
import * as pdfjsLib from "pdfjs-dist"
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist"
import * as XLSX from "xlsx"
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  X,
  Loader2,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

// Configure PDF.js worker via Vite's ?url import
import PDFWorkerURL from "pdfjs-dist/build/pdf.worker.min.mjs?url"
pdfjsLib.GlobalWorkerOptions.workerSrc = PDFWorkerURL

// ── helpers ─────────────────────────────────────────────────────────────────

function fileType(name: string): "pdf" | "spreadsheet" | "unknown" {
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  if (ext === "pdf") return "pdf"
  if (["csv", "xlsx", "xls"].includes(ext)) return "spreadsheet"
  return "unknown"
}

function ext(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? ""
}

// ── PDF viewer ───────────────────────────────────────────────────────────────

function PdfViewer({ url, fileName }: { url: string; fileName: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const renderTaskRef = useRef<ReturnType<PDFPageProxy["render"]> | null>(null)

  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [loading, setLoading] = useState(true)
  const [rendering, setRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load document
  useEffect(() => {
    setLoading(true)
    setError(null)
    setPage(1)
    setPdf(null)

    const task = pdfjsLib.getDocument({ url, cMapPacked: true })
    task.promise
      .then((doc) => {
        setPdf(doc)
        setTotal(doc.numPages)
        setLoading(false)
      })
      .catch((err) => {
        setError(err?.message ?? "Failed to load PDF")
        setLoading(false)
      })
    return () => { void task.destroy() }
  }, [url])

  // Render page
  const renderPage = useCallback(async () => {
    if (!pdf || !canvasRef.current || !containerRef.current) return
    // Cancel any in-flight render
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel() } catch { /* ignore */ }
    }
    setRendering(true)
    try {
      const pdfPage = await pdf.getPage(page)
      const containerWidth = containerRef.current.clientWidth - 32
      const baseVp = pdfPage.getViewport({ scale: 1 })
      const fitScale = containerWidth / baseVp.width
      const viewport = pdfPage.getViewport({ scale: fitScale * zoom })

      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")!
      canvas.width = viewport.width
      canvas.height = viewport.height

      // pdfjs-dist v4 types require a cast here
      const task = pdfPage.render({ canvasContext: ctx, viewport } as Parameters<typeof pdfPage.render>[0])
      renderTaskRef.current = task
      await task.promise
    } catch (e: unknown) {
      if ((e as { name?: string })?.name !== "RenderingCancelledException") {
        setError((e as Error)?.message ?? "Render error")
      }
    } finally {
      setRendering(false)
    }
  }, [pdf, page, zoom])

  useEffect(() => { renderPage() }, [renderPage])

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") setPage((p) => Math.max(1, p - 1))
      if (e.key === "ArrowRight" || e.key === "ArrowDown") setPage((p) => Math.min(total, p + 1))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [total])

  if (loading) return <CenterSpinner label="Loading PDF…" />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="shrink-0 flex items-center gap-2 border-b px-4 py-2 bg-background">
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" className="size-8" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm tabular-nums min-w-[80px] text-center">
            {page} / {total}
          </span>
          <Button type="button" variant="ghost" size="icon" className="size-8" disabled={page >= total} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="h-5 w-px bg-border mx-1" />

        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" className="size-8" disabled={zoom <= 0.5} onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}>
            <ZoomOut className="size-4" />
          </Button>
          <span className="text-sm tabular-nums min-w-[48px] text-center">{Math.round(zoom * 100)}%</span>
          <Button type="button" variant="ghost" size="icon" className="size-8" disabled={zoom >= 3} onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}>
            <ZoomIn className="size-4" />
          </Button>
        </div>

        {rendering && <Loader2 className="size-4 animate-spin text-muted-foreground ml-1" />}

        <div className="ml-auto">
          <Button type="button" variant="ghost" size="sm" asChild>
            <a href={url} download={fileName} target="_blank" rel="noopener noreferrer">
              <Download className="size-4 mr-1" /> Download
            </a>
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-muted/30 p-4 flex justify-center">
        <canvas ref={canvasRef} className="shadow-md rounded" />
      </div>
    </div>
  )
}

// ── Spreadsheet viewer ───────────────────────────────────────────────────────

const MAX_ROWS = 1000

function SpreadsheetViewer({ url, fileName }: { url: string; fileName: string }) {
  const [sheets, setSheets] = useState<Record<string, (string | number | boolean | null)[][]>>({})
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [activeSheet, setActiveSheet] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    async function load() {
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const buffer = await res.arrayBuffer()
        const isCSV = ext(fileName) === "csv"
        const wb = isCSV
          ? XLSX.read(new TextDecoder().decode(buffer), { type: "string" })
          : XLSX.read(new Uint8Array(buffer), { type: "array" })

        const parsed: Record<string, (string | number | boolean | null)[][]> = {}
        for (const name of wb.SheetNames) {
          parsed[name] = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(
            wb.Sheets[name],
            { header: 1, defval: null }
          )
        }
        setSheets(parsed)
        setSheetNames(wb.SheetNames)
        setActiveSheet(wb.SheetNames[0] ?? "")
        setLoading(false)
      } catch (e) {
        setError((e as Error)?.message ?? "Failed to parse file")
        setLoading(false)
      }
    }
    load()
  }, [url, fileName])

  if (loading) return <CenterSpinner label="Parsing file…" />
  if (error) return <ErrorMessage message={error} />

  const rows = sheets[activeSheet] ?? []
  const headers = rows[0] ?? []
  const dataRows = rows.slice(1, MAX_ROWS + 1)
  const truncated = rows.length - 1 > MAX_ROWS

  return (
    <div className="flex flex-col h-full">
      {/* Sheet tabs + download */}
      <div className="shrink-0 flex items-center gap-1 border-b px-4 py-2 bg-background overflow-x-auto">
        {sheetNames.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setActiveSheet(name)}
            className={`flex items-center gap-1.5 rounded px-3 py-1 text-sm font-medium transition-colors shrink-0 ${
              name === activeSheet
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent"
            }`}
          >
            <FileSpreadsheet className="size-3.5" />
            {name}
          </button>
        ))}
        <div className="ml-auto shrink-0">
          <Button type="button" variant="ghost" size="sm" asChild>
            <a href={url} download={fileName} target="_blank" rel="noopener noreferrer">
              <Download className="size-4 mr-1" /> Download
            </a>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {rows.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Sheet is empty
          </div>
        ) : (
          <>
            <table className="min-w-full text-sm border-collapse">
              <thead className="sticky top-0 z-10 bg-muted">
                <tr>
                  <th className="w-10 border-b border-r px-2 py-1.5 text-right text-xs text-muted-foreground font-normal select-none">#</th>
                  {headers.map((h, i) => (
                    <th
                      key={i}
                      className="border-b border-r px-3 py-1.5 text-left font-semibold whitespace-nowrap text-foreground"
                    >
                      {h ?? ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row, ri) => (
                  <tr key={ri} className="hover:bg-accent/40 even:bg-muted/20">
                    <td className="border-b border-r px-2 py-1 text-right text-xs text-muted-foreground select-none">{ri + 1}</td>
                    {headers.map((_, ci) => (
                      <td key={ci} className="border-b border-r px-3 py-1 whitespace-nowrap max-w-[300px] truncate">
                        {row[ci] != null ? String(row[ci]) : ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {truncated && (
              <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/50 border-t">
                Showing first {MAX_ROWS} of {rows.length - 1} rows. Download the file to see all data.
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer: row count */}
      <div className="shrink-0 border-t px-4 py-1.5 text-xs text-muted-foreground bg-background">
        {Math.min(dataRows.length, MAX_ROWS).toLocaleString()} rows · {headers.length} columns
      </div>
    </div>
  )
}

// ── Shared sub-components ────────────────────────────────────────────────────

function CenterSpinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col h-full items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="size-8 animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex flex-col h-full items-center justify-center gap-2 text-destructive">
      <AlertCircle className="size-8" />
      <p className="text-sm">{message}</p>
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
        className="max-w-[95vw] w-[95vw] p-0 overflow-hidden"
        style={{ height: "92vh", maxHeight: "92vh" }}
      >
        <div className="flex flex-col h-full">
          {/* Modal header */}
          <div className="shrink-0 flex items-center gap-3 border-b px-4 py-3">
            <p className="flex-1 truncate font-medium text-sm">{fileName}</p>
            <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>

          {/* Viewer body */}
          <div className="flex-1 min-h-0">
            {!url ? (
              <CenterSpinner label="Preparing file…" />
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
