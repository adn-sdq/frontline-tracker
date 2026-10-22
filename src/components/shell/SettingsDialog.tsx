import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Link } from "react-router-dom"
import {
  Bell,
  Check,
  ChevronRight,
  Copy,
  Globe,
  Home,
  Keyboard,
  Link2,
  Lock,
  Menu,
  MessageCircle,
  Monitor,
  Moon,
  Paintbrush,
  Settings as SettingsIcon,
  Sun,
  Video,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Checkbox } from "@/components/ui/checkbox"
import { useShell } from "@/contexts/ShellContext"
import { useTheme, type ThemeMode } from "@/hooks/useTheme"
import { APP_VERSION, APP_VERSION_DATE } from "@/lib/version"
import { cn } from "@/lib/utils"

export const SETTINGS_SECTIONS = [
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "navigation", label: "Navigation", icon: Menu },
  { id: "home", label: "Home", icon: Home },
  { id: "appearance", label: "Appearance", icon: Paintbrush },
  { id: "messages", label: "Messages & media", icon: MessageCircle },
  { id: "language", label: "Language & region", icon: Globe },
  { id: "accessibility", label: "Accessibility", icon: Keyboard },
  { id: "read", label: "Mark as read", icon: Check },
  { id: "audio", label: "Audio & video", icon: Video },
  { id: "accounts", label: "Connected accounts", icon: Link2 },
  { id: "privacy", label: "Privacy & visibility", icon: Lock },
  { id: "advanced", label: "Advanced", icon: SettingsIcon },
] as const
export type SettingsSection = (typeof SETTINGS_SECTIONS)[number]["id"]

function Panel({ title, hint, children }: { title: string; hint?: string; children?: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {hint && <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>}
      {children && <div className="mt-4">{children}</div>}
    </section>
  )
}

function Soon({ what }: { what: string }) {
  return (
    <Panel title="Coming soon" hint={`${what} settings will live here. Nothing to change yet.`}>
      <div className="grid gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-10 rounded-lg bg-muted/60" />
        ))}
      </div>
    </Panel>
  )
}

function Appearance() {
  const { mode, setMode } = useTheme()
  const opts: { v: ThemeMode; label: string; icon: typeof Sun }[] = [
    { v: "light", label: "Light", icon: Sun },
    { v: "dark", label: "Dark", icon: Moon },
    { v: "system", label: "Match device", icon: Monitor },
  ]
  return (
    <Panel title="Theme" hint="Saved on this browser.">
      <div className="grid grid-cols-3 gap-2">
        {opts.map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => setMode(o.v)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50",
              mode === o.v && "border-primary bg-primary/5 font-medium"
            )}
          >
            <o.icon className="size-5" />
            {o.label}
          </button>
        ))}
      </div>
    </Panel>
  )
}

function Navigation() {
  const { collapsed, setCollapsed } = useShell()
  return (
    <Panel title="Sidebar" hint="Icons only gives the page more room. You can also use the button at the top left.">
      <label className="flex cursor-pointer items-center gap-3 text-sm">
        <Checkbox checked={collapsed} onCheckedChange={(v) => setCollapsed(!!v)} />
        Show the sidebar as icons only
      </label>
    </Panel>
  )
}

function ConnectedAccounts() {
  const url = "https://jtsromruhlsflxykcpwh.supabase.co/functions/v1/fit-mcp"
  return (
    <Panel title="Claude" hint="Ask Claude about your projects, items and documents. Read-only — it sees only what you can see.">
      <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-2">
        <code className="min-w-0 flex-1 truncate text-xs">{url}</code>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(url).then(() => toast.success("Connector address copied"))}
          className="grid size-7 shrink-0 place-items-center rounded-md hover:bg-accent"
          aria-label="Copy connector address"
        >
          <Copy className="size-3.5" />
        </button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        On claude.ai: Settings → Connectors → Add custom connector, paste this address, then sign in with your FIT email.
      </p>
    </Panel>
  )
}

function Advanced() {
  return (
    <Panel title="About FIT">
      <dl className="grid grid-cols-[7rem_1fr] gap-y-2 text-sm">
        <dt className="text-muted-foreground">Version</dt>
        <dd>
          <Link to="/changelog" className="font-mono underline-offset-4 hover:underline">{APP_VERSION}</Link>
          <span className="ml-2 text-muted-foreground">{APP_VERSION_DATE}</span>
        </dd>
        <dt className="text-muted-foreground">Guides</dt>
        <dd><Link to="/docs" className="underline-offset-4 hover:underline">Engineering reference</Link></dd>
      </dl>
    </Panel>
  )
}

/**
 * Settings window: section list on the left, the chosen section on the right.
 * Most sections are placeholders for now; Appearance, Navigation, Connected
 * accounts and Advanced already work.
 */
export function SettingsDialog({
  open,
  onOpenChange,
  section,
  onSection,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  section: SettingsSection
  onSection: (s: SettingsSection) => void
}) {
  const current = SETTINGS_SECTIONS.find((s) => s.id === section) ?? SETTINGS_SECTIONS[0]

  const body =
    section === "appearance" ? <Appearance /> :
    section === "navigation" ? <Navigation /> :
    section === "accounts" ? <ConnectedAccounts /> :
    section === "advanced" ? <Advanced /> :
    <Soon what={current.label} />

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 z-50 flex h-[min(42rem,88svh)] w-[min(60rem,94vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 md:flex-row"
        >
          {/* Section list */}
          <nav className="flex shrink-0 gap-1 overflow-x-auto border-b bg-sidebar p-2 md:w-64 md:flex-col md:overflow-y-auto md:border-r md:border-b-0 md:p-3">
            {SETTINGS_SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSection(s.id)}
                className={cn(
                  "flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  section === s.id ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <s.icon className="size-4 shrink-0" />
                <span className="whitespace-nowrap">{s.label}</span>
              </button>
            ))}
          </nav>

          {/* Section */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center gap-2 px-6 pt-5 pb-4">
              <DialogPrimitive.Title className="flex min-w-0 items-center gap-1.5 text-sm">
                <span className="text-muted-foreground">Settings</span>
                <ChevronRight className="size-3.5 text-muted-foreground" />
                <span className="truncate font-medium">{current.label}</span>
              </DialogPrimitive.Title>
              <DialogPrimitive.Close
                className="ml-auto grid size-8 place-items-center rounded-md border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Close settings"
              >
                <X className="size-4" />
              </DialogPrimitive.Close>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pb-6">{body}</div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
