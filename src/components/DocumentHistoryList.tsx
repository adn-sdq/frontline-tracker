import { format } from "date-fns"
import {
  FilePen,
  FilePlus2,
  FileX2,
  History,
  Pencil,
  PlusCircle,
  Trash2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { useDocumentHistory } from "@/hooks/useDocuments"
import {
  DOC_STATUS_LABELS,
  DOC_TYPE_LABELS,
  type DocHistoryAction,
  type Profile,
} from "@/lib/types"

const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  doc_number: "Document no.",
  system: "System",
  doc_type: "Type",
  revision: "Revision",
  status: "Status",
  description: "Description",
  file_name: "File name",
  dated: "Dated",
  note: "Note",
  rev_label: "Rev label",
  review_code: "Review code",
}

const ACTION_META: Record<
  DocHistoryAction,
  { label: string; icon: typeof Pencil; className: string }
> = {
  create: { label: "Created", icon: PlusCircle, className: "text-emerald-600" },
  update: { label: "Edited", icon: Pencil, className: "text-blue-600" },
  delete: { label: "Deleted", icon: Trash2, className: "text-destructive" },
  file_upload: { label: "File uploaded", icon: FilePlus2, className: "text-emerald-600" },
  file_rename: { label: "File renamed", icon: FilePen, className: "text-blue-600" },
  file_update: { label: "File edited", icon: FilePen, className: "text-blue-600" },
  file_delete: { label: "File deleted", icon: FileX2, className: "text-destructive" },
}

function val(field: string, v: unknown) {
  if (v === null || v === undefined || v === "") return "—"
  const s = String(v)
  if (field === "status" || field === "review_code") return DOC_STATUS_LABELS[s] ?? s
  if (field === "doc_type") return DOC_TYPE_LABELS[s as keyof typeof DOC_TYPE_LABELS] ?? s
  return s
}

/**
 * Version timeline for a document: every saved change (fields and files),
 * who made it, when, and the document version it produced.
 */
export function DocumentHistoryList({
  documentId,
  profiles,
}: {
  documentId: string | null
  profiles: Record<string, Profile>
}) {
  const { data: history, isLoading } = useDocumentHistory(documentId)

  function who(id: string | null) {
    if (!id) return "System"
    const p = profiles[id]
    return p?.full_name ?? p?.username ?? "Unknown"
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner className="size-5" />
      </div>
    )
  }

  if (!history || history.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No history yet"
        description="Every saved change to this document will be versioned here."
        compact
      />
    )
  }

  return (
    <ol className="relative flex flex-col gap-3 border-l pl-4">
      {history.map((h) => {
        const meta = ACTION_META[h.action] ?? ACTION_META.update
        const Icon = meta.icon
        const fileReviewCode =
          h.action === "file_upload" ? (h.snapshot?.review_code as string | null) : null
        return (
          <li key={h.id} className="relative rounded-lg border bg-card p-3">
            <span className="absolute top-4 -left-[21.5px] size-2 rounded-full bg-border ring-4 ring-background" />
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Icon className={`size-4 shrink-0 ${meta.className}`} />
                <span className="truncate text-sm font-medium">{meta.label}</span>
                {h.version != null && (
                  <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
                    v{h.version}
                  </Badge>
                )}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {format(new Date(h.changed_at), "d MMM yyyy, HH:mm")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">by {who(h.changed_by)}</p>

            {h.file_name && h.action !== "file_rename" && (
              <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm">
                <span className="break-all">{h.file_name}</span>
                {fileReviewCode && (
                  <Badge variant="secondary" className="text-[10px]">
                    Approved copy · {DOC_STATUS_LABELS[fileReviewCode] ?? fileReviewCode}
                  </Badge>
                )}
              </p>
            )}

            {h.diff && Object.keys(h.diff).length > 0 && (
              <ul className="mt-1.5 flex flex-col gap-1 text-sm">
                {Object.entries(h.diff).map(([field, change]) => (
                  <li key={field} className="flex flex-wrap items-baseline gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      {FIELD_LABELS[field] ?? field}:
                    </span>
                    <span className="break-all text-muted-foreground line-through">
                      {val(field, change.old)}
                    </span>
                    <span>→</span>
                    <span className="break-all font-medium">{val(field, change.new)}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        )
      })}
    </ol>
  )
}
