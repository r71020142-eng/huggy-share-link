
-- ============================================================
-- MÓDULO PROFISSIONAL DE CAIXA: SANGRIA, SUPRIMENTO, FECHAMENTO
-- ============================================================

-- ── 1) Novas colunas em cash_sessions ───────────────────────
ALTER TABLE public.cash_sessions
  ADD COLUMN IF NOT EXISTS closed_by UUID,
  ADD COLUMN IF NOT EXISTS total_sales_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_cash_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_pix_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_card_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_sangrias NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_suprimentos NUMERIC(10,2) DEFAULT 0;

-- ── 2) Tabela cash_movements (sangria + suprimento) ────────
CREATE TABLE IF NOT EXISTS public.cash_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id),
  cash_session_id UUID NOT NULL REFERENCES public.cash_sessions(id),
  type TEXT NOT NULL CHECK (type IN ('sangria', 'suprimento')),
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can view cash movements"
  ON public.cash_movements FOR SELECT
  USING (is_store_owner(store_id, auth.uid()));

CREATE POLICY "Store owners can insert cash movements"
  ON public.cash_movements FOR INSERT
  WITH CHECK (is_store_owner(store_id, auth.uid()));

-- Prevent delete/update of cash movements (immutable audit trail)

-- ── 3) TRIGGER: Validar cash_movement (sessão aberta, amount>0, store match) ──
CREATE OR REPLACE FUNCTION public.validate_cash_movement()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  session_record RECORD;
BEGIN
  -- amount must be positive
  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Cash movement amount must be greater than zero';
  END IF;

  -- Fetch session
  SELECT store_id, status INTO session_record
    FROM public.cash_sessions
    WHERE id = NEW.cash_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cash session not found: %', NEW.cash_session_id;
  END IF;

  -- Store consistency
  IF session_record.store_id != NEW.store_id THEN
    RAISE EXCEPTION 'Cash movement store_id does not match session store_id';
  END IF;

  -- Session must be open
  IF session_record.status != 'open' THEN
    RAISE EXCEPTION 'Cannot add cash movement to a closed session';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_validate_cash_movement
  BEFORE INSERT ON public.cash_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_cash_movement();

-- ── 4) TRIGGER: Impedir edição de cash_session fechada ──────
CREATE OR REPLACE FUNCTION public.prevent_closed_session_edit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- If session is already closed, block most updates
  IF OLD.status = 'closed' THEN
    -- Only allow if nothing meaningful changes (defensive)
    RAISE EXCEPTION 'Cannot modify a closed cash session';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_prevent_closed_session_edit
  BEFORE UPDATE ON public.cash_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_closed_session_edit();

-- ── 5) TRIGGER: Impedir deletar cash_session fechada ────────
CREATE OR REPLACE FUNCTION public.prevent_cash_session_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  RAISE EXCEPTION 'Cash sessions cannot be deleted';
END;
$function$;

CREATE TRIGGER trg_prevent_cash_session_delete
  BEFORE DELETE ON public.cash_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_cash_session_delete();

-- ── 6) FUNCTION: Calcular totais e fechar sessão atomicamente ──
CREATE OR REPLACE FUNCTION public.close_cash_session(
  p_session_id UUID,
  p_closing_amount NUMERIC,
  p_closed_by UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
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

  -- Disable the prevent-edit trigger temporarily for this update
  -- We do this by directly updating and the trigger checks OLD.status
  -- Since OLD.status is 'open', the trigger allows the update
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
