import { useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Code2,
  Database,
  Globe,
  Layers,
  PackageCheck,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// ── Doc structure ─────────────────────────────────────────────────────────────

interface DocSection {
  id: string
  label: string
  icon: typeof BookOpen
  pages: DocPage[]
}

interface DocPage {
  id: string
  label: string
  badge?: string
  content: React.ReactNode
}

// ── Content components ────────────────────────────────────────────────────────

function Heading({ children }: { children: React.ReactNode }) {
  return <h1 className="text-2xl font-bold tracking-tight mb-2">{children}</h1>
}

function Lead({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground text-base mb-6 leading-relaxed">{children}</p>
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold mt-8 mb-3">{children}</h2>
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold mt-5 mb-2">{children}</h3>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground leading-relaxed mb-3">{children}</p>
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
      {children}
    </code>
  )
}

function Pre({ children }: { children: React.ReactNode }) {
  return (
    <pre className="my-4 overflow-x-auto rounded-lg border bg-muted p-4 text-xs font-mono leading-relaxed">
      {children}
    </pre>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 rounded-lg border-l-4 border-blue-500 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
      {children}
    </div>
  )
}

function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 rounded-lg border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
      {children}
    </div>
  )
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul className="my-3 space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm text-muted-foreground">
          <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function KV({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <div className="my-4 overflow-hidden rounded-lg border divide-y">
      {rows.map(([key, val]) => (
        <div key={key} className="flex gap-4 px-4 py-2.5 text-sm">
          <span className="w-40 shrink-0 font-medium">{key}</span>
          <span className="text-muted-foreground">{val}</span>
        </div>
      ))}
    </div>
  )
}

// ── Pages content ─────────────────────────────────────────────────────────────

