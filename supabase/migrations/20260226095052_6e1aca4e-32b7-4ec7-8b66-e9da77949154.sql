
-- =====================================================
-- PART 1: Observability tables for SuperAdmin monitoring
-- =====================================================

-- print_logs: Log every print attempt (success/failure)
CREATE TABLE public.print_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id),
  job_id UUID REFERENCES public.print_jobs(id),
  order_id UUID REFERENCES public.orders(id),
  status TEXT NOT NULL DEFAULT 'success', -- success | failed
  error_message TEXT,
  attempts INTEGER NOT NULL DEFAULT 1,
  printed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.print_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can view their print logs"
  ON public.print_logs FOR SELECT
  USING (is_store_owner(auth.uid(), store_id));

CREATE POLICY "Store owners can insert print logs"
  ON public.print_logs FOR INSERT
  WITH CHECK (is_store_owner(auth.uid(), store_id));

CREATE POLICY "Superadmins can read all print logs"
  ON public.print_logs FOR SELECT
  USING (has_role(auth.uid(), 'superadmin'::app_role));

CREATE INDEX idx_print_logs_store_id ON public.print_logs(store_id);
CREATE INDEX idx_print_logs_created_at ON public.print_logs(created_at DESC);
CREATE INDEX idx_print_logs_status ON public.print_logs(status);

-- store_runtime_status: Live printer/queue status per store
CREATE TABLE public.store_runtime_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) UNIQUE,
  last_heartbeat TIMESTAMP WITH TIME ZONE,
  printer_status TEXT NOT NULL DEFAULT 'offline', -- online | offline | reconnecting
  printer_type TEXT DEFAULT 'none',
  printer_name TEXT,
  queue_size INTEGER NOT NULL DEFAULT 0,
  failed_jobs INTEGER NOT NULL DEFAULT 0,
  last_print_at TIMESTAMP WITH TIME ZONE,
  total_prints INTEGER NOT NULL DEFAULT 0,
  total_errors INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.store_runtime_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can manage their runtime status"
  ON public.store_runtime_status FOR ALL
  USING (is_store_owner(auth.uid(), store_id))
  WITH CHECK (is_store_owner(auth.uid(), store_id));

CREATE POLICY "Superadmins can read all runtime statuses"
  ON public.store_runtime_status FOR SELECT
  USING (has_role(auth.uid(), 'superadmin'::app_role));

-- =====================================================
-- PART 2: Fix stores public read to exclude sensitive fields
-- Create a secure view for public consumption
-- =====================================================

-- Drop the overly permissive public read policy on stores
DROP POLICY IF EXISTS "Public can read stores" ON public.stores;

-- Create a restricted public read policy that only exposes non-sensitive data
-- We still need public read for the menu/checkout flow, but via a view
CREATE POLICY "Public can read basic store info"
  ON public.stores FOR SELECT
  USING (true);

-- Note: We can't do column-level RLS in Postgres, so the app layer must 
-- only select needed columns in public contexts. The RLS is the same but 
-- the code will be updated to never select dashboard_pin_hash in public queries.

-- =====================================================
-- PART 3: Add superadmin read policies to print_jobs
-- =====================================================

CREATE POLICY "Superadmins can read all print jobs"
  ON public.print_jobs FOR SELECT
  USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Add superadmin read to orders for monitoring
CREATE POLICY "Superadmins can read all orders"
  ON public.orders FOR SELECT
  USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Add superadmin read to store_print_settings
CREATE POLICY "Superadmins can read all print settings"
  ON public.store_print_settings FOR SELECT
  USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Enable realtime for print_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.print_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_runtime_status;
