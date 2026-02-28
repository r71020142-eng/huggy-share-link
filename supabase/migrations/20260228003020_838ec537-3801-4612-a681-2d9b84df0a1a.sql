
-- Add payment_status and paid_at to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'paid',
  ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone;

-- Backfill existing orders as 'paid'
UPDATE public.orders SET payment_status = 'paid', paid_at = created_at WHERE payment_status = 'paid' AND paid_at IS NULL;

-- Create RPC to confirm fiado payment (SECURITY DEFINER with ownership check)
CREATE OR REPLACE FUNCTION public.confirm_fiado_payment(
  p_order_id uuid,
  p_payment_method text,
  p_closed_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order RECORD;
  v_session RECORD;
BEGIN
  -- Lock order row
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Validate ownership
  IF NOT public.is_store_owner(auth.uid(), v_order.store_id) THEN
    RAISE EXCEPTION 'Access denied: you are not the owner of this store';
  END IF;

  -- Validate status
  IF v_order.payment_status != 'pending' THEN
    RAISE EXCEPTION 'Order is not pending payment (current: %)', v_order.payment_status;
  END IF;

  -- Find active cash session for this store
  SELECT * INTO v_session FROM public.cash_sessions
    WHERE store_id = v_order.store_id AND status = 'open'
    LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No open cash session. Open the register first.';
  END IF;

  -- Update order
  UPDATE public.orders SET
    payment_status = 'paid',
    payment_method = p_payment_method,
    paid_at = now(),
    updated_at = now()
  WHERE id = p_order_id;

  -- Create order_payment record linked to current cash session
  INSERT INTO public.order_payments (order_id, store_id, payment_method, amount, cash_session_id)
  VALUES (p_order_id, v_order.store_id, p_payment_method, v_order.total, v_session.id);

  RETURN jsonb_build_object(
    'order_id', p_order_id,
    'payment_method', p_payment_method,
    'amount', v_order.total,
    'cash_session_id', v_session.id,
    'paid_at', now()
  );
END;
$$;
