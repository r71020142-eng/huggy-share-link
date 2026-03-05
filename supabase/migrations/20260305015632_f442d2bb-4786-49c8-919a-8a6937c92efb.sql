
CREATE OR REPLACE FUNCTION public.auto_create_order_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_session RECORD;
BEGIN
  -- Find active cash session for this store
  SELECT id INTO v_session
    FROM public.cash_sessions
    WHERE store_id = NEW.store_id AND status = 'open'
    LIMIT 1;

  -- If there's an open cash session and order has a payment method, create payment record
  IF v_session.id IS NOT NULL AND NEW.payment_method IS NOT NULL THEN
    INSERT INTO public.order_payments (order_id, store_id, payment_method, amount, cash_session_id)
    VALUES (NEW.id, NEW.store_id, NEW.payment_method, NEW.total, v_session.id);
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger on orders table for non-manual orders (manual orders handle payments separately)
CREATE TRIGGER trg_auto_create_order_payment
  AFTER INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.is_manual IS NOT TRUE)
  EXECUTE FUNCTION public.auto_create_order_payment();
