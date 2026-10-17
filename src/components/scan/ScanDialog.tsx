import { useEffect, useRef, useState } from "react"
import { ArrowLeft, Camera, CameraOff, Loader2, ScanLine, Search } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { UnitPanel } from "@/components/scan/UnitPanel"
import { useQrCamera } from "@/components/scan/useQrCamera"
import { resolveTag } from "@/hooks/useUnits"
import { extractTag, unitTag } from "@/lib/tags"
import { errorMessage } from "@/lib/utils"

/**
 * The only way into a unit from a QR label: labels hold an app-only code, so
 * a phone camera shows nothing useful. Pass `initialTag` to open a unit
 * directly (e.g. from a serial chip).
 */
export function ScanDialog({
  open,
  onOpenChange,
  initialTag,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTag?: string | null
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [tag, setTag] = useState<string | null>(null)
  const [text, setText] = useState("")
  const [looking, setLooking] = useState(false)
  const lastMiss = useRef<{ v: string; at: number }>({ v: "", at: 0 })
  const camera = useQrCamera(videoRef, (code) => void lookup(code, true), looking || !!tag)

  useEffect(() => {
    if (!open) {
      camera.stop()
      setTag(null)
      setText("")
      return
    }
    if (initialTag) setTag(initialTag)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialTag])

  async function lookup(raw: string, fromCamera = false) {
    const value = extractTag(raw)
    if (!value || looking) return
    if (fromCamera && lastMiss.current.v === value && Date.now() - lastMiss.current.at < 4000) return
    setLooking(true)
    try {
      const hit = await resolveTag(value)
      if (!hit?.item.sku) {
        lastMiss.current = { v: value, at: Date.now() }
        toast.error("Not recognised", { description: `“${value}” isn't a SKU, unit tag or serial number in your projects.` })
        return
      }
      camera.stop()
      setTag(hit.unit && hit.item.tracking !== "lot" ? unitTag(hit.item.sku, hit.unit) : hit.item.sku)
    } catch (e) {
      toast.error("Lookup failed", { description: errorMessage(e) })
    } finally {
      setLooking(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {tag && !initialTag && (
              <Button variant="ghost" size="icon" className="-ml-2 size-7" onClick={() => setTag(null)} aria-label="Scan another">
                <ArrowLeft className="size-4" />
              </Button>
            )}
            {tag ? "Unit" : "Scan a label"}
          </DialogTitle>
          {!tag && (
            <DialogDescription>Point the camera at a FIT label, or type a SKU, unit tag or serial number.</DialogDescription>
          )}
        </DialogHeader>

        {tag ? (
          <UnitPanel tag={tag} />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-neutral-950">
              <video ref={videoRef} playsInline muted className={camera.state === "on" ? "size-full object-cover" : "hidden"} />
              {camera.state === "on" && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="size-3/5 rounded-xl border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
                </div>
              )}
              {camera.state !== "on" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white/85">
                  {camera.state === "denied" ? <CameraOff className="size-7" /> : <ScanLine className="size-7" />}
                  <p className="max-w-60 text-sm">
                    {camera.state === "denied" ? "Camera unavailable. Allow camera access, or type below." : "Scans aren't recorded."}
                  </p>
                  <Button variant="secondary" size="sm" onClick={camera.start} disabled={camera.state === "starting"}>
                    {camera.state === "starting" ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
                    {camera.state === "denied" ? "Try again" : "Start camera"}
                  </Button>
                </div>
              )}
              {looking && (
                <div className="absolute inset-0 grid place-items-center bg-black/40">
                  <Loader2 className="size-7 animate-spin text-white" />
                </div>
              )}
            </div>

            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                void lookup(text)
              }}
            >
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="MP-0042-03 or serial"
                  className="pl-8 font-mono"
                  autoComplete="off"
                  autoCapitalize="characters"
                />
              </div>
              <Button type="submit" disabled={!text.trim() || looking}>Find</Button>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
