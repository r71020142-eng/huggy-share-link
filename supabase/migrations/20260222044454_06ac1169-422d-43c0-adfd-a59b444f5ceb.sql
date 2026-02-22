
-- Fix overly permissive INSERT policies for orders (require valid store_id)
DROP POLICY "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders with valid store" ON public.orders
  FOR INSERT TO anon
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND is_open = true));

-- Fix overly permissive INSERT policies for order_items (require valid order)
DROP POLICY "Anyone can create order items" ON public.order_items;
CREATE POLICY "Anyone can create order items for valid orders" ON public.order_items
  FOR INSERT TO anon
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id));
