# Frontline Tracker — Claude Code Instructions

Read this file in full before touching any code or git commands.

---

## Branch & Release Rules

### The two branches

| Branch | Purpose |
|---|---|
| `production` | All active development. Every commit here is a small, shippable release. |
| `main` | Live site (GitHub Pages). **Never commit directly to main.** |

### Daily workflow — ALWAYS work on `production`

```bash
git checkout production   # make sure you're on the right branch before anything
```

Before starting any work, confirm the current branch:
```bash
git branch
```

If you're on `main` for any reason, switch back:
```bash
git checkout production
```

### Committing changes

Each commit to `production` should be small and focused (one feature, one fix).
After committing, append a release entry to `RELEASES.md` (see format below) and
update `src/lib/version.ts` with the new version string.

Push to the remote `production` branch after each commit:
```bash
git push origin production
```

### Releasing to production (main)

**Only do this when the user explicitly says "release", "deploy", or "push to main".**

```bash
git checkout main
git merge production --no-ff -m "release: vX.Y.Z"
git push origin main
git checkout production
```

GitHub Actions will automatically build and deploy to GitHub Pages on every push to `main`.

### Version numbering (semver)

- **PATCH** (0.1.**1**) — bug fixes, copy changes, small UI tweaks
- **MINOR** (0.**2**.0) — new features, meaningful UX changes
- **MAJOR** (**1**.0.0) — architectural changes, breaking changes, major redesigns

---

## Release Notes Format (`RELEASES.md`)

Always prepend new entries at the **top** of the file (newest first).

```markdown
## vX.Y.Z — YYYY-MM-DD

Short summary of what this release contains.

### Category
- Bullet point describing a change
- Another change
```

After writing the release entry, also update `src/lib/version.ts`:
```ts
export const APP_VERSION = "vX.Y.Z"
export const APP_VERSION_DATE = "YYYY-MM-DD"
```

---

## Project Context

- **App:** Frontline Tracker — MiSK Ilmi procurement & installation coordination tool
- **Repo:** `adn-sdq/frontline-tracker` (private)
- **Supabase project:** `jtsromruhlsflxykcpwh`
- **Live URL:** GitHub Pages (deployed from `main` branch)
- **Stack:** React 19, Vite 8, TypeScript 6, Tailwind v4, shadcn/ui, Supabase, TanStack Query 5, React Router 7

### Key conventions
- All DB changes go in numbered migrations: `supabase/migrations/000N_description.sql`
- Apply migrations via the Supabase Management API (curl), not the CLI
- Edge functions live in `supabase/functions/admin-users/` — deploy via PATCH to the Management API
- `.env` is gitignored — secrets are injected by GitHub Actions from repo secrets
- Never put the service-role key in browser code
- `HashRouter` is required (GitHub Pages has no server rewrite)
- Synthetic email auth: `username@ilmi.local`

### Auth & roles
- `is_admin()` — Supabase SECURITY DEFINER function, checks `profiles.is_admin`
- `is_firstfix()` — checks `profiles.org = 'firstfix'`
- `is_project_member(uuid)` — checks project_members table
- Firstfix users always only see Documents; admins always see everything

---

## What NOT to do

- Do not push to `main` unless the user says "release"
- Do not use `--no-verify` or skip hooks
- Do not put secrets in code or commit `.env`
- Do not install packages with `--legacy-peer-deps` as a permanent fix — solve the actual conflict
- Do not add `--force` to git push
