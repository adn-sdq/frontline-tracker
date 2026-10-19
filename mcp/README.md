# FIT MCP (read-only)

Lets Claude look things up in FIT. It acts as **one FIT user**, so it sees exactly
what that person sees in the app (their projects, their role) — and it cannot
change anything. There are two ways to connect; both use the same five tools.

## A. Claude on the web (claude.ai) — hosted, nothing to install

The server runs on Supabase (`supabase/functions/fit-mcp`). Each person adds it once:

1. claude.ai → **Settings → Connectors → Add custom connector**
2. Name: `FIT` · URL: `https://jtsromruhlsflxykcpwh.supabase.co/functions/v1/fit-mcp`
3. Click **Connect**, sign in with your FIT work email, and **Approve**.

Sign-in uses Supabase Auth's OAuth server and the FIT approval page
(`/oauth/consent`). The token belongs to that person; the database blocks any
write made with a connector token (migration `0030`).

One-time admin setup is listed in `docs/mcp-setup.md`.

## B. Claude Desktop / Claude Code — local (below)

Runs on your own computer with your FIT email and password.

## Tools

| Tool | What it does |
|---|---|
| `list_projects` | Projects you can see, with SKU code and client |
| `search_items` | Find items by SKU, brand, model or description; filter by project or status |
| `find_unit` | Look up a SKU, unit tag (`MP-0042-03`), scanned label or serial number, with its field history |
| `list_documents` | Documents and review status, by project / status / text |
| `project_summary` | Progress snapshot for a project: items per stage, quantities, documents by status |

## Setup

```bash
cd mcp
npm install
```

You need four values:

- `FIT_SUPABASE_URL` — `https://jtsromruhlsflxykcpwh.supabase.co`
- `FIT_SUPABASE_ANON_KEY` — the same public anon key the web app uses (`VITE_SUPABASE_ANON_KEY` in `.env`). Never the service-role key.
- `FIT_EMAIL` — your FIT work email (or just the part before `@frontline.sa`)
- `FIT_PASSWORD` — your FIT password

### Claude Desktop

Settings → Developer → Edit Config, then add (use the absolute path to this folder):

```json
{
  "mcpServers": {
    "fit": {
      "command": "node",
      "args": ["/absolute/path/to/Frontline Tracker/mcp/server.mjs"],
      "env": {
        "FIT_SUPABASE_URL": "https://jtsromruhlsflxykcpwh.supabase.co",
        "FIT_SUPABASE_ANON_KEY": "<anon key>",
        "FIT_EMAIL": "you@frontline.sa",
        "FIT_PASSWORD": "<your password>"
      }
    }
  }
}
```

Restart Claude Desktop. Try: *"Which items in MP are delivered but not installed?"*

### Claude Code

```bash
claude mcp add fit \
  -e FIT_SUPABASE_URL=https://jtsromruhlsflxykcpwh.supabase.co \
  -e FIT_SUPABASE_ANON_KEY=<anon key> \
  -e FIT_EMAIL=you@frontline.sa \
  -e FIT_PASSWORD=<your password> \
  -- node "/absolute/path/to/Frontline Tracker/mcp/server.mjs"
```

## Notes

- Each person uses their own login. Don't share one account between people.
- The password sits in your local Claude config file — keep that file private.
- Write actions (update status, record a unit event) are intentionally not included yet.
