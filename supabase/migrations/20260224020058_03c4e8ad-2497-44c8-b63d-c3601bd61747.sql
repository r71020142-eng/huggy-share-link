
-- ============================================================
-- FIX: is_store_owner() parameter order (was reversed)
-- Affected tables: cash_sessions, cash_movements, customers, order_payments
-- Function signature: is_store_owner(_user_id uuid, _store_id uuid)
-- Wrong: is_store_owner(store_id, auth.uid())
-- Correct: is_store_owner(auth.uid(), store_id)
-- ============================================================

-- ── cash_sessions ──
DROP POLICY IF EXISTS "Store owners can view cash sessions" ON public.cash_sessions;
CREATE POLICY "Store owners can view cash sessions" ON public.cash_sessions
  FOR SELECT USING (is_store_owner(auth.uid(), store_id));

DROP POLICY IF EXISTS "Store owners can insert cash sessions" ON public.cash_sessions;
CREATE POLICY "Store owners can insert cash sessions" ON public.cash_sessions
  FOR INSERT WITH CHECK (is_store_owner(auth.uid(), store_id));

DROP POLICY IF EXISTS "Store owners can update cash sessions" ON public.cash_sessions;
CREATE POLICY "Store owners can update cash sessions" ON public.cash_sessions
  FOR UPDATE USING (is_store_owner(auth.uid(), store_id));

-- ── cash_movements ──
DROP POLICY IF EXISTS "Store owners can view cash movements" ON public.cash_movements;
CREATE POLICY "Store owners can view cash movements" ON public.cash_movements
  FOR SELECT USING (is_store_owner(auth.uid(), store_id));

DROP POLICY IF EXISTS "Store owners can insert cash movements" ON public.cash_movements;
CREATE POLICY "Store owners can insert cash movements" ON public.cash_movements
  FOR INSERT WITH CHECK (is_store_owner(auth.uid(), store_id));

-- ── customers ──
DROP POLICY IF EXISTS "Store owners can view their customers" ON public.customers;
CREATE POLICY "Store owners can view their customers" ON public.customers
  FOR SELECT USING (is_store_owner(auth.uid(), store_id));

DROP POLICY IF EXISTS "Store owners can insert customers" ON public.customers;
CREATE POLICY "Store owners can insert customers" ON public.customers
  FOR INSERT WITH CHECK (is_store_owner(auth.uid(), store_id));

DROP POLICY IF EXISTS "Store owners can update customers" ON public.customers;
CREATE POLICY "Store owners can update customers" ON public.customers
  FOR UPDATE USING (is_store_owner(auth.uid(), store_id));

DROP POLICY IF EXISTS "Store owners can delete customers" ON public.customers;
CREATE POLICY "Store owners can delete customers" ON public.customers
  FOR DELETE USING (is_store_owner(auth.uid(), store_id));

-- ── order_payments ──
DROP POLICY IF EXISTS "Store owners can view their order payments" ON public.order_payments;
CREATE POLICY "Store owners can view their order payments" ON public.order_payments
  FOR SELECT USING (is_store_owner(auth.uid(), store_id));

DROP POLICY IF EXISTS "Store owners can insert order payments" ON public.order_payments;
CREATE POLICY "Store owners can insert order payments" ON public.order_payments
  FOR INSERT WITH CHECK (is_store_owner(auth.uid(), store_id));

DROP POLICY IF EXISTS "Store owners can update order payments" ON public.order_payments;
CREATE POLICY "Store owners can update order payments" ON public.order_payments
  FOR UPDATE USING (is_store_owner(auth.uid(), store_id));

DROP POLICY IF EXISTS "Store owners can delete order payments" ON public.order_payments;
CREATE POLICY "Store owners can delete order payments" ON public.order_payments
  FOR DELETE USING (is_store_owner(auth.uid(), store_id));
