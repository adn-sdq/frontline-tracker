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
  Loader2,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

// CDN worker URL — reliable under any base path deployment (e.g. /frontline-tracker/)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

// ── helpers ─────────────────────────────────────────────────────────────────

function fileType(name: string): "pdf" | "spreadsheet" | "unknown" {
  const e = name.split(".").pop()?.toLowerCase() ?? ""
  if (e === "pdf") return "pdf"
  if (["csv", "xlsx", "xls"].includes(e)) return "spreadsheet"
  return "unknown"
}

function fileExt(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? ""
}

// ── PDF viewer ───────────────────────────────────────────────────────────────

function PdfViewer({ url, fileName }: { url: string; fileName: string }) {
  const canvasRef     = useRef<HTMLCanvasElement>(null)
  const containerRef  = useRef<HTMLDivElement>(null)
  const renderTaskRef = useRef<ReturnType<PDFPageProxy["render"]> | null>(null)

  const [pdf,       setPdf]       = useState<PDFDocumentProxy | null>(null)
  const [page,      setPage]      = useState(1)
  const [total,     setTotal]     = useState(0)
  const [zoom,      setZoom]      = useState(1)
  const [loading,   setLoading]   = useState(true)
  const [rendering, setRendering] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  // Load PDF document
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setPage(1)
    setPdf(null)

    const task = pdfjsLib.getDocument({ url })
    task.promise
      .then((doc) => {
        if (cancelled) return
        setPdf(doc)
        setTotal(doc.numPages)
        setLoading(false)
      })
      .catch((err: Error & { name?: string }) => {
        if (cancelled || err?.name === "AbortException") return
        setError(err?.message ?? "Failed to load PDF")
        setLoading(false)
      })
    return () => {
      cancelled = true
      void task.destroy()
    }
  }, [url])

  // Render current page onto canvas
  const renderPage = useCallback(async () => {
    if (!pdf || !canvasRef.current || !containerRef.current) return
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel() } catch { /* ignore */ }
    }
    setRendering(true)
    try {
      const pdfPage      = await pdf.getPage(page)
      const containerW   = containerRef.current.clientWidth - 32
      const baseVp       = pdfPage.getViewport({ scale: 1 })
      const fitScale     = containerW / baseVp.width
      const viewport     = pdfPage.getViewport({ scale: fitScale * zoom })
      const canvas       = canvasRef.current
      const ctx          = canvas.getContext("2d")!
      canvas.width       = viewport.width
      canvas.height      = viewport.height
      const task = pdfPage.render({
        canvasContext: ctx,
        viewport,
      } as Parameters<typeof pdfPage.render>[0])
      renderTaskRef.current = task
      await task.promise
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string }
      if (err?.name !== "RenderingCancelledException") {
        setError(err?.message ?? "Render error")
      }
    } finally {
      setRendering(false)
    }
  }, [pdf, page, zoom])

  useEffect(() => { void renderPage() }, [renderPage])

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   setPage((p) => Math.max(1, p - 1))
      if (e.key === "ArrowRight" || e.key === "ArrowDown") setPage((p) => Math.min(total, p + 1))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [total])

  if (loading) return <ViewerSpinner label="Loading PDF…" />
  if (error)   return <ViewerError  message={error} />

  return (
    <div className="flex flex-col h-full">
      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-3 border-b px-4 py-2 bg-muted/30">
        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" className="size-7" disabled={page <= 1}     onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-xs tabular-nums select-none text-muted-foreground w-[72px] text-center">
            {page} / {total}
          </span>
          <Button type="button" variant="ghost" size="icon" className="size-7" disabled={page >= total} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="w-px h-4 bg-border" />

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" className="size-7" disabled={zoom <= 0.5} onClick={() => setZoom((z) => Math.max(0.5,  +(z - 0.25).toFixed(2)))}>
            <ZoomOut className="size-4" />
          </Button>
          <span className="text-xs tabular-nums select-none text-muted-foreground w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button type="button" variant="ghost" size="icon" className="size-7" disabled={zoom >= 3}   onClick={() => setZoom((z) => Math.min(3,    +(z + 0.25).toFixed(2)))}>
            <ZoomIn className="size-4" />
          </Button>
        </div>

        {rendering && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}

        <div className="ml-auto">
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs" asChild>
            <a href={url} download={fileName} target="_blank" rel="noopener noreferrer">
              <Download className="size-3.5 mr-1" /> Download
            </a>
          </Button>
        </div>
      </div>

      {/* ── Canvas area ──────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-neutral-200 dark:bg-neutral-800 p-4 flex justify-center items-start"
      >
        <canvas
          ref={canvasRef}
          className="shadow-xl rounded"
        />
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
    setLoading(true)
    setError(null)

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
          parsed[name] = XLSX.utils.sheet_to_json<CellValue[]>(
            wb.Sheets[name],
            { header: 1, defval: null }
          )
        }
        setSheets(parsed)
        setSheetNames(wb.SheetNames)
        setActiveSheet(wb.SheetNames[0] ?? "")
        setLoading(false)
      } catch (e) {
        if (cancelled) return
        setError((e as Error)?.message ?? "Failed to parse file")
        setLoading(false)
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
      {/* Sheet tabs */}
      <div className="shrink-0 flex items-center gap-1 border-b px-4 py-2 bg-muted/30 overflow-x-auto">
        {sheetNames.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setActiveSheet(name)}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors shrink-0 ${
              name === activeSheet
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <FileSpreadsheet className="size-3" />
            {name}
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

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {rows.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Sheet is empty
          </div>
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
                    <td key={ci} className="border-b border-r px-3 py-1.5 whitespace-nowrap max-w-[280px] truncate text-xs">
                      {(row as CellValue[])[ci] != null ? String((row as CellValue[])[ci]) : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t px-4 py-1.5 flex items-center gap-3 bg-muted/30 text-xs text-muted-foreground">
        <span>{Math.min(dataRows.length, MAX_ROWS).toLocaleString()} rows</span>
        <span>·</span>
        <span>{headers.length} columns</span>
        {truncated && (
          <>
            <span>·</span>
            <span className="text-amber-600 dark:text-amber-400">
              Showing first {MAX_ROWS.toLocaleString()} of {(rows.length - 1).toLocaleString()} rows
            </span>
          </>
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
        {/* Accessible title (visually hidden — filename shown in toolbar) */}
        <DialogTitle className="sr-only">{fileName}</DialogTitle>

        {/* File name bar */}
        <div className="shrink-0 flex items-center gap-2 border-b px-4 py-2.5 pr-12 bg-background">
          <p className="truncate text-sm font-medium">{fileName}</p>
          <span className="shrink-0 text-xs text-muted-foreground uppercase tracking-wide">
            {fileExt(fileName)}
          </span>
        </div>

        {/* Viewer body */}
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
