import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

// Deterministic, readable palette for initials fallbacks. Each user maps to a
// stable colour derived from their name/id, so avatars without a photo stay
// distinct and consistent across the app instead of a uniform grey.
const PALETTE = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-orange-100 text-orange-700",
  "bg-teal-100 text-teal-700",
  "bg-indigo-100 text-indigo-700",
  "bg-fuchsia-100 text-fuchsia-700",
] as const

function hashString(input: string) {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

// Deterministic background/text palette class for a given seed (name or id).
export function avatarColor(seed?: string | null) {
  return PALETTE[hashString(seed || "?") % PALETTE.length]
}

export function initials(name?: string | null) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?"
}

/**
 * Shared user avatar. Renders the photo when available, otherwise deterministic
 * coloured initials. Pass `seed` (e.g. a user id) to keep the colour stable even
 * when the display name changes.
 */
export function UserAvatar({
  name,
  src,
  seed,
  className,
  fallbackClassName,
}: {
  name?: string | null
  src?: string | null
  seed?: string | null
  className?: string
  fallbackClassName?: string
}) {
  const display = name ?? "?"
  const color = PALETTE[hashString(seed || display) % PALETTE.length]

  return (
    <Avatar className={className}>
      {src && <AvatarImage src={src} alt={display} className="object-cover" />}
      <AvatarFallback className={cn("font-semibold uppercase", color, fallbackClassName)}>
        {initials(display)}
      </AvatarFallback>
    </Avatar>
  )
}
