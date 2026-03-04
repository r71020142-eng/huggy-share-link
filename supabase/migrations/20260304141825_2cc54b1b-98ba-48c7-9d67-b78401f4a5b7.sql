
-- Drop the broken RESTRICTIVE policies
DROP POLICY IF EXISTS "Owners can manage their stores" ON public.stores;
DROP POLICY IF EXISTS "Public can read open stores" ON public.stores;

-- Recreate as PERMISSIVE (default) policies
CREATE POLICY "Owners can manage their stores"
ON public.stores
FOR ALL
TO authenticated
USING ((owner_id = auth.uid()) OR has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK ((owner_id = auth.uid()) OR has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Public can read open stores"
ON public.stores
FOR SELECT
TO anon, authenticated
USING (is_open = true);
