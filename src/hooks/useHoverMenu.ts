import { useRef, useState } from "react"

/** Open a dropdown on hover (with a short grace period) as well as on click/tap. */
export function useHoverMenu(delay = 160) {
  const [open, setOpen] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const show = () => {
    window.clearTimeout(timer.current)
    setOpen(true)
  }
  const hide = () => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setOpen(false), delay)
  }
  return { open, setOpen, hoverProps: { onMouseEnter: show, onMouseLeave: hide } }
}
