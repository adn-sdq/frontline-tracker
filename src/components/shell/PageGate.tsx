import { useEffect, useState, type ReactNode } from "react"
import { useIsFetching } from "@tanstack/react-query"

import { FitLogo } from "@/components/FitLogo"
import { cn } from "@/lib/utils"

/** Shortest time the loader shows — so the loader always completes, even when data is instant. */
const MIN_MS = 1000
/** Longest wait before revealing the page anyway (it shows its own states). */
const MAX_MS = 8000

/**
 * Wraps a freshly mounted page. The page renders (so its queries start) but
 * stays hidden behind a loader until its first fetches settle, so the UI and
 * its data appear together. Remount it per route via `key`.
 */
export function PageGate({ children }: { children: ReactNode }) {
  const fetching = useIsFetching()
  const [minDone, setMinDone] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const a = window.setTimeout(() => setMinDone(true), MIN_MS)
    const b = window.setTimeout(() => setTimedOut(true), MAX_MS)
    return () => {
      window.clearTimeout(a)
      window.clearTimeout(b)
    }
  }, [])

  // Once revealed, stay revealed — background refetches use the top bar.
  useEffect(() => {
    if (!ready && ((minDone && fetching === 0) || timedOut)) setReady(true)
  }, [ready, minDone, fetching, timedOut])

  return (
    <div className="relative">
      {!ready && (
        <div className="absolute inset-x-0 top-0 flex min-h-[60svh] flex-col items-center justify-center gap-4" role="status" aria-label="Loading">
          <FitLogo size={36} className="animate-pulse" />
          <div className="h-0.5 w-32 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/3 animate-[loader-slide_1s_ease-in-out_infinite] rounded-full bg-primary" />
          </div>
        </div>
      )}
      <div
        aria-hidden={!ready}
        className={cn("transition-opacity duration-300", ready ? "opacity-100" : "pointer-events-none opacity-0")}
      >
        {children}
      </div>
    </div>
  )
}

/** Thin top progress bar shown whenever any query is fetching. */
export function FetchProgressBar() {
  const fetching = useIsFetching()
  return (
    <div className={cn("pointer-events-none absolute inset-x-0 top-0 z-50 h-0.5 overflow-hidden transition-opacity", fetching ? "opacity-100" : "opacity-0")}>
      <div className="h-full w-1/3 animate-[loader-slide_1s_ease-in-out_infinite] bg-primary" />
    </div>
  )
}

/** True once `ms` has elapsed since mount — for enforcing a minimum loader time. */
export function useMinDelay(ms = MIN_MS) {
  const [done, setDone] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setDone(true), ms)
    return () => window.clearTimeout(t)
  }, [ms])
  return done
}

/** Full-screen branded loader (pages outside the app shell). */
export function FullPageLoader() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background" role="status" aria-label="Loading">
      <FitLogo size={40} className="animate-pulse" />
      <div className="h-0.5 w-32 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/3 animate-[loader-slide_1s_ease-in-out_infinite] rounded-full bg-primary" />
      </div>
    </div>
  )
}
