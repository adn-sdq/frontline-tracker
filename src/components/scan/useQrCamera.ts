import { useCallback, useEffect, useRef, useState, type RefObject } from "react"
import jsQR from "jsqr"

type Detector = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> }
declare global {
  interface Window {
    BarcodeDetector?: new (opts: { formats: string[] }) => Detector
  }
}

export type CameraState = "idle" | "starting" | "on" | "denied"

/**
 * Rear camera → QR text. Uses the browser's native BarcodeDetector when there
 * is one (Chrome/Android), otherwise decodes frames with jsQR. `paused` stops
 * decoding without releasing the camera (e.g. while a lookup runs).
 */
export function useQrCamera(videoRef: RefObject<HTMLVideoElement | null>, onCode: (text: string) => void, paused: boolean) {
  const streamRef = useRef<MediaStream | null>(null)
  const [state, setState] = useState<CameraState>("idle")
  const onCodeRef = useRef(onCode)
  onCodeRef.current = onCode

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setState((s) => (s === "denied" ? s : "idle"))
  }, [])

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) return setState("denied")
    setState("starting")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      streamRef.current = stream
      const v = videoRef.current
      if (!v) return stream.getTracks().forEach((t) => t.stop())
      v.srcObject = stream
      await v.play()
      setState("on")
    } catch {
      setState("denied")
    }
  }, [videoRef])

  useEffect(() => {
    if (state !== "on" || paused) return
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!
    const native = window.BarcodeDetector ? new window.BarcodeDetector({ formats: ["qr_code"] }) : null
    let raf = 0
    let last = 0
    let busy = false

    const tick = async (t: number) => {
      raf = requestAnimationFrame(tick)
      if (busy || t - last < 150 || video.readyState < 2) return
      last = t
      busy = true
      try {
        if (native) {
          const found = await native.detect(video)
          if (found[0]?.rawValue) onCodeRef.current(found[0].rawValue)
        } else if (video.videoWidth) {
          const w = video.videoWidth
          const h = video.videoHeight
          canvas.width = w
          canvas.height = h
          ctx.drawImage(video, 0, 0, w, h)
          const code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "dontInvert" })
          if (code?.data) onCodeRef.current(code.data)
        }
      } catch {
        /* a bad frame is fine */
      } finally {
        busy = false
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [state, paused, videoRef])

  useEffect(() => stop, [stop])

  return { state, start, stop }
}
