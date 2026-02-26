
-- Add dashboard PIN column to stores (hashed for security)
ALTER TABLE public.stores ADD COLUMN dashboard_pin_hash TEXT;
