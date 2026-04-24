import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "aymaneibrahim401@gmail.com";
const ADMIN_PASSWORD = "Aymane123@";
const LEGACY_EMAILS = ["admin@gasyflix.com"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Find or create the new admin user
    const { data: list } = await supabase.auth.admin.listUsers();
    let user = list?.users?.find((u) => u.email === ADMIN_EMAIL) ?? null;

    if (!user) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { display_name: "Admin GasyFlix" },
      });
      if (error) throw error;
      user = data.user;
    } else {
      await supabase.auth.admin.updateUserById(user.id, {
        password: ADMIN_PASSWORD,
        email_confirm: true,
      });
    }
    if (!user) throw new Error("Could not create admin");

    // Revoke admin role from legacy admins
    const legacyUsers = (list?.users ?? []).filter((u) => LEGACY_EMAILS.includes(u.email ?? ""));
    for (const lu of legacyUsers) {
      await supabase.from("user_roles").delete().eq("user_id", lu.id).eq("role", "admin");
    }

    // Ensure ONLY this user has admin role
    await supabase.from("user_roles").delete().eq("role", "admin").neq("user_id", user.id);

    // Assign admin role to new admin
    const { error: roleErr } = await supabase
      .from("user_roles")
      .upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });
    if (roleErr) throw roleErr;

    return new Response(
      JSON.stringify({ ok: true, email: ADMIN_EMAIL, user_id: user.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("seed-admin error", e);
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
