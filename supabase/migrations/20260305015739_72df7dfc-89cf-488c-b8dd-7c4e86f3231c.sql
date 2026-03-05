
-- Drop the old trigger that fires on INSERT
DROP TRIGGER IF EXISTS trg_auto_create_order_payment ON public.orders;

-- Replace the function to work on UPDATE (when status changes to completed)
CREATE OR REPLACE FUNCTION public.auto_create_order_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_session RECORD;
BEGIN
  -- Only act when status transitions to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    -- Check if payment already exists for this order to avoid duplicates
    IF EXISTS (SELECT 1 FROM public.order_payments WHERE order_id = NEW.id) THEN
      RETURN NEW;
    END IF;

    -- Find active cash session for this store
    SELECT id INTO v_session
      FROM public.cash_sessions
      WHERE store_id = NEW.store_id AND status = 'open'
      LIMIT 1;

    -- If there's an open cash session, create payment record
    IF v_session.id IS NOT NULL AND NEW.payment_method IS NOT NULL THEN
      INSERT INTO public.order_payments (order_id, store_id, payment_method, amount, cash_session_id)
      VALUES (NEW.id, NEW.store_id, NEW.payment_method, NEW.total, v_session.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger on UPDATE for non-manual orders
CREATE TRIGGER trg_auto_create_order_payment
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  WHEN (NEW.is_manual IS NOT TRUE)
  EXECUTE FUNCTION public.auto_create_order_payment();
