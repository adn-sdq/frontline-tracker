import { useNavigate } from "react-router-dom"
import { BookOpen, Check, FolderOpen, History } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/contexts/AuthContext"
import { useProject } from "@/contexts/ProjectContext"
import { navSectionsFor } from "@/lib/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { projects, currentProjectId, setCurrentProject } = useProject()
  const sections = navSectionsFor(profile)

  function run(fn: () => void) {
    onOpenChange(false)
    fn()
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Search" description="Jump to a page or project">
      <CommandInput placeholder="Search pages, projects…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Go to">
          {sections
            .flatMap((s) => s.items)
            .filter((i) => !i.soon)
            .map((item) => {
              const Icon = item.icon
              return (
                <CommandItem key={item.to} onSelect={() => run(() => navigate(item.to))}>
                  <Icon /> {item.label}
                </CommandItem>
              )
            })}
        </CommandGroup>
        {projects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Switch project">
              {projects.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`project ${p.name}`}
                  onSelect={() =>
                    run(() => {
                      setCurrentProject(p.id)
                      toast.success(`Switched to ${p.name}`)
                    })
                  }
                >
                  <FolderOpen />
                  <span className="flex-1 truncate">{p.name}</span>
                  {p.id === currentProjectId && <Check className="text-primary" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        <CommandSeparator />
        <CommandGroup heading="Help">
          <CommandItem onSelect={() => run(() => navigate("/docs"))}>
            <BookOpen /> Docs
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate("/changelog"))}>
            <History /> Changelog
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
