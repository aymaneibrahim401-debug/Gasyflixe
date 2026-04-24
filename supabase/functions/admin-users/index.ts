// Edge function : gestion users par l'admin (liste, bloquer, débloquer, supprimer)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.warn("admin-users: missing Authorization header");
      return json({ error: "Unauthorized: missing token" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !serviceKey || !anonKey) {
      console.error("admin-users: missing env vars");
      return json({ error: "Server misconfigured" }, 500);
    }

    // 1. Validate caller via JWT
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: uErr } = await callerClient.auth.getUser();
    if (uErr || !userData?.user) {
      console.warn("admin-users: invalid user", uErr?.message);
      return json({ error: "Unauthorized: invalid session" }, 401);
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // 2. Verify admin role
    const { data: roleRow, error: rErr } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (rErr) {
      console.error("admin-users: role check failed", rErr.message);
      return json({ error: "Role check failed" }, 500);
    }
    if (!roleRow) return json({ error: "Forbidden: admin only" }, 403);

    // 3. Parse body
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const action = String(body?.action ?? "");
    console.log("admin-users action:", action, "by", userData.user.email);

    if (action === "list") {
      const { data: list, error: lErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      if (lErr) {
        console.error("listUsers error", lErr.message);
        return json({ error: lErr.message }, 500);
      }
      const { data: profiles } = await admin
        .from("profiles")
        .select("user_id, display_name, avatar_url, is_blocked, email");
      const { data: roles } = await admin.from("user_roles").select("user_id, role");
      const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
      const roleMap = new Map<string, string[]>();
      (roles ?? []).forEach((r: any) => {
        const arr = roleMap.get(r.user_id) ?? [];
        arr.push(r.role);
        roleMap.set(r.user_id, arr);
      });
      const users = (list?.users ?? []).map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        confirmed: !!u.email_confirmed_at,
        banned_until: (u as any).banned_until ?? null,
        profile: profileMap.get(u.id) ?? null,
        roles: roleMap.get(u.id) ?? [],
      }));
      return json({ users });
    }

    if (action === "block" || action === "unblock") {
      const targetId = String(body?.user_id ?? "");
      if (!targetId) return json({ error: "user_id required" }, 400);
      const banDuration = action === "block" ? "876000h" : "none";
      const { error } = await admin.auth.admin.updateUserById(targetId, { ban_duration: banDuration } as any);
      if (error) {
        console.error("ban error", error.message);
        return json({ error: error.message }, 500);
      }
      await admin.from("profiles").update({ is_blocked: action === "block" }).eq("user_id", targetId);
      return json({ ok: true });
    }

    if (action === "delete") {
      const targetId = String(body?.user_id ?? "");
      if (!targetId) return json({ error: "user_id required" }, 400);
      if (targetId === userData.user.id) return json({ error: "Cannot delete self" }, 400);
      const { error } = await admin.auth.admin.deleteUser(targetId);
      if (error) {
        console.error("deleteUser error", error.message);
        return json({ error: error.message }, 500);
      }
      return json({ ok: true });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    console.error("admin-users fatal", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
