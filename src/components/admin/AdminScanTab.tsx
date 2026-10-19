import { useState } from "react"
import { QrCode, ScanLine } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScanDialog } from "@/components/scan/ScanDialog"

/** Scanning lives here only: admins look up a FIT label, SKU, unit tag or serial. */
export function AdminScanTab() {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border bg-card px-6 py-12 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <QrCode className="size-7" />
      </div>
      <div className="max-w-sm">
        <h2 className="font-semibold">Scan a label</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Point the camera at a FIT QR label, or type a SKU, unit tag or serial number. Works best from the installed
          app on a phone. Scans aren't recorded.
        </p>
      </div>
      <Button size="lg" onClick={() => setOpen(true)}>
        <ScanLine className="size-5" /> Open scanner
      </Button>
      <ScanDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}
