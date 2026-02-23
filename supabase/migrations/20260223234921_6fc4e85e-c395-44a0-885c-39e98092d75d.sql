
-- 1. Create cash_sessions table
CREATE TABLE public.cash_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  initial_cash_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  final_cash_amount NUMERIC(10,2),
  expected_cash_amount NUMERIC(10,2),
  cash_difference NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes
CREATE INDEX idx_cash_sessions_store_status ON public.cash_sessions(store_id, status);
CREATE INDEX idx_cash_sessions_store_opened ON public.cash_sessions(store_id, opened_at);

-- 3. RLS
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can view cash sessions"
  ON public.cash_sessions FOR SELECT
  USING (public.is_store_owner(store_id, auth.uid()));

CREATE POLICY "Store owners can insert cash sessions"
  ON public.cash_sessions FOR INSERT
  WITH CHECK (public.is_store_owner(store_id, auth.uid()));

CREATE POLICY "Store owners can update cash sessions"
  ON public.cash_sessions FOR UPDATE
  USING (public.is_store_owner(store_id, auth.uid()));

-- 4. Add cash_session_id to order_payments
ALTER TABLE public.order_payments
  ADD COLUMN cash_session_id UUID REFERENCES public.cash_sessions(id);

CREATE INDEX idx_order_payments_session ON public.order_payments(cash_session_id);

-- 5. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_sessions;
