
-- =============================================================
-- AUDITORIA FINAL – CORREÇÕES DE SEGURANÇA MULTI-TENANT
-- =============================================================

-- FIX 1: close_cash_session – Validar que o chamador é dono da loja
-- A função SECURITY DEFINER bypassa RLS, então precisa validar internamente
CREATE OR REPLACE FUNCTION public.close_cash_session(p_session_id uuid, p_closing_amount numeric, p_closed_by uuid, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_session RECORD;
  v_total_cash NUMERIC(10,2);
  v_total_pix NUMERIC(10,2);
  v_total_card NUMERIC(10,2);
  v_total_sales NUMERIC(10,2);
  v_total_sangrias NUMERIC(10,2);
  v_total_suprimentos NUMERIC(10,2);
  v_expected_cash NUMERIC(10,2);
  v_difference NUMERIC(10,2);
BEGIN
  -- Lock the session row
  SELECT * INTO v_session
    FROM public.cash_sessions
    WHERE id = p_session_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  -- SECURITY: Validate caller is the store owner
  IF NOT public.is_store_owner(auth.uid(), v_session.store_id) THEN
    RAISE EXCEPTION 'Access denied: you are not the owner of this store';
  END IF;

  IF v_session.status != 'open' THEN
    RAISE EXCEPTION 'Session is already closed';
  END IF;

  -- Calculate totals from order_payments
  SELECT
    COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN payment_method = 'pix' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN payment_method IN ('credit', 'debit') THEN amount ELSE 0 END), 0),
    COALESCE(SUM(amount), 0)
  INTO v_total_cash, v_total_pix, v_total_card, v_total_sales
  FROM public.order_payments
  WHERE cash_session_id = p_session_id;

  -- Calculate sangrias and suprimentos
  SELECT
    COALESCE(SUM(CASE WHEN type = 'sangria' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'suprimento' THEN amount ELSE 0 END), 0)
  INTO v_total_sangrias, v_total_suprimentos
  FROM public.cash_movements
  WHERE cash_session_id = p_session_id;

  -- Expected cash = opening + cash sales + suprimentos - sangrias
  v_expected_cash := v_session.initial_cash_amount + v_total_cash + v_total_suprimentos - v_total_sangrias;
  v_difference := ROUND(p_closing_amount - v_expected_cash, 2);

  UPDATE public.cash_sessions SET
    status = 'closed',
    closed_at = now(),
    closed_by = p_closed_by,
    final_cash_amount = p_closing_amount,
    expected_cash_amount = v_expected_cash,
    cash_difference = v_difference,
    total_sales_amount = v_total_sales,
    total_cash_amount = v_total_cash,
    total_pix_amount = v_total_pix,
    total_card_amount = v_total_card,
    total_sangrias = v_total_sangrias,
    total_suprimentos = v_total_suprimentos,
    notes = COALESCE(p_notes, notes)
  WHERE id = p_session_id;

  RETURN jsonb_build_object(
    'session_id', p_session_id,
    'total_sales', v_total_sales,
    'total_cash', v_total_cash,
    'total_pix', v_total_pix,
    'total_card', v_total_card,
    'total_sangrias', v_total_sangrias,
    'total_suprimentos', v_total_suprimentos,
    'expected_cash', v_expected_cash,
    'closing_amount', p_closing_amount,
    'difference', v_difference
  );
END;
$function$;

-- FIX 2: Superadmin precisa ver print_agents para monitoramento
CREATE POLICY "Superadmins can read all print agents"
ON public.print_agents
FOR SELECT
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- FIX 3: Superadmin precisa ver orders para monitoramento completo (já existe)
-- OK - "Superadmins can read all orders" já existe

-- =============================================================
-- PARTE 7: OBSERVABILIDADE – store_print_metrics_daily
-- =============================================================

CREATE TABLE IF NOT EXISTS public.store_print_metrics_daily (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  metric_date date NOT NULL DEFAULT CURRENT_DATE,
  total_prints integer NOT NULL DEFAULT 0,
  total_errors integer NOT NULL DEFAULT 0,
  success_rate numeric(5,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id, metric_date)
);

ALTER TABLE public.store_print_metrics_daily ENABLE ROW LEVEL SECURITY;

-- Store owners see their own metrics
CREATE POLICY "Store owners can view their print metrics"
ON public.store_print_metrics_daily
FOR SELECT
USING (is_store_owner(auth.uid(), store_id));

-- Superadmins see all metrics
CREATE POLICY "Superadmins can read all print metrics"
ON public.store_print_metrics_daily
FOR SELECT
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- System (triggers) can insert/update metrics
CREATE POLICY "System can manage print metrics"
ON public.store_print_metrics_daily
FOR ALL
USING (is_store_owner(auth.uid(), store_id))
WITH CHECK (is_store_owner(auth.uid(), store_id));

-- Trigger function: auto-update daily metrics on print_logs insert
CREATE OR REPLACE FUNCTION public.update_print_metrics_on_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_date date;
BEGIN
  v_date := CURRENT_DATE;
  
  INSERT INTO public.store_print_metrics_daily (store_id, metric_date, total_prints, total_errors, success_rate)
  VALUES (
    NEW.store_id,
    v_date,
    CASE WHEN NEW.status = 'success' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'success' THEN 100.00 ELSE 0.00 END
  )
  ON CONFLICT (store_id, metric_date)
  DO UPDATE SET
    total_prints = store_print_metrics_daily.total_prints + CASE WHEN NEW.status = 'success' THEN 1 ELSE 0 END,
    total_errors = store_print_metrics_daily.total_errors + CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
    success_rate = CASE 
      WHEN (store_print_metrics_daily.total_prints + CASE WHEN NEW.status = 'success' THEN 1 ELSE 0 END + store_print_metrics_daily.total_errors + CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END) > 0
      THEN ROUND(
        (store_print_metrics_daily.total_prints + CASE WHEN NEW.status = 'success' THEN 1 ELSE 0 END)::numeric * 100.0 /
        (store_print_metrics_daily.total_prints + CASE WHEN NEW.status = 'success' THEN 1 ELSE 0 END + store_print_metrics_daily.total_errors + CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END)::numeric
      , 2)
      ELSE 0.00
    END,
    updated_at = now();
  
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_update_print_metrics
AFTER INSERT ON public.print_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_print_metrics_on_log();

-- Grant realtime for metrics
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_print_metrics_daily;
