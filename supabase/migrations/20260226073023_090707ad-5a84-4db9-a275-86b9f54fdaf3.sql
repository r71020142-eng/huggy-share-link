
-- Fix RLS policy parameter order for store_print_settings
DROP POLICY IF EXISTS "Store owners can manage print settings" ON public.store_print_settings;

CREATE POLICY "Store owners can manage print settings"
ON public.store_print_settings
FOR ALL
USING (is_store_owner(auth.uid(), store_id))
WITH CHECK (is_store_owner(auth.uid(), store_id));
