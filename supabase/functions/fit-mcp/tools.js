// FIT MCP tools — read-only. Shared by the hosted edge function and the local
// stdio server in /mcp. Every query runs through `db`, a Supabase client that is
// signed in AS the person using Claude, so row-level security limits what they
// can see exactly as in the app. Nothing here writes.

/** Make user text safe inside PostgREST ilike / or() filters. */
const clean = (s) => String(s ?? "").replace(/[%_,()*\\]/g, " ").trim()

const ok = (value) => ({ content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }] })
const fail = (message) => ({ content: [{ type: "text", text: message }], isError: true })

async function resolveProject(db, ref) {
  const { data, error } = await db.from("projects").select("id, name, code")
  if (error) throw error
  const q = String(ref).trim().toLowerCase()
  return (
    data.find((p) => p.code?.toLowerCase() === q) ??
    data.find((p) => p.name.toLowerCase() === q) ??
    data.find((p) => p.name.toLowerCase().includes(q))
  )
}

function itemRow(i) {
  return {
    sku: i.sku,
    system: i.system,
    brand: i.brand,
    model: i.model_no,
    description: i.description,
    tracking: i.tracking,
    qty: { required: Number(i.qty_required), ordered: Number(i.qty_ordered), delivered: Number(i.qty_delivered), installed: Number(i.qty_installed) },
    status: { procurement: i.procurement_status, delivery: i.delivery_status, installation: i.installation_status },
    supplier: i.supplier,
    eta: i.eta,
    install_location: i.location,
  }
}

const project = { type: "string", description: "Project code (e.g. MP) or name. Omit for all your projects." }
const limit = { type: "integer", minimum: 1, maximum: 100, description: "Maximum rows to return (default 25)" }

