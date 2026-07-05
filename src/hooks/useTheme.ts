import { useEffect, useState } from "react"

export function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem("ft-theme") === "dark")
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    localStorage.setItem("ft-theme", dark ? "dark" : "light")
  }, [dark])
  return { dark, toggle: () => setDark((d) => !d) }
}
