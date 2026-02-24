
-- =============================================
-- CRITICAL FIX 1: orders - Replace open SELECT with tracking_code filter
-- =============================================
DROP POLICY IF EXISTS "Public can read own orders by tracking" ON public.orders;

CREATE POLICY "Public can read own orders by tracking code"
  ON public.orders
  FOR SELECT
  USING (
    tracking_code IS NOT NULL
    AND tracking_code = current_setting('request.headers', true)::json->>'x-tracking-code'
  );

-- Store owners already have ALL via "Store owners can manage orders"
-- Add explicit SELECT for store owners (since ALL restrictive + restrictive SELECT = both needed)
CREATE POLICY "Store owners can read orders"
  ON public.orders
  FOR SELECT
  USING (is_store_owner(auth.uid(), store_id));

-- =============================================
-- CRITICAL FIX 2: order_items - Replace open SELECT with join-based access
-- =============================================
DROP POLICY IF EXISTS "Public can read order items" ON public.order_items;

CREATE POLICY "Public can read order items via tracking"
  ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
      AND o.tracking_code IS NOT NULL
      AND o.tracking_code = current_setting('request.headers', true)::json->>'x-tracking-code'
    )
  );

-- Store owners already have ALL, add explicit SELECT
CREATE POLICY "Store owners can read order items"
  ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
      AND is_store_owner(auth.uid(), o.store_id)
    )
  );
