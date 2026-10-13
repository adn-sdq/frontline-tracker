import { cn } from "@/lib/utils"

// Same geometry as FitLogo; each path is normalised to length 1 so the
// stroke-draw animation in index.css works regardless of path size.
const PATHS = [
  { d: "M8.50024 8.5L193.046 191.886L8.50024 375.273H104.519L277.905 191.886L104.519 8.5H8.50024Z", navy: true },
  { d: "M257.214 8.5H161.195L257.962 113.166H342.879L296.276 66.5628H445.187L503.25 8.5H257.214Z", navy: false },
  { d: "M291.159 149.073L330.741 191.886L161.195 375.273H250.214L421.6 191.886L378.786 149.073H291.159Z", navy: false },
]

/** Animated FIT mark with a soft glow and a progress bar — used by every loader. */
export function BrandLoader({ size = 120, className }: { size?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-6", className)} role="status" aria-label="Loading">
      <div className="relative flex items-center justify-center" style={{ width: size * 1.6, height: size * 1.2 }}>
        <div
          aria-hidden
          className="fit-loader-glow absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgba(227,124,48,0.35),transparent)] blur-xl"
        />
        <svg
          width={size}
          height={Math.round(size * 0.75)}
          viewBox="0 0 512 384"
          fill="none"
          className="relative text-[#1B354F] dark:text-slate-100"
          aria-hidden
        >
          {PATHS.map((p, i) => (
            <path
              key={i}
              d={p.d}
              pathLength={1}
              className="fit-loader-path"
              style={{ animationDelay: `${i * 0.18}s` }}
              stroke={p.navy ? "currentColor" : "#E37C30"}
              strokeWidth="17"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>
      </div>
      <div className="fit-loader-rise flex flex-col items-center gap-3" style={{ animationDelay: "0.2s" }}>
        <div className="h-1 w-56 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/3 animate-[loader-slide_1.1s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-[#E37C30] via-[#E37C30] to-[#1B354F] dark:to-slate-200" />
        </div>
        <span className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Frontline Internal Tools
        </span>
      </div>
    </div>
  )
}
