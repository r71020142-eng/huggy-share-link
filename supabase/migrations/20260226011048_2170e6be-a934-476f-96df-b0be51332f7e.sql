
-- Print jobs table: backend tracking of print status per order
CREATE TABLE public.print_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  printed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.print_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners manage print jobs"
ON public.print_jobs FOR ALL
USING (public.is_store_owner(store_id, auth.uid()));

CREATE INDEX idx_print_jobs_store_status ON public.print_jobs(store_id, status);
CREATE INDEX idx_print_jobs_order ON public.print_jobs(order_id);

CREATE TRIGGER update_print_jobs_updated_at
BEFORE UPDATE ON public.print_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create print job when order is inserted
CREATE OR REPLACE FUNCTION public.auto_create_print_job()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.print_jobs (store_id, order_id, idempotency_key)
  VALUES (NEW.store_id, NEW.id, 'print_' || NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_auto_create_print_job
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_print_job();

-- Enable realtime for print_jobs
ALTER PUBLICATION supabase_realtime ADD TABLE public.print_jobs;
