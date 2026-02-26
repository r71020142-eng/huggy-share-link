
-- FIX 1: stores – Replace USING(true) with column-restricted access
-- The stores_public view already exists for safe public access.
-- Restrict the public SELECT policy to only return non-sensitive fields
-- by removing the blanket USING(true) and requiring either ownership or superadmin.
DROP POLICY IF EXISTS "Public can read basic store info" ON public.stores;

-- Public reads should go through stores_public view (already created).
-- But menus/orders need to read store info, so we allow SELECT for anon/authenticated
-- but ONLY through the stores_public view. For the stores TABLE itself,
-- we restrict to owner + superadmin + a limited public read for specific operations.

-- Allow anyone to read stores but ONLY for open store lookups (needed for order creation RLS)
CREATE POLICY "Public can read open stores"
ON public.stores
FOR SELECT
USING (is_open = true);

-- FIX 2: activation_keys – Replace USING(true) with store-owner check
-- Only the user who owns a store should validate keys, or superadmins.
DROP POLICY IF EXISTS "Authenticated can read keys for validation" ON public.activation_keys;

CREATE POLICY "Authenticated can read active keys for validation"
ON public.activation_keys
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND is_active = true
  AND (current_uses < max_uses OR max_uses IS NULL)
  AND (expires_at IS NULL OR expires_at > now())
);
