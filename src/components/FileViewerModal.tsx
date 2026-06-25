import { useState, useEffect } from "react"
import * as XLSX from "xlsx"
import {
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

// ── PDF viewer (native browser renderer) ────────────────────────────────────

function PdfViewer({ url, fileName }: { url: string; fileName: string }) {
  return <iframe src={url} title={fileName} className="w-full h-full border-0" />
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
      <div className="shrink-0 flex items-center gap-1 border-b px-3 py-1 bg-muted/30 overflow-x-auto">
        {sheetNames.map((name) => (
          <button key={name} type="button" onClick={() => setActiveSheet(name)}
            className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors shrink-0 ${
              name === activeSheet ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}>
            <FileSpreadsheet className="size-3" />{name}
          </button>
        ))}
        <div className="ml-auto shrink-0 pl-2">
          <Button type="button" variant="outline" size="sm" className="h-6 text-xs px-2" asChild>
            <a href={url} download={fileName} target="_blank" rel="noopener noreferrer">
              <Download className="size-3 mr-1" /> Download
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
        className="max-w-[96vw] w-[96vw] p-0 gap-0 overflow-hidden flex flex-col [&>button]:top-3 [&>button]:right-3"
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
