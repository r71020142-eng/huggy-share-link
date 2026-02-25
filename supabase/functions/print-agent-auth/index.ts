import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { store_id, token, action, machine_name, agent_version } = await req.json();

    if (!store_id || !token) {
      return new Response(JSON.stringify({ error: "Missing store_id or token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Hash the provided token
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(token));
    const tokenHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Find active agent with matching hash and store_id
    const { data: agent, error } = await adminClient
      .from("print_agents")
      .select("*")
      .eq("store_id", store_id)
      .eq("token_hash", tokenHash)
      .eq("is_active", true)
      .single();

    if (error || !agent) {
      return new Response(JSON.stringify({ error: "Invalid token or agent revoked" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "connect") {
      // Register connection
      const updates: Record<string, unknown> = { last_seen_at: new Date().toISOString() };
      if (machine_name) updates.machine_name = machine_name;
      if (agent_version) updates.agent_version = agent_version;

      await adminClient.from("print_agents").update(updates).eq("id", agent.id);

      // Get print settings
      const { data: settings } = await adminClient
        .from("store_print_settings")
        .select("*")
        .eq("store_id", store_id)
        .maybeSingle();

      return new Response(
        JSON.stringify({ success: true, agent_id: agent.id, settings }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "heartbeat") {
      await adminClient
        .from("print_agents")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", agent.id);

      // Check if still active
      const { data: check } = await adminClient
        .from("print_agents")
        .select("is_active")
        .eq("id", agent.id)
        .single();

      return new Response(
        JSON.stringify({ success: true, is_active: check?.is_active ?? false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
