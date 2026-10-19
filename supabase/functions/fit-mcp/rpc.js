// Minimal MCP (JSON-RPC 2.0) request handling — transport-agnostic, so the same
// code serves the hosted HTTP endpoint and the local stdio server.
import { callTool, toolList } from "./tools.js"

export const SERVER_INFO = { name: "fit", version: "0.2.0" }
const SUPPORTED = ["2025-06-18", "2025-03-26", "2024-11-05"]

const reply = (id, result) => ({ jsonrpc: "2.0", id, result })
const error = (id, code, message) => ({ jsonrpc: "2.0", id, error: { code, message } })

/** Handle one JSON-RPC message. Returns a response object, or null for notifications. */
export async function handleMessage(msg, getDb) {
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return msg && "id" in msg ? error(msg.id ?? null, -32600, "Invalid request") : null
  }
  const isNotification = !("id" in msg)
  if (isNotification) return null // e.g. notifications/initialized — nothing to answer

  switch (msg.method) {
    case "initialize": {
      const asked = msg.params?.protocolVersion
      return reply(msg.id, {
        protocolVersion: SUPPORTED.includes(asked) ? asked : SUPPORTED[0],
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
        instructions:
          "FIT is Frontline's procurement and installation tracker. These tools are read-only and show only the projects " +
          "the signed-in person belongs to. Items are identified by SKU (e.g. MP-0042); devices also have per-unit tags (MP-0042-03).",
      })
    }
    case "ping":
      return reply(msg.id, {})
    case "tools/list":
      return reply(msg.id, { tools: toolList() })
    case "tools/call":
      try {
        const db = await getDb()
        return reply(msg.id, await callTool(db, msg.params?.name, msg.params?.arguments))
      } catch (e) {
        return reply(msg.id, { content: [{ type: "text", text: e instanceof Error ? e.message : String(e) }], isError: true })
      }
    default:
      return error(msg.id, -32601, `Method not found: ${msg.method}`)
  }
}
