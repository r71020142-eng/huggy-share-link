
-- Create a SECURITY DEFINER function to check order existence (bypasses RLS)
CREATE OR REPLACE FUNCTION public.order_exists(p_order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.orders WHERE id = p_order_id);
$$;

-- Drop old policy and recreate using the SECURITY DEFINER function
DROP POLICY IF EXISTS "Anyone can create order items for valid orders" ON public.order_items;

CREATE POLICY "Anyone can create order items for valid orders"
ON public.order_items
FOR INSERT
WITH CHECK (public.order_exists(order_id));
