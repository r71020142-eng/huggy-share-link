
-- Table: print_agents (stores connection tokens for desktop print agents)
CREATE TABLE public.print_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  machine_name TEXT,
  agent_version TEXT,
  last_seen_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.print_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can manage their print agents"
  ON public.print_agents FOR ALL
  USING (public.is_store_owner(store_id, auth.uid()))
  WITH CHECK (public.is_store_owner(store_id, auth.uid()));

CREATE INDEX idx_print_agents_store_id ON public.print_agents(store_id);
CREATE INDEX idx_print_agents_token_hash ON public.print_agents(token_hash);

-- Table: store_print_settings
CREATE TABLE public.store_print_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  auto_print BOOLEAN NOT NULL DEFAULT false,
  print_mode TEXT NOT NULL DEFAULT 'both' CHECK (print_mode IN ('kitchen', 'counter', 'both')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.store_print_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can manage print settings"
  ON public.store_print_settings FOR ALL
  USING (public.is_store_owner(store_id, auth.uid()))
  WITH CHECK (public.is_store_owner(store_id, auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_print_agents_updated_at
  BEFORE UPDATE ON public.print_agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_store_print_settings_updated_at
  BEFORE UPDATE ON public.store_print_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for print_agents (agent status updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.print_agents;
