
-- ==========================================
-- PART 1: Customers table for CRM
-- ==========================================
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  bairro TEXT,
  complemento TEXT,
  observations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_order_at TIMESTAMPTZ
);

CREATE INDEX idx_customers_store_phone ON public.customers (store_id, phone);
CREATE INDEX idx_customers_store_last_order ON public.customers (store_id, last_order_at);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can view their customers"
  ON public.customers FOR SELECT
  USING (public.is_store_owner(store_id, auth.uid()));

CREATE POLICY "Store owners can insert customers"
  ON public.customers FOR INSERT
  WITH CHECK (public.is_store_owner(store_id, auth.uid()));

CREATE POLICY "Store owners can update customers"
  ON public.customers FOR UPDATE
  USING (public.is_store_owner(store_id, auth.uid()));

CREATE POLICY "Store owners can delete customers"
  ON public.customers FOR DELETE
  USING (public.is_store_owner(store_id, auth.uid()));

-- ==========================================
-- PART 2: Order payments table (split payment)
-- ==========================================
CREATE TABLE public.order_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_payments_order ON public.order_payments (order_id);
CREATE INDEX idx_order_payments_store ON public.order_payments (store_id);

ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can view their order payments"
  ON public.order_payments FOR SELECT
  USING (public.is_store_owner(store_id, auth.uid()));

CREATE POLICY "Store owners can insert order payments"
  ON public.order_payments FOR INSERT
  WITH CHECK (public.is_store_owner(store_id, auth.uid()));

CREATE POLICY "Store owners can update order payments"
  ON public.order_payments FOR UPDATE
  USING (public.is_store_owner(store_id, auth.uid()));

CREATE POLICY "Store owners can delete order payments"
  ON public.order_payments FOR DELETE
  USING (public.is_store_owner(store_id, auth.uid()));

-- ==========================================
-- PART 3: Add customer_id to orders table
-- ==========================================
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT false;

-- ==========================================
-- PART 4: Enable realtime for new tables
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_payments;
