import { createContext, useContext } from "react"

/** App-shell state shared by the sidebar, top bar and settings. */
export interface ShellState {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  /** Desktop: collapse/expand the rail. Mobile: open the drawer. */
  toggleSidebar: () => void
  openSettings: (section?: string) => void
}

export const ShellContext = createContext<ShellState | null>(null)

export function useShell(): ShellState {
  const ctx = useContext(ShellContext)
  if (!ctx) throw new Error("useShell must be used inside AppLayout")
  return ctx
}
