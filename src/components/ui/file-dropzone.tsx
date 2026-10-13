import { useRef, useState, type DragEvent, type ReactNode } from "react"
import { Loader2, Upload } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"

/** True when `file` satisfies an <input accept> string (".pdf,image/*"). */
function matchesAccept(file: File, accept?: string) {
  if (!accept) return true
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return accept
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean)
    .some((a) =>
      a.startsWith(".")
        ? name.endsWith(a)
        : a.endsWith("/*")
          ? type.startsWith(a.slice(0, -1))
          : type === a
    )
}

/**
 * Drag-and-drop handlers + hidden input wiring, for surfaces that aren't a
 * standard dropzone (e.g. an avatar). Spread `dropProps` on the target and
 * render `input`; call `open()` to show the file picker.
 */
export function useFileDrop({
  onFiles,
  accept,
  multiple,
  disabled,
}: {
  onFiles: (files: File[]) => void
  accept?: string
  multiple?: boolean
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const depth = useRef(0)
  const [dragging, setDragging] = useState(false)

  function take(list: FileList | null) {
    const all = Array.from(list ?? [])
    const ok = all.filter((f) => matchesAccept(f, accept))
    if (ok.length < all.length) {
      toast.error("Some files were skipped", {
        description: `Allowed: ${accept}`,
      })
    }
    const picked = multiple ? ok : ok.slice(0, 1)
    if (picked.length) onFiles(picked)
  }

  const dropProps = {
    onDragEnter: (e: DragEvent) => {
      if (disabled || !e.dataTransfer.types.includes("Files")) return
      e.preventDefault()
      depth.current += 1
      setDragging(true)
    },
    onDragOver: (e: DragEvent) => {
      if (disabled || !e.dataTransfer.types.includes("Files")) return
      e.preventDefault()
      e.dataTransfer.dropEffect = "copy"
    },
    onDragLeave: () => {
      depth.current = Math.max(0, depth.current - 1)
      if (depth.current === 0) setDragging(false)
    },
    onDrop: (e: DragEvent) => {
      if (disabled) return
      e.preventDefault()
      depth.current = 0
      setDragging(false)
      take(e.dataTransfer.files)
    },
  }

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept={accept}
      multiple={multiple}
      className="hidden"
      aria-hidden
      tabIndex={-1}
      onChange={(e) => {
        take(e.target.files)
        e.target.value = ""
      }}
    />
  )

  return {
    dragging,
    dropProps,
    input,
    open: () => !disabled && inputRef.current?.click(),
  }
}

/**
 * Standard upload target: drop files on it or click to browse. Used for every
 * upload in the app so the interaction is identical everywhere.
 */
export function FileDropzone({
  onFiles,
  accept,
  multiple,
  disabled,
  busy,
  title,
  hint,
  compact,
  className,
  children,
}: {
  onFiles: (files: File[]) => void
  accept?: string
  multiple?: boolean
  disabled?: boolean
  /** Shows a spinner and blocks input while an upload is running. */
  busy?: boolean
  title?: string
  hint?: ReactNode
  /** Single-row layout for tight spaces. */
  compact?: boolean
  className?: string
  /** Extra content rendered under the drop target (e.g. metadata fields). */
  children?: ReactNode
}) {
  const blocked = disabled || busy
  const { dragging, dropProps, input, open } = useFileDrop({
    onFiles,
    accept,
    multiple,
    disabled: blocked,
  })
  const Icon = busy ? Loader2 : Upload
  const label =
    title ?? (busy ? "Uploading…" : multiple ? "Drop files or click to browse" : "Drop a file or click to browse")

  return (
    <div
      {...dropProps}
      className={cn(
        "overflow-hidden rounded-lg border-2 border-dashed transition-colors",
        dragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 bg-muted/20",
        className
      )}
    >
      {input}
      <button
        type="button"
        onClick={open}
        disabled={blocked}
        className={cn(
          "flex w-full items-center transition-colors hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60",
          compact ? "gap-2 px-3 py-2.5 text-left" : "flex-col gap-1.5 px-4 py-5"
        )}
      >
        <Icon
          className={cn(
            "shrink-0 text-muted-foreground",
            compact ? "size-4" : "size-6",
            busy && "animate-spin",
            dragging && "text-primary"
          )}
        />
        <span className={cn("min-w-0", !compact && "text-center")}>
          <span className="block text-sm font-medium">
            {dragging ? "Release to upload" : busy ? "Uploading…" : label}
          </span>
          {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
        </span>
      </button>
      {children && <div className="border-t bg-background/60">{children}</div>}
    </div>
  )
}
