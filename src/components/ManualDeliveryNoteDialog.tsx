import { useEffect, useState } from "react"
import { Loader2, Paperclip, X } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileDropzone } from "@/components/ui/file-dropzone"
import { DatePicker } from "@/components/DatePicker"
import { useCreateManualDn, useNextDnNumber } from "@/hooks/useDeliveryNotes"
import { cn, errorMessage } from "@/lib/utils"
import type { DnFileKind } from "@/lib/types"

const today = () => new Date().toISOString().slice(0, 10)

/** Record a delivery note that was made outside the app by uploading it. */
export function ManualDeliveryNoteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const create = useCreateManualDn()
  const { data: nextNo } = useNextDnNumber()
  const [number, setNumber] = useState("")
  const [date, setDate] = useState(today())
  const [deliverTo, setDeliverTo] = useState("")
  const [location, setLocation] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [kind, setKind] = useState<DnFileKind>("unsigned")

  useEffect(() => {
    if (!open) return
    setNumber("")
    setDate(today())
    setDeliverTo("")
    setLocation("")
    setFiles([])
    setKind("unsigned")
  }, [open])

  async function submit() {
    if (files.length === 0) return toast.error("Add at least one file")
    try {
      await create.mutateAsync({
        dn_number: number,
        dn_date: date,
        deliver_to: deliverTo.trim() || null,
        location: location.trim() || null,
        files,
        kind,
      })
      toast.success(`Delivery note added as ${kind}`)
      onOpenChange(false)
    } catch (e) {
      toast.error("Could not add delivery note", { description: errorMessage(e) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload existing delivery note</DialogTitle>
          <DialogDescription>For notes made outside the app. Mark whether what you upload is signed.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">DN number</Label>
            <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder={nextNo ? String(nextNo) : "Auto"} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Date</Label>
            <DatePicker value={date} onChange={setDate} clearable={false} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Delivered to</Label>
            <Input value={deliverTo} onChange={(e) => setDeliverTo(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">These files are</span>
            <div className="inline-flex rounded-sm border p-0.5" role="radiogroup" aria-label="Signed or unsigned">
              {(["unsigned", "signed"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={kind === k}
                  onClick={() => setKind(k)}
                  className={cn(
                    "rounded-[2px] px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                    kind === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
          <FileDropzone multiple compact disabled={create.isPending} onFiles={(p) => setFiles((prev) => [...prev, ...p])} hint="PDF, scans or photos" />
          {files.map((f, i) => (
            <div key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-md border p-2 text-sm">
              <Paperclip className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 break-all">{f.name}</span>
              <Button type="button" variant="ghost" size="icon" className="size-6 text-destructive" aria-label={`Remove ${f.name}`} onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}>
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending || files.length === 0}>
            {create.isPending && <Loader2 className="size-4 animate-spin" />}
            Add delivery note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
