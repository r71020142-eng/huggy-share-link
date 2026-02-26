
-- Fix: Change view to SECURITY INVOKER so it respects the querying user's RLS policies
ALTER VIEW public.stores_public SET (security_invoker = on);
