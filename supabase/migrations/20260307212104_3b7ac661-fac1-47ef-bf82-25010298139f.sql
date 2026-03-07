
-- 1) Tabela whatsapp_events
CREATE TABLE public.whatsapp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'zapi',
  instance_id text NOT NULL,
  external_message_id text NOT NULL,
  customer_phone text,
  customer_name text,
  message_text text,
  payload_raw jsonb,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'received',
  error_message text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  CONSTRAINT uq_whatsapp_event_idempotency UNIQUE (provider, instance_id, external_message_id)
);

CREATE INDEX idx_whatsapp_events_store_id ON public.whatsapp_events(store_id);
CREATE INDEX idx_whatsapp_events_received_at ON public.whatsapp_events(received_at DESC);
CREATE INDEX idx_whatsapp_events_status ON public.whatsapp_events(status);

ALTER TABLE public.whatsapp_events ENABLE ROW LEVEL SECURITY;

-- RLS: store owners can read their own events
CREATE POLICY "Store owners can view whatsapp events"
  ON public.whatsapp_events FOR SELECT
  TO authenticated
  USING (public.is_store_owner(auth.uid(), store_id));

-- No INSERT/UPDATE/DELETE from client - only service_role via edge function

-- 2) Tabela store_whatsapp_integrations
CREATE TABLE public.store_whatsapp_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'zapi',
  instance_id text NOT NULL,
  phone_e164 text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_store_provider UNIQUE (store_id, provider),
  CONSTRAINT uq_provider_instance UNIQUE (provider, instance_id)
);

ALTER TABLE public.store_whatsapp_integrations ENABLE ROW LEVEL SECURITY;

-- RLS: store owners can manage their own integrations
CREATE POLICY "Store owners can view their integrations"
  ON public.store_whatsapp_integrations FOR SELECT
  TO authenticated
  USING (public.is_store_owner(auth.uid(), store_id));

CREATE POLICY "Store owners can insert their integrations"
  ON public.store_whatsapp_integrations FOR INSERT
  TO authenticated
  WITH CHECK (public.is_store_owner(auth.uid(), store_id));

CREATE POLICY "Store owners can update their integrations"
  ON public.store_whatsapp_integrations FOR UPDATE
  TO authenticated
  USING (public.is_store_owner(auth.uid(), store_id));

CREATE POLICY "Store owners can delete their integrations"
  ON public.store_whatsapp_integrations FOR DELETE
  TO authenticated
  USING (public.is_store_owner(auth.uid(), store_id));
