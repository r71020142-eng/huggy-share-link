import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

function json(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Normalize phone: strip whatsapp suffixes like @s.whatsapp.net, keep digits and leading + */
function normalizePhone(raw: string): string {
  if (!raw) return "";
  let phone = raw.replace(/@.*$/, "").trim();
  // Keep only digits and leading +
  phone = phone.replace(/[^\\d+]/g, "");
  // Ensure E.164-ish format
  if (phone && !phone.startsWith("+")) {
    phone = "+" + phone;
  }
  return phone;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // A) Security: validate internal secret
  const internalSecret = Deno.env.get("WHATSAPP_N8N_INTERNAL_SECRET");
  const providedSecret = req.headers.get("x-internal-secret");

  if (!internalSecret || !providedSecret || providedSecret !== internalSecret) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, supabaseServiceKey);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const provider = (body.provider as string) || "zapi";
  const instance_id = body.instance_id as string;
  const external_message_id = body.external_message_id as string;
  const customer_phone_raw = (body.customer_phone as string) || "";
  const customer_name_raw = (body.customer_name as string) || "Cliente WhatsApp";
  const message_text = (body.message_text as string) || "";
  const payload_raw = body.payload_raw ?? null;

  // B) Validation
  if (!instance_id) {
    return json({ error: "Missing instance_id" }, 400);
  }
  if (!external_message_id) {
    return json({ error: "Missing external_message_id" }, 400);
  }

  // A) Identify store from integration (NEVER trust external store_id)
  const { data: integration, error: intError } = await admin
    .from("store_whatsapp_integrations")
    .select("store_id, active")
    .eq("provider", provider)
    .eq("instance_id", instance_id)
    .maybeSingle();

  if (intError || !integration) {
    return json({ error: "Integration not found for this provider/instance" }, 404);
  }

  if (!integration.active) {
    return json({ error: "Integration is inactive" }, 403);
  }

  const store_id = integration.store_id as string;

  // C) Idempotency check
  const { data: existing } = await admin
    .from("whatsapp_events")
    .select("id, order_id, status")
    .eq("provider", provider)
    .eq("instance_id", instance_id)
    .eq("external_message_id", external_message_id)
    .maybeSingle();

  if (existing) {
    return json({ ok: true, duplicate: true, event_id: existing.id, order_id: existing.order_id }, 200);
  }

  const customer_phone = normalizePhone(customer_phone_raw);
  const customer_name = customer_name_raw.trim().substring(0, 200);

  // D) Register event
  const { data: evt, error: evtError } = await admin
    .from("whatsapp_events")
    .insert({
      store_id,
      provider,
      instance_id,
      external_message_id,
      customer_phone: customer_phone || null,
      customer_name: customer_name || null,
      message_text: message_text || null,
      payload_raw,
      status: "received",
    })
    .select("id")
    .single();

  if (evtError) {
    // Could be a race-condition duplicate
    if (evtError.code === "23505") {
      return json({ ok: true, duplicate: true }, 200);
    }
    console.error("Failed to insert whatsapp_event:", evtError);
    return json({ error: "Failed to register event" }, 500);
  }

  const event_id = evt.id;

  try {
    // E) Find or create customer (isolated by store_id)
    let customer_id: string | null = null;

    if (customer_phone) {
      const { data: existingCustomer } = await admin
        .from("customers")
        .select("id")
        .eq("store_id", store_id)
        .eq("phone", customer_phone)
        .maybeSingle();

      if (existingCustomer) {
        customer_id = existingCustomer.id;
      } else {
        const { data: newCustomer, error: custError } = await admin
          .from("customers")
          .insert({
            store_id,
            name: customer_name || "Cliente WhatsApp",
            phone: customer_phone,
          })
          .select("id")
          .single();

        if (custError) {
          console.error("Failed to create customer:", custError);
          // Continue without customer_id
        } else {
          customer_id = newCustomer.id;
        }
      }
    }

    // F) Create draft order
    const notesContent = `[Pedido via WhatsApp - revisão manual]\nProvider: ${provider}\nInstance: ${instance_id}\nMsg ID: ${external_message_id}\n\nMensagem original:\n${message_text}`;

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        store_id,
        customer_id,
        customer_name: customer_name || "Cliente WhatsApp",
        customer_phone: customer_phone || null,
        status: "pending",
        payment_status: "pending",
        payment_method: null,
        order_type: "delivery",
        is_manual: false,
        notes: notesContent,
        subtotal: 0,
        total: 0,
        delivery_fee: 0,
      })
      .select("id")
      .single();

    if (orderError) {
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    // G) Update event with order reference
    await admin
      .from("whatsapp_events")
      .update({
        order_id: order.id,
        status: "processed",
        processed_at: new Date().toISOString(),
      })
      .eq("id", event_id);

    return json({
      ok: true,
      duplicate: false,
      store_id,
      order_id: order.id,
      customer_id,
    }, 200);
  } catch (e) {
    // H) Error handling - mark event as error
    console.error("create-whatsapp-draft-order error:", e);
    await admin
      .from("whatsapp_events")
      .update({
        status: "error",
        error_message: e.message || "Unknown error",
      })
      .eq("id", event_id);

    return json({ error: "Failed to process order" }, 500);
  }
});
