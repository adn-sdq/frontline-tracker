// FIT MCP server (hosted, read-only) — the address people add as a custom
// connector on claude.ai:  https://<project>.supabase.co/functions/v1/fit-mcp
//
// Sign-in is Supabase Auth's OAuth 2.1 server (people approve Claude on the FIT
// consent page). Every request carries that person's access token; queries run
// as them, so row-level security applies. No service-role key is used here.
//
// Deployed with verify_jwt = false so we can answer an unauthenticated call with
// the WWW-Authenticate header that starts the OAuth flow.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"
// @ts-ignore plain JS module shared with the local server
import { handleMessage } from "./rpc.js"

const URL_BASE = Deno.env.get("SUPABASE_URL")!
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!
const RESOURCE = `${URL_BASE}/functions/v1/fit-mcp`
const METADATA_URL = `${RESOURCE}/.well-known/oauth-protected-resource`

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, accept, mcp-protocol-version, mcp-session-id, x-client-info, apikey",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Expose-Headers": "WWW-Authenticate",
}

const json = (obj: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json", ...extra } })

const unauthorized = (why: string) =>
  json({ error: "unauthorized", error_description: why }, 401, {
    "WWW-Authenticate": `Bearer resource_metadata="${METADATA_URL}"`,
  })

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors })
  const path = new globalThis.URL(req.url).pathname

  // OAuth discovery: tells the client which server signs people in.
  if (req.method === "GET" && path.endsWith("/.well-known/oauth-protected-resource")) {
    return json({
      resource: RESOURCE,
      authorization_servers: [`${URL_BASE}/auth/v1`],
      bearer_methods_supported: ["header"],
      resource_name: "FIT — Frontline Internal Tools",
    })
  }

  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, { Allow: "POST" })

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim()
  if (!token) return unauthorized("Sign in to FIT to use this connector.")

  // Queries run as the signed-in person, so RLS limits them to their projects.
  const db = createClient(URL_BASE, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: { user }, error } = await db.auth.getUser(token)
  if (error || !user) return unauthorized("Your session has expired. Reconnect FIT.")

  const body = await req.json().catch(() => null)
  if (body === null) return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, 400)

  const getDb = async () => db
  if (Array.isArray(body)) {
    const out = (await Promise.all(body.map((m) => handleMessage(m, getDb)))).filter(Boolean)
    return out.length ? json(out) : new Response(null, { status: 202, headers: cors })
  }
  const res = await handleMessage(body, getDb)
  return res ? json(res) : new Response(null, { status: 202, headers: cors })
})
