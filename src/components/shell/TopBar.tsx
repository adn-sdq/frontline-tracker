import { useEffect, useState } from "react"
import { Menu, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { SidebarContent } from "@/components/shell/AppSidebar"
import { CommandPalette } from "@/components/shell/CommandPalette"

export function TopBar({
  actionsContainerRef,
}: {
  actionsContainerRef?: ((el: HTMLDivElement | null) => void) | null
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
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
      <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-3 md:px-4">
        {/* Left group grows to fill, keeping the search a fixed max width so it
            never resizes as page actions change on the right. */}
        <div className="flex flex-1 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </Button>

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex h-9 w-full max-w-md items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground transition-colors hover:border-primary-hover"
          >
            <Search className="size-4 shrink-0" />
            <span className="flex-1 truncate text-left">Search pages, projects…</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">⌘ K</span>
          </button>
        </div>

        {/* Page-specific action buttons, injected per-page via <PageActions> portal */}
        <div ref={actionsContainerRef} className="flex shrink-0 items-center gap-1.5" />
      </header>

      {/* Mobile nav sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  )
}
