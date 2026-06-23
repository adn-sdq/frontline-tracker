import { useState } from "react"
import { Info, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"
import { useBulkInsert } from "@/hooks/useItems"
import { IMPORT_TEMPLATE, parseImportCsv } from "@/lib/csv"

export function ImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { user } = useAuth()
  const bulk = useBulkInsert()
  const [text, setText] = useState("")
  const [errors, setErrors] = useState<string[]>([])
  const [showHelp, setShowHelp] = useState(false)

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setText(String(reader.result ?? ""))
    reader.readAsText(file)
  }

  async function doImport() {
    const { rows, errors } = parseImportCsv(text)
    setErrors(errors)
    if (rows.length === 0) {
      toast.error("Nothing to import", {
        description: errors[0] ?? "No valid rows found.",
      })
      return
    }
    try {
      const withCreator = rows.map((r) => ({ ...r, created_by: user?.id }))
      await bulk.mutateAsync(withCreator)
      toast.success(`Imported ${rows.length} item${rows.length === 1 ? "" : "s"}`, {
        description: errors.length ? `${errors.length} row(s) skipped.` : undefined,
      })
      setText("")
      onOpenChange(false)
    } catch (e) {
      toast.error("Import failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Import items from CSV
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6"
              title="What should the CSV contain?"
              onClick={() => setShowHelp((s) => !s)}
            >
              <Info className="size-4 text-muted-foreground" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Add the first row as column headers, then one row per item. Click the
            <Info className="mx-1 inline size-3.5" />icon for the full column guide.
          </DialogDescription>
        </DialogHeader>

        {showHelp && (
          <div className="rounded-lg border bg-muted/30 p-3 text-xs">
            <p className="mb-2 font-medium text-foreground">CSV columns</p>
            <ul className="flex flex-col gap-1 text-muted-foreground">
              <li>
                <code className="text-foreground">system</code> —{" "}
                <strong>required.</strong> One of AV, PAVA, IPTV, SCREENS (or any
                system you've added in Admin).
              </li>
              <li>
                <code className="text-foreground">location</code> — room / zone
                code (e.g. L03-005)
              </li>
              <li>
                <code className="text-foreground">sno</code> — line number
                (optional)
              </li>
              <li>
                <code className="text-foreground">brand</code> — make (e.g.
                Samsung, Bosch)
              </li>
              <li>
                <code className="text-foreground">model_no</code> — model number
              </li>
              <li>
                <code className="text-foreground">description</code> — item
                description
              </li>
              <li>
                <code className="text-foreground">qty_required</code> — quantity
                needed (number)
              </li>
              <li>
                <code className="text-foreground">supplier</code>,{" "}
                <code className="text-foreground">eta</code> (YYYY-MM-DD),{" "}
                <code className="text-foreground">notes</code> — optional
              </li>
            </ul>
            <p className="mt-2 text-muted-foreground">
              Statuses default to “not started / pending” and are set inside the
              app. Use <strong>Load template</strong> below for a ready example.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <label className="cursor-pointer">
                <Upload className="size-4" />
                Choose file
                <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
              </label>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setText(IMPORT_TEMPLATE)}
            >
              Load template
            </Button>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">CSV content</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              className="font-mono text-xs"
              placeholder="Paste CSV here, or choose a file above…"
            />
          </div>

          {errors.length > 0 && (
            <div className="max-h-28 overflow-y-auto rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
              {errors.map((e, i) => (
                <div key={i}>{e}</div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={doImport} disabled={bulk.isPending || !text.trim()}>
            {bulk.isPending && <Loader2 className="size-4 animate-spin" />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
