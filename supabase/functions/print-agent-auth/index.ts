import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const { store_id, token, action, machine_name, agent_version } = body as {
      store_id?: string;
      token?: string;
      action?: string;
      machine_name?: string;
      agent_version?: string;
    };

    if (!store_id || !token) {
      return jsonResponse({ error: "Missing store_id or token" }, 400);
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
      console.log("Auth failed:", { store_id, error: error?.message, hasAgent: !!agent });
      return jsonResponse({ error: "Invalid token or agent revoked" }, 401);
    }

    if (action === "connect") {
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

      console.log("Agent connected:", { agent_id: agent.id, store_id });
      return jsonResponse({ success: true, agent_id: agent.id, settings }, 200);
    }

    if (action === "heartbeat") {
      await adminClient
        .from("print_agents")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", agent.id);

      const { data: check } = await adminClient
        .from("print_agents")
        .select("is_active")
        .eq("id", agent.id)
        .single();

      return jsonResponse({ success: true, is_active: check?.is_active ?? false }, 200);
    }

    return jsonResponse({ error: "Invalid action. Expected 'connect' or 'heartbeat'" }, 400);
  } catch (e) {
    console.error("print-agent-auth error:", e);
    return jsonResponse({ error: e.message || "Internal server error" }, 500);
  }
});
