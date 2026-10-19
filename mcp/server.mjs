#!/usr/bin/env node
// FIT MCP server — LOCAL (stdio), read-only. For Claude Desktop / Claude Code.
// People using claude.ai in a browser connect to the hosted version instead
// (supabase/functions/fit-mcp). Both share the same tools.
//
// Signs in with ONE person's FIT email + password, so row-level security limits
// results to that person's projects. No service-role key is ever used.

import { createInterface } from "node:readline"
import { createClient } from "@supabase/supabase-js"
import { handleMessage } from "../supabase/functions/fit-mcp/rpc.js"

const { FIT_SUPABASE_URL, FIT_SUPABASE_ANON_KEY, FIT_EMAIL, FIT_PASSWORD } = process.env
if (!FIT_SUPABASE_URL || !FIT_SUPABASE_ANON_KEY || !FIT_EMAIL || !FIT_PASSWORD) {
  console.error("fit-mcp: set FIT_SUPABASE_URL, FIT_SUPABASE_ANON_KEY, FIT_EMAIL and FIT_PASSWORD")
  process.exit(1)
}

const db = createClient(FIT_SUPABASE_URL, FIT_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: true } })

async function signIn() {
  const login = FIT_EMAIL.trim().toLowerCase()
  const candidates = login.includes("@") ? [login] : [`${login}@frontline.sa`, `${login}@ilmi.local`]
  let last
  for (const email of candidates) {
    const { error } = await db.auth.signInWithPassword({ email, password: FIT_PASSWORD })
    if (!error) return
    last = error
  }
  throw new Error(`Sign-in failed: ${last?.message ?? "unknown error"}`)
}

// Sign in once, on first use; a failed attempt is retried on the next call.
let session = null
const getDb = async () => {
  session ??= signIn().catch((e) => { session = null; throw e })
  await session
  return db
}

const send = (obj) => process.stdout.write(JSON.stringify(obj) + "\n")

createInterface({ input: process.stdin }).on("line", async (line) => {
  if (!line.trim()) return
  let msg
  try {
    msg = JSON.parse(line)
  } catch {
    return send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } })
  }
  for (const m of Array.isArray(msg) ? msg : [msg]) {
    const res = await handleMessage(m, getDb)
    if (res) send(res)
  }
})