const DOCS: DocSection[] = [
  {
    id: "getting-started",
    label: "Getting Started",
    icon: BookOpen,
    pages: [
      {
        id: "introduction",
        label: "Introduction",
        content: (
          <>
            <Heading>Introduction</Heading>
            <Lead>
              Frontline Tracker is a procurement and installation coordination tool
              built for MiSK Ilmi. It replaces the shared Excel BOQ workbooks with a
              real-time, attributed, multi-user web app.
            </Lead>
            <H2>What it does</H2>
            <Ul items={[
              "Track AV, PAVA, IPTV, and Screens equipment from purchase order through to commissioning",
              "Generate Frontline Solutions–branded delivery notes as print-ready PDFs",
              "Manage the document register (shop drawings, O&M manuals, submittals, etc.)",
              "Role-based access — admins see everything, Firstfix users see Documents only",
              "Full edit history with attribution on every line item",
            ]} />
            <H2>Tech stack</H2>
            <KV rows={[
              ["Frontend", "React 19, Vite 8, TypeScript 6, Tailwind v4, shadcn/ui"],
              ["State / data", "TanStack Query 5, React Router 7 (HashRouter)"],
              ["Backend", "Supabase (Postgres, Auth, Realtime, Storage)"],
              ["Hosting", "GitHub Pages via GitHub Actions"],
              ["Repo", "adn-sdq/frontline-tracker (private)"],
            ]} />
            <Note>
              HashRouter is required because GitHub Pages has no server-side URL rewriting.
              All routes are hash-based — <Code>/#/documents</Code>, <Code>/#/admin</Code>, etc.
            </Note>
          </>
        ),
      },
      {
        id: "local-setup",
        label: "Local setup",
        content: (
          <>
            <Heading>Local setup</Heading>
            <Lead>Get the dev server running in under five minutes.</Lead>
            <H2>Prerequisites</H2>
            <Ul items={[
              "Node.js 20+",
              "npm 10+",
              "Git",
              "Access to the private GitHub repo",
            ]} />
            <H2>1. Clone and install</H2>
            <Pre>{`git clone https://github.com/adn-sdq/frontline-tracker.git
cd frontline-tracker
npm install`}</Pre>
            <H2>2. Environment variables</H2>
            <P>Copy the example and fill in the values (ask the project admin for keys):</P>
            <Pre>{`cp .env.example .env`}</Pre>
            <Pre>{`VITE_SUPABASE_URL=https://jtsromruhlsflxykcpwh.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>`}</Pre>
            <Warn>
              Never put the <Code>service_role</Code> key in the frontend. It bypasses all RLS policies.
            </Warn>
            <H2>3. Start the dev server</H2>
            <Pre>{`npm run dev`}</Pre>
            <P>The app runs at <Code>http://localhost:5173</Code>. Log in with your <Code>username@ilmi.local</Code> credentials.</P>
          </>
        ),
      },
      {
        id: "branch-workflow",
        label: "Branch workflow",
        content: (
          <>
            <Heading>Branch workflow</Heading>
            <Lead>Two branches, one rule: never commit directly to main.</Lead>
            <KV rows={[
              ["production", "All active development. Every commit here is a small, shippable change."],
              ["main", "Live site (GitHub Pages). Only updated via merge from production."],
            ]} />
            <H2>Daily workflow</H2>
            <Pre>{`git checkout production   # always work here
# ... make changes, commit ...
git push origin production`}</Pre>
            <H2>Releasing</H2>
            <P>Only when explicitly ready to ship:</P>
            <Pre>{`git checkout main
git merge production --no-ff -m "release: vX.Y.Z"
git push origin main
git checkout production`}</Pre>
            <P>Then tag and push to trigger the GitHub Release automation:</P>
            <Pre>{`git tag vX.Y.Z main
git push origin vX.Y.Z`}</Pre>
            <H2>Version numbering</H2>
            <KV rows={[
              ["PATCH (0.1.x)", "Bug fixes, copy changes, small UI tweaks"],
              ["MINOR (0.x.0)", "New features, meaningful UX changes"],
              ["MAJOR (x.0.0)", "Architectural changes, breaking changes, major redesigns"],
            ]} />
          </>
        ),
      },
    ],
  },
  {
    id: "architecture",
    label: "Architecture",
    icon: Layers,
    pages: [
      {
        id: "overview",
        label: "Overview",
        badge: "WIP",
        content: (
          <>
            <Heading>Architecture Overview</Heading>
            <Lead>High-level structure of how the frontend and backend fit together.</Lead>
            <Note>This section is a work in progress. More detail coming soon.</Note>
            <H2>Frontend structure</H2>
            <Pre>{`src/
├── assets/        # Static assets (base64 logo, etc.)
├── components/    # Shared UI components
│   └── ui/        # shadcn/ui primitives
├── contexts/      # React contexts (Auth, Project)
├── hooks/         # TanStack Query data hooks
├── lib/           # Types, utils, Supabase client
└── pages/         # Route-level page components`}</Pre>
            <H2>Data flow</H2>
            <Ul items={[
              "All data fetching goes through TanStack Query hooks in src/hooks/",
              "Mutations call Supabase directly — no custom API layer",
              "Realtime subscriptions live alongside their Query hooks",
              "Optimistic concurrency: update_item RPC checks version field before writing",
            ]} />
          </>
        ),
      },
      {
        id: "routing",
        label: "Routing",
        content: (
          <>
            <Heading>Routing</Heading>
            <Lead>React Router 7 with HashRouter. All routes defined in App.tsx.</Lead>
            <KV rows={[
              ["/login", "Public — sign in"],
              ["/projects", "Authenticated — project picker"],
              ["/", "Tracker (procurement list)"],
              ["/delivery-notes", "Delivery notes for current project"],
              ["/documents", "Document register"],
              ["/dashboard", "Analytics dashboard"],
              ["/admin", "Admin panel (admins only)"],
              ["/changelog", "Public — release history"],
              ["/docs", "Public — this documentation"],
            ]} />
            <H2>Auth guards</H2>
            <P>
              Routes are guarded by <Code>withProject()</Code> in App.tsx which checks session
              and project selection. Page-level access is controlled by <Code>canAccess(page)</Code>
              which reads <Code>profile.allowed_pages</Code>.
            </P>
          </>
        ),
      },
    ],
  },
  {
    id: "database",
    label: "Database",
    icon: Database,
    pages: [
      {
        id: "schema",
        label: "Schema",
        content: (
          <>
            <Heading>Database Schema</Heading>
            <Lead>Supabase Postgres. All tables have RLS enabled.</Lead>
            <H2>Core tables</H2>
            <H3>profiles</H3>
            <P>One row per auth user. Auto-created via trigger on <Code>auth.users</Code> insert.</P>
            <KV rows={[
              ["id", "uuid — FK to auth.users"],
              ["full_name", "text"],
              ["username", "text — used as login (mapped to username@ilmi.local)"],
              ["org", "text — 'frontline' | 'firstfix'"],
              ["is_admin", "boolean"],
              ["allowed_pages", "text[] — page access control"],
            ]} />
            <H3>projects</H3>
            <KV rows={[
              ["id", "uuid PK"],
              ["name", "text"],
              ["code", "text — short initials, e.g. MI"],
              ["active", "boolean"],
            ]} />
            <H3>items</H3>
            <P>The procurement line items — the core of the app.</P>
            <KV rows={[
              ["unique_id", "text — e.g. AV-001"],
              ["system", "text — AV | PAVA | IPTV | SCREENS | custom"],
              ["brand / model_no / description", "text"],
              ["location", "text"],
              ["procurement_status", "not_started | quoted | po_issued | ordered"],
              ["delivery_status", "pending | partial | delivered"],
              ["installation_status", "not_started | in_progress | installed | commissioned"],
              ["eta", "date"],
              ["version", "int — optimistic concurrency counter"],
            ]} />
            <H3>delivery_notes</H3>
            <KV rows={[
              ["dn_number", "text — DN-MI-20260624-001"],
              ["seq", "int — per-project auto-increment via next_dn_seq() RPC"],
              ["items", "jsonb[] — snapshot of delivered items at time of generation"],
            ]} />
            <H2>Migrations</H2>
            <P>All schema changes live in <Code>supabase/migrations/</Code> as numbered SQL files. Applied via the Supabase Management API (curl), not the CLI.</P>
          </>
        ),
      },
      {
        id: "rls",
        label: "Row Level Security",
        badge: "Important",
        content: (
          <>
            <Heading>Row Level Security</Heading>
            <Lead>Every table has RLS enabled. No anonymous access to data.</Lead>
            <H2>Key policies</H2>
            <H3>items / delivery_notes / documents</H3>
            <Ul items={[
              "SELECT / INSERT / UPDATE / DELETE — authenticated users who are project members",
              "Firstfix users are restricted to Documents only (enforced at the app route level + RLS)",
            ]} />
            <H3>profiles</H3>
            <Ul items={[
              "SELECT — any authenticated user (needed for 'updated by' attribution)",
              "UPDATE — own row only",
            ]} />
            <H3>feature_requests</H3>
            <Ul items={[
              "INSERT — anon + authenticated (public form on login page)",
              "SELECT — authenticated users see own rows; admins see all",
            ]} />
            <Warn>
              The <Code>service_role</Code> key bypasses all RLS. It must never appear in browser code.
              It is only used in server-side contexts (GitHub Actions, Supabase Edge Functions).
            </Warn>
            <H2>Helper functions</H2>
            <KV rows={[
              ["is_admin()", "SECURITY DEFINER — checks profiles.is_admin for current user"],
              ["is_firstfix()", "checks profiles.org = 'firstfix'"],
              ["is_project_member(uuid)", "checks project_members table"],
              ["next_dn_seq(project_id)", "SECURITY DEFINER — atomic per-project delivery note sequence with advisory lock"],
            ]} />
          </>
        ),
      },
    ],
  },
  {
    id: "auth",
    label: "Auth & Users",
    icon: Users,
    pages: [
      {
        id: "auth-overview",
        label: "How auth works",
        content: (
          <>
            <Heading>How auth works</Heading>
            <Lead>Supabase email/password auth with synthetic email addresses.</Lead>
            <H2>Synthetic email pattern</H2>
            <P>
              Users log in with just a username and password. The frontend maps this to
              <Code>username@ilmi.local</Code> before calling Supabase Auth. This keeps
              the UI simple (no real email needed) while using standard email/password auth.
            </P>
            <Pre>{`// LoginPage.tsx
const email = \`\${username.trim().toLowerCase()}@ilmi.local\`
await supabase.auth.signInWithPassword({ email, password })`}</Pre>
            <H2>Session management</H2>
            <Ul items={[
              "Auth state lives in AuthContext (src/contexts/AuthContext.tsx)",
              "supabase.auth.onAuthStateChange() keeps the context in sync",
              "Profile is fetched on session start and cached in context",
              "signOut() calls supabase.auth.signOut() and navigates to /login",
            ]} />
            <H2>Adding a user</H2>
            <P>New users are created via the Admin page (admins only) or via the Supabase Management API. The profile row is auto-created by a trigger on auth.users.</P>
          </>
        ),
      },
      {
        id: "roles",
        label: "Roles & permissions",
        content: (
          <>
            <Heading>Roles & permissions</Heading>
            <Lead>Two orgs, one admin flag, per-user page access control.</Lead>
            <H2>Org types</H2>
            <KV rows={[
              ["frontline", "Frontline Solutions staff — full access based on allowed_pages"],
              ["firstfix", "First Fix team — Documents page only, always, regardless of other settings"],
            ]} />
            <H2>Admin flag</H2>
            <P><Code>profiles.is_admin = true</Code> grants access to all pages and the Admin panel. Checked via the <Code>is_admin()</Code> Postgres function in RLS policies.</P>
            <H2>Page access</H2>
            <P>
              Non-admin Frontline users have a <Code>allowed_pages</Code> array on their profile.
              If empty, they get full access. Otherwise they can only reach the listed pages.
              Controlled from the Admin panel.
            </P>
            <KV rows={[
              ["tracker", "Procurement list + Delivery Notes"],
              ["documents", "Document register"],
              ["dashboard", "Analytics dashboard"],
            ]} />
          </>
        ),
      },
    ],
  },
  {
    id: "deployment",
    label: "Deployment",
    icon: Globe,
    pages: [
      {
        id: "github-pages",
        label: "GitHub Pages",
        content: (
          <>
            <Heading>GitHub Pages</Heading>
            <Lead>The live site is automatically deployed from the main branch via GitHub Actions.</Lead>
            <H2>How it works</H2>
            <Ul items={[
              "Every push to main triggers the deploy.yml workflow",
              "The workflow runs npm ci → npm run build with Supabase env vars injected from repo secrets",
              "The dist/ folder is uploaded as a Pages artifact and deployed",
              "GitHub Actions also creates a GitHub Release automatically when a v* tag is pushed",
            ]} />
            <H2>Required repo secrets</H2>
            <KV rows={[
              ["VITE_SUPABASE_URL", "https://jtsromruhlsflxykcpwh.supabase.co"],
              ["VITE_SUPABASE_ANON_KEY", "The public anon key (safe to expose)"],
            ]} />
            <Note>
              Set these under GitHub repo → Settings → Secrets and variables → Actions.
            </Note>
            <H2>Base path</H2>
            <P>
              Vite is configured with <Code>base: '/frontline-tracker/'</Code> in vite.config.ts
              to match the GitHub Pages URL structure.
            </P>
          </>
        ),
      },
      {
        id: "supabase",
        label: "Supabase project",
        content: (
          <>
            <Heading>Supabase project</Heading>
            <Lead>Hosted Supabase — no self-hosting required.</Lead>
            <KV rows={[
              ["Project ref", "jtsromruhlsflxykcpwh"],
              ["Region", "Middle East (as configured)"],
              ["Dashboard", "supabase.com/dashboard/project/jtsromruhlsflxykcpwh"],
            ]} />
            <H2>Applying migrations</H2>
            <P>Migrations are applied via the Supabase Management API (curl), not the Supabase CLI:</P>
            <Pre>{`curl -s -X POST \\
  "https://api.supabase.com/v1/projects/jtsromruhlsflxykcpwh/database/query" \\
  -H "Authorization: Bearer <personal-access-token>" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "<SQL here>"}'`}</Pre>
            <Warn>
              The personal access token is not stored in the repo. Keep it secret.
            </Warn>
            <H2>Storage</H2>
            <P>Document files are stored in the <Code>document-files</Code> Supabase Storage bucket. RLS mirrors the documents table — project members can read, write their project's files.</P>
          </>
        ),
      },
    ],
  },
  {
    id: "conventions",
    label: "Conventions",
    icon: Code2,
    pages: [
      {
        id: "code-style",
        label: "Code style",
        badge: "WIP",
        content: (
          <>
            <Heading>Code style</Heading>
            <Lead>Conventions followed across the codebase.</Lead>
            <Note>This section is a work in progress.</Note>
            <H2>General</H2>
            <Ul items={[
              "TypeScript strict mode — no implicit any",
              "Named exports for all components (no default exports except pages)",
              "Co-locate hooks next to their data domain in src/hooks/",
              "All DB types defined in src/lib/types.ts — no inline interfaces for shared shapes",
            ]} />
            <H2>Comments</H2>
            <Ul items={[
              "No comments explaining WHAT the code does — names should do that",
              "Comments only for WHY — hidden constraints, workarounds, non-obvious invariants",
              "Section dividers use ── Label ─── style (visible in minimap)",
            ]} />
            <H2>Styling</H2>
            <Ul items={[
              "Tailwind v4 utility classes only — no custom CSS files",
              "shadcn/ui for all interactive primitives (Button, Dialog, Select, etc.)",
              "cn() helper from src/lib/utils.ts for conditional class merging",
            ]} />
          </>
        ),
      },
      {
        id: "adding-features",
        label: "Adding a feature",
        badge: "WIP",
        content: (
          <>
            <Heading>Adding a feature</Heading>
            <Lead>The typical flow for shipping a new feature end-to-end.</Lead>
            <Note>This section is a work in progress.</Note>
            <H2>Checklist</H2>
            <Ul items={[
              "Write the migration in supabase/migrations/000N_description.sql",
              "Apply it via the Management API",
              "Update src/lib/types.ts with any new interfaces or enums",
              "Add or update the TanStack Query hook in src/hooks/",
              "Build the UI component or update the relevant page",
              "Confirm build passes (npm run build)",
              "Commit to production, push",
              "When ready: bump version, update RELEASES.md, merge to main, tag",
            ]} />
          </>
        ),
      },
    ],
  },
]

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({
  active,
  onSelect,
}: {
  active: string
  onSelect: (id: string) => void
}) {
  return (
    <nav className="flex flex-col gap-6 py-6 pr-6">
      {DOCS.map((section) => (
        <div key={section.id}>
          <div className="flex items-center gap-2 mb-2 px-3">
            <section.icon className="size-4 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.label}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            {section.pages.map((page) => (
              <button
                key={page.id}
                type="button"
                onClick={() => onSelect(page.id)}
                className={cn(
                  "flex items-center justify-between rounded-md px-3 py-1.5 text-sm text-left transition-colors",
                  active === page.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {page.label}
                {page.badge && (
                  <Badge variant="secondary" className="text-[10px] py-0 h-4">
                    {page.badge}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DocsPage() {
  const [activeId, setActiveId] = useState("introduction")
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const activePage = DOCS.flatMap((s) => s.pages).find((p) => p.id === activeId)
  const activeSection = DOCS.find((s) => s.pages.some((p) => p.id === activeId))

  return (
    <div className="min-h-svh bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link
            to="/login"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <Separator orientation="vertical" className="h-5 mx-1" />
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <PackageCheck className="size-4" />
            </div>
            <span className="text-sm font-semibold">Frontline Tracker</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm text-muted-foreground">Docs</span>
          </div>

          {/* Mobile: current section indicator + toggle */}
          <button
            type="button"
            className="ml-auto flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm md:hidden"
            onClick={() => setMobileNavOpen((o) => !o)}
          >
            <BookOpen className="size-4" />
            {activeSection?.label} — {activePage?.label}
          </button>
        </div>

        {/* Mobile nav drawer */}
        {mobileNavOpen && (
          <div className="border-t bg-background px-4 pb-4 md:hidden">
            <Sidebar
              active={activeId}
              onSelect={(id) => {
                setActiveId(id)
                setMobileNavOpen(false)
              }}
            />
          </div>
        )}
      </header>

      <div className="mx-auto flex max-w-6xl">
        {/* Desktop sidebar */}
        <aside className="hidden w-60 shrink-0 border-r md:block">
          <Sidebar active={activeId} onSelect={setActiveId} />
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1 px-6 py-10 md:px-10">
          <div className="max-w-2xl">
            {activePage?.content ?? (
              <p className="text-muted-foreground">Select a topic from the sidebar.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
