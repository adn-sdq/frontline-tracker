import { useEffect, useState } from "react"
import { PanelLeft, Search } from "lucide-react"

import { Breadcrumbs } from "@/components/shell/Breadcrumbs"
import { CommandPalette } from "@/components/shell/CommandPalette"
import { useShell } from "@/contexts/ShellContext"

/**
 * One row, three jobs, by how often they're used:
 *   left   — sidebar toggle + where you are (breadcrumb; the project crumb switches project)
 *   centre — search / jump (⌘K), compact so it doesn't compete with the page
 *   right  — this page's own actions (Create lives in the sidebar's Quick actions)
 */
export function TopBar({
  actionsContainerRef,
}: {
  actionsContainerRef?: ((el: HTMLDivElement | null) => void) | null
}) {
  const { toggleSidebar } = useShell()
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <>
      <header className="grid h-14 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-3 md:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
            className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <PanelLeft className="size-4.5" />
          </button>
          <span className="hidden h-5 w-px shrink-0 bg-border sm:block" />
          <Breadcrumbs />
        </div>

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          aria-label="Search"
          className="flex h-8 items-center gap-2 rounded-lg border border-input bg-background px-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground md:w-64 lg:w-80"
        >
          <Search className="size-4 shrink-0" />
          <span className="hidden flex-1 text-left md:inline">Search or jump to…</span>
          <kbd className="hidden rounded border bg-muted px-1.5 font-sans text-[10px] lg:inline">⌘K</kbd>
        </button>

        <div className="flex min-w-0 items-center justify-end gap-1.5">
          {/* Page-specific actions, injected per page via <PageActions> */}
          <div ref={actionsContainerRef} className="flex min-w-0 items-center gap-1.5" />
        </div>
      </header>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  )
}
