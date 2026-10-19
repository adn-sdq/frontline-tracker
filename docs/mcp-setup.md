# Hosted FIT MCP — one-time admin setup

Do these in order. (Dashboard = https://supabase.com/dashboard/project/jtsromruhlsflxykcpwh)

1. **Run migration 0030** in the SQL Editor (`supabase/migrations/0030_oauth_clients_read_only.sql`).
   It makes connector tokens unable to write. Do this *before* step 3.
2. **Authentication → URL Configuration**: Site URL must be
   `https://adn-sdq.github.io/frontline-tracker` (no trailing slash).
3. **Authentication → OAuth Server**:
   - Enable the OAuth server
   - Authorization Path: `/oauth/consent`
   - Enable **Dynamic client registration** (Claude registers itself)
4. **Release the site** so `https://adn-sdq.github.io/frontline-tracker/oauth/consent` exists
   (the page plus `404.html`, which turns that path into the app's `#/oauth/consent` route).
5. Check discovery works — both should return JSON:
   - `https://jtsromruhlsflxykcpwh.supabase.co/.well-known/oauth-authorization-server/auth/v1`
   - `https://jtsromruhlsflxykcpwh.supabase.co/functions/v1/fit-mcp/.well-known/oauth-protected-resource`
6. Add the connector on claude.ai (see mcp/README.md, section A).

New tables: add the three `oauth_read_only_*` policies from 0030 to them too.

Revoking someone: suspend their FIT account (their login stops working), or remove the
connector grant in Supabase → Authentication → OAuth Apps.
