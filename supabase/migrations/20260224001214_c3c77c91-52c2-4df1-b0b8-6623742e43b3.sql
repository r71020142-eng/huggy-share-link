
-- ============================================================
-- BLINDAGEM 1: Impedir dois caixas abertos na mesma loja
-- Unique partial index = à prova de race condition
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_cash_sessions_one_open_per_store
  ON public.cash_sessions (store_id)
  WHERE status = 'open';

-- ============================================================
-- BLINDAGEM 2: Pedido manual (is_manual=true) exige caixa aberto
-- Trigger na tabela orders BEFORE INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_manual_order_requires_cash_session()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.is_manual = true THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.cash_sessions
      WHERE store_id = NEW.store_id AND status = 'open'
    ) THEN
      RAISE EXCEPTION 'Cannot create manual order: no open cash session for this store';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_validate_manual_order_cash_session
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_manual_order_requires_cash_session();

-- ============================================================
-- BLINDAGEM 3: Pagamento cash exige cash_session_id válido e aberto
-- + Valida que cash_session pertence à mesma store
-- Trigger na tabela order_payments BEFORE INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_cash_payment_session()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  session_record RECORD;
BEGIN
  -- Only validate cash payments
  IF NEW.payment_method = 'cash' THEN
    -- Must have a cash_session_id
    IF NEW.cash_session_id IS NULL THEN
      RAISE EXCEPTION 'Cash payment requires a cash_session_id';
    END IF;

    -- Fetch the session and validate
    SELECT store_id, status INTO session_record
      FROM public.cash_sessions
      WHERE id = NEW.cash_session_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cash session not found: %', NEW.cash_session_id;
    END IF;

    -- Must belong to same store
    IF session_record.store_id != NEW.store_id THEN
      RAISE EXCEPTION 'Cash session store_id does not match payment store_id';
    END IF;

    -- Must be open
    IF session_record.status != 'open' THEN
      RAISE EXCEPTION 'Cannot add cash payment to a closed cash session';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_validate_cash_payment_session
  BEFORE INSERT ON public.order_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_cash_payment_session();

-- ============================================================
-- BLINDAGEM 4: Validar cash_session_id store consistency 
-- para QUALQUER payment method que tenha cash_session_id
-- (reforço extra para non-cash payments que venham vinculados)
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_payment_session_store()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  session_store UUID;
BEGIN
  IF NEW.cash_session_id IS NOT NULL AND NEW.payment_method != 'cash' THEN
    SELECT store_id INTO session_store
      FROM public.cash_sessions
      WHERE id = NEW.cash_session_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cash session not found: %', NEW.cash_session_id;
    END IF;

    IF session_store != NEW.store_id THEN
      RAISE EXCEPTION 'Cash session store_id does not match payment store_id';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_validate_payment_session_store
  BEFORE INSERT ON public.order_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_payment_session_store();
