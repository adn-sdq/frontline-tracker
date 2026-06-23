# Frontline Tracker — MiSK Ilmi

A small, shared procurement & installation tracker for the MiSK Ilmi project.
Replaces the old Excel BOQ workbooks with a live, line-by-line tracker for
**AV, PAVA, IPTV and Screen** devices — covering procurement, delivery, and
on-site installation status.

Built for a small team (<10 users). Every change is attributed to whoever made
it, a full edit history is kept, and concurrent edits can't silently overwrite
each other — so nothing gets lost.

## Stack

- **Frontend:** React + TypeScript + Vite, Tailwind + shadcn/ui (tweakcn theme)
- **Backend:** Supabase (Postgres + Auth + Row Level Security + Realtime)
- **Hosting:** GitHub Pages (static SPA), deployed by GitHub Actions

## How it works

- **Sign in** with a name + password (no email needed — names map to a
  synthetic `@ilmi.local` address behind the scenes).
- **One shared table** of line items, filterable by system, searchable, with
  inline-editable quantities and status dropdowns that save instantly.
- **Auto-save + attribution:** each edit goes through an `update_item` database
  function that records who changed what and bumps a row version.
- **No silent overwrites:** if someone else edited a row since you loaded it,
  your save is rejected with a warning instead of clobbering their change
  (optimistic concurrency on `version`).
- **Full history:** every create/update/delete is logged in `item_history`
  with field-level diffs and a full snapshot (so deletes are recoverable).
- **Realtime:** the table updates live as teammates make changes.
- **CSV import/export** for bulk loading and sharing.

## Local development

```bash
npm install
cp .env.example .env   # fill in your Supabase URL + anon key
npm run dev
```

Environment variables (see `.env.example`):

- `VITE_SUPABASE_URL` — your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — the anon/public key
- `VITE_BASE` — base path (use `/` locally; defaults to `/frontline-tracker/`)

## Database

The full schema, RLS policies, audit triggers, and the `update_item` RPC live in
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). Apply
it via the Supabase SQL editor or the CLI (`supabase db push`).

## Deployment

Pushing to `main` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
which builds the app and publishes it to GitHub Pages. Two repository secrets are
required (Settings → Secrets and variables → Actions):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

GitHub Pages must be set to **Source: GitHub Actions** (Settings → Pages).

## Adding team members

Users are created in Supabase Auth with an email of `<username>@ilmi.local`.
The simplest way to add one is the Supabase dashboard (Authentication → Add
user → enter `name@ilmi.local` + a password, and tick *Auto Confirm User*). A
profile row is created automatically on first sign-in.