export const TOOLS = [
  {
    name: "list_projects",
    title: "List projects",
    description: "Projects the signed-in person can see, with their SKU code and client.",
    inputSchema: { type: "object", properties: {} },
    async run(db) {
      const { data, error } = await db.from("projects").select("name, code, client_name, site_location, active").order("sort")
      return error ? fail(error.message) : ok(data)
    },
  },
  {
    name: "search_items",
    title: "Search tracker items",
    description:
      "Search procurement items by SKU, brand, model or description, optionally within one project and/or by status " +
      "(procurement: not_started|quoted|po_issued|ordered; delivery: pending|partial|delivered; " +
      "installation: not_started|in_progress|installed|commissioned).",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Text to match in SKU, brand, model or description" },
        project,
        status: { type: "string", description: "Only items with this status in any stage" },
        limit,
      },
    },
    async run(db, { query, project: proj, status, limit: n = 25 }) {
      let q = db.from("items").select("*").order("sku").limit(Math.min(Math.max(Number(n) || 25, 1), 100))
      if (proj) {
        const p = await resolveProject(db, proj)
        if (!p) return fail(`No project matching "${proj}" that you can see.`)
        q = q.eq("project_id", p.id)
      }
      const term = clean(query)
      if (term) q = q.or(["sku", "brand", "model_no", "description"].map((c) => `${c}.ilike.*${term}*`).join(","))
      const st = clean(status)
      if (st) q = q.or(`procurement_status.eq.${st},delivery_status.eq.${st},installation_status.eq.${st}`)
      const { data, error } = await q
      return error ? fail(error.message) : ok({ count: data.length, items: data.map(itemRow) })
    },
  },
  {
    name: "find_unit",
    title: "Find a unit",
    description:
      "Look up one item or unit by SKU (MP-0042), unit tag (MP-0042-03, as printed on QR labels) or device serial number. " +
      "Returns the item, the unit's serial and its recorded field history.",
    inputSchema: {
      type: "object",
      properties: { code: { type: "string", description: "SKU, unit tag, scanned label text (FIT:...) or serial number" } },
      required: ["code"],
    },
    async run(db, { code }) {
      const raw = String(code ?? "").trim().replace(/^FIT:/i, "").toUpperCase()
      if (!raw) return fail("Give a SKU, unit tag or serial number.")
      const m = /^(.+-\d{4,})-(\d{1,3})$/.exec(raw)
      const sku = m ? m[1] : raw
      let unit = m ? Number(m[2]) : null

      let { data: item } = await db.from("items").select("*").eq("sku", sku).maybeSingle()
      let serial = null
      if (!item) {
        const { data: hits } = await db
          .from("item_serials")
          .select("item_id, unit_index, serial_number")
          .ilike("serial_number", clean(code))
          .limit(1)
        if (!hits?.length) return fail(`Nothing found for "${code}" in your projects.`)
        ;({ data: item } = await db.from("items").select("*").eq("id", hits[0].item_id).maybeSingle())
        if (!item) return fail(`Nothing found for "${code}" in your projects.`)
        unit = hits[0].unit_index
        serial = hits[0].serial_number
      } else if (unit !== null) {
        const { data: s } = await db.from("item_serials").select("serial_number").eq("item_id", item.id).eq("unit_index", unit).maybeSingle()
        serial = s?.serial_number ?? null
      }

      let ev = db
        .from("item_unit_events")
        .select("kind, location, note, unit_index, created_at")
        .eq("item_id", item.id)
        .order("created_at", { ascending: false })
        .limit(20)
      if (unit !== null && item.tracking !== "lot") ev = ev.eq("unit_index", unit)
      const { data: events } = await ev

      return ok({ item: itemRow(item), unit: item.tracking === "lot" ? "whole lot" : unit, serial, history: events ?? [] })
    },
  },
  {
    name: "list_documents",
    title: "List documents",
    description: "Submittals and other documents with their review status (pending, under_review, code_a, code_b, code_c).",
    inputSchema: {
      type: "object",
      properties: {
        project,
        status: { type: "string" },
        query: { type: "string", description: "Text to match in title or document number" },
        limit,
      },
    },
    async run(db, { project: proj, status, query, limit: n = 25 }) {
      let q = db
        .from("documents")
        .select("title, doc_number, doc_type, system, revision, status, version, updated_at")
        .order("updated_at", { ascending: false })
        .limit(Math.min(Math.max(Number(n) || 25, 1), 100))
      if (proj) {
        const p = await resolveProject(db, proj)
        if (!p) return fail(`No project matching "${proj}" that you can see.`)
        q = q.eq("project_id", p.id)
      }
      if (status) q = q.eq("status", clean(status))
      const term = clean(query)
      if (term) q = q.or(`title.ilike.*${term}*,doc_number.ilike.*${term}*`)
      const { data, error } = await q
      return error ? fail(error.message) : ok({ count: data.length, documents: data })
    },
  },
  {
    name: "project_summary",
    title: "Project summary",
    description: "Progress snapshot for one project: item counts per stage and status, quantities, documents by status.",
    inputSchema: {
      type: "object",
      properties: { project: { type: "string", description: "Project code (e.g. MP) or name" } },
      required: ["project"],
    },
    async run(db, { project: proj }) {
      const p = await resolveProject(db, proj ?? "")
      if (!p) return fail(`No project matching "${proj}" that you can see.`)
      const [items, docs] = await Promise.all([
        db.from("items").select("procurement_status, delivery_status, installation_status, qty_required, qty_delivered, qty_installed").eq("project_id", p.id),
        db.from("documents").select("status").eq("project_id", p.id),
      ])
      if (items.error || docs.error) return fail((items.error ?? docs.error).message)
      const tally = (rows, key) => rows.reduce((acc, r) => ({ ...acc, [r[key]]: (acc[r[key]] ?? 0) + 1 }), {})
      const sum = (key) => items.data.reduce((total, r) => total + Number(r[key] ?? 0), 0)
      return ok({
        project: { name: p.name, code: p.code },
        items: {
          lines: items.data.length,
          quantity: { required: sum("qty_required"), delivered: sum("qty_delivered"), installed: sum("qty_installed") },
          procurement: tally(items.data, "procurement_status"),
          delivery: tally(items.data, "delivery_status"),
          installation: tally(items.data, "installation_status"),
        },
        documents: { total: docs.data.length, by_status: tally(docs.data, "status") },
      })
    },
  },
]

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }

/** Tool list as MCP clients expect it. */
export const toolList = () =>
  TOOLS.map(({ name, title, description, inputSchema }) => ({ name, title, description, inputSchema, annotations: READ_ONLY }))

export async function callTool(db, name, args) {
  const tool = TOOLS.find((t) => t.name === name)
  if (!tool) return fail(`Unknown tool: ${name}`)
  try {
    return await tool.run(db, args ?? {})
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e))
  }
}
