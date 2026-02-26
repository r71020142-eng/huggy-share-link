
-- Fix: The public order INSERT policy must be PERMISSIVE (not RESTRICTIVE) for anonymous users
DROP POLICY IF EXISTS "Anyone can create orders with valid store" ON public.orders;

CREATE POLICY "Anyone can create orders with valid store"
ON public.orders
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.is_open = true
  )
);

-- Also fix order_items INSERT for anonymous users
DROP POLICY IF EXISTS "Anyone can create order items for valid orders" ON public.order_items;

CREATE POLICY "Anyone can create order items for valid orders"
ON public.order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id
  )
);
