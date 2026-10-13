// Admin-only user management. Creating/deleting auth users and resetting
// passwords needs the service-role key, which must never live in the browser.
// This Edge Function holds it, and only acts for callers whose profile is_admin.
//
// Deployed with verify_jwt = false so we can handle CORS preflight and verify
// the caller ourselves via their bearer token.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const DOMAIN = "ilmi.local"

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  try {
    const url = Deno.env.get("SUPABASE_URL")!
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!
    const authHeader = req.headers.get("Authorization") ?? ""

    // Identify the caller from their JWT.
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
      error: uErr,
    } = await userClient.auth.getUser()
    if (uErr || !user) return json({ error: "Not signed in" }, 401)

    const admin = createClient(url, serviceKey)
    const { data: prof } = await admin
      .from("profiles")
      .select("is_admin, is_super_admin, super_elevated")
      .eq("id", user.id)
      .single()
    const callerIsAdmin = prof?.is_super_admin ? prof.super_elevated : prof?.is_admin
    if (!callerIsAdmin) return json({ error: "Admins only" }, 403)

    const body = await req.json().catch(() => ({}))
    const action = body.action ?? "create"

    // The super admin's account can only be changed by themself.
    if (action !== "create" && body.id && body.id !== user.id) {
      const { data: target } = await admin
        .from("profiles")
        .select("is_super_admin")
        .eq("id", body.id)
        .single()
      if (target?.is_super_admin) return json({ error: "This account can't be modified." }, 403)
    }

    if (action === "create") {
      const username = String(body.username ?? "").trim().toLowerCase()
      if (!username || !body.password)
        return json({ error: "Username and password are required" }, 400)
      const email = `${username}@${DOMAIN}`
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: String(body.password),
        email_confirm: true,
        user_metadata: {
          username,
          full_name: body.full_name || username,
          org: body.org ?? null,
          is_admin: !!body.is_admin,
        },
      })
      if (error) return json({ error: error.message }, 400)
      const role = ["admin", "member", "guest"].includes(body.role)
        ? body.role
        : body.is_admin ? "admin" : "member"
      const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null)
      await admin
        .from("profiles")
        .update({
          org: body.org ?? null,
          is_admin: role === "admin",
          role,
          full_name: body.full_name || username,
          username,
          job_title: text(body.job_title),
          department: text(body.department),
          phone: text(body.phone),
          contact_email: text(body.contact_email),
          allowed_pages: Array.isArray(body.allowed_pages) ? body.allowed_pages : null,
        })
        .eq("id", data.user.id)
      return json({ ok: true, id: data.user.id })
    }

    if (action === "set_password") {
      if (!body.id || !body.password)
        return json({ error: "User id and password are required" }, 400)
      const { error } = await admin.auth.admin.updateUserById(body.id, {
        password: String(body.password),
      })
      if (error) return json({ error: error.message }, 400)
      return json({ ok: true })
    }

    if (action === "delete") {
      if (!body.id) return json({ error: "User id required" }, 400)
      if (body.id === user.id)
        return json({ error: "You cannot delete your own account" }, 400)
      const { error } = await admin.auth.admin.deleteUser(body.id)
      if (error) return json({ error: error.message }, 400)
      return json({ ok: true })
    }

    if (action === "update_profile") {
      if (!body.id) return json({ error: "User id required" }, 400)
      const profilePatch: Record<string, unknown> = {}
      if (body.full_name !== undefined) profilePatch.full_name = String(body.full_name ?? "").trim() || null
      if (body.username !== undefined) {
        const newUsername = String(body.username ?? "").trim().toLowerCase()
        if (!newUsername) return json({ error: "Username cannot be empty" }, 400)
        const newEmail = `${newUsername}@${DOMAIN}`
        const { error: authErr } = await admin.auth.admin.updateUserById(body.id, { email: newEmail })
        if (authErr) return json({ error: authErr.message }, 400)
        profilePatch.username = newUsername
      }
      if (Object.keys(profilePatch).length > 0) {
        const { error: profErr } = await admin.from("profiles").update(profilePatch).eq("id", body.id)
        if (profErr) return json({ error: profErr.message }, 400)
      }
      return json({ ok: true })
    }

    // Suspend / reactivate: ban at the auth layer so the user can't sign in or
    // refresh their session, and mirror the state on the profile.
    if (action === "set_status") {
      if (!body.id) return json({ error: "User id required" }, 400)
      if (body.id === user.id)
        return json({ error: "You cannot suspend your own account" }, 400)
      const suspended = body.status === "suspended"
      const { error: banErr } = await admin.auth.admin.updateUserById(body.id, {
        ban_duration: suspended ? "876000h" : "none",
      })
      if (banErr) return json({ error: banErr.message }, 400)
      const { error: profErr } = await admin
        .from("profiles")
        .update({
          status: suspended ? "suspended" : "active",
          status_reason: suspended ? String(body.reason ?? "").trim() || null : null,
        })
        .eq("id", body.id)
      if (profErr) return json({ error: profErr.message }, 400)
      return json({ ok: true })
    }

    return json({ error: "Unknown action" }, 400)
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500)
  }
})
