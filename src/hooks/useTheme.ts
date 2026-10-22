import { useEffect, useState } from "react"

export type ThemeMode = "light" | "dark" | "system"
const KEY = "ft-theme"

function read(): ThemeMode {
  try {
    const v = localStorage.getItem(KEY)
    return v === "dark" || v === "light" || v === "system" ? v : "light"
  } catch {
    return "light"
  }
}

function apply(mode: ThemeMode) {
  const dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  document.documentElement.classList.toggle("dark", dark)
}

/** Light, dark or follow the device. Saved per browser. */
export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(read)

  useEffect(() => {
    apply(mode)
    try {
      localStorage.setItem(KEY, mode)
    } catch {
      /* not saved — still applied for this visit */
    }
    if (mode !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => apply("system")
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [mode])

  return { mode, setMode }
}

/** Apply the saved theme before React renders (avoids a flash). */
export function applySavedTheme() {
  apply(read())
}
