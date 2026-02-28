
-- Index for name search by store
CREATE INDEX IF NOT EXISTS idx_customers_store_name ON public.customers (store_id, name);
