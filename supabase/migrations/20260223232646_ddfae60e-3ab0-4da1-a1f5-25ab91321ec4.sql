
-- 1. UNIQUE constraint on customers (store_id, phone) to prevent duplicates
ALTER TABLE public.customers
  ADD CONSTRAINT unique_store_phone UNIQUE (store_id, phone);

-- 2. Alter amount to NUMERIC(10,2) for precision
ALTER TABLE public.order_payments
  ALTER COLUMN amount TYPE NUMERIC(10,2);

-- 3. Validation trigger for amount > 0 (using trigger instead of CHECK for flexibility)
CREATE OR REPLACE FUNCTION public.validate_order_payment_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_validate_payment_amount
  BEFORE INSERT OR UPDATE ON public.order_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_order_payment_amount();

-- 4. Validation trigger: order_payments.store_id must match orders.store_id
CREATE OR REPLACE FUNCTION public.validate_order_payment_store()
RETURNS TRIGGER AS $$
DECLARE
  order_store_id UUID;
BEGIN
  SELECT store_id INTO order_store_id FROM public.orders WHERE id = NEW.order_id;
  IF order_store_id IS NULL THEN
    RAISE EXCEPTION 'Order not found: %', NEW.order_id;
  END IF;
  IF order_store_id != NEW.store_id THEN
    RAISE EXCEPTION 'Payment store_id does not match order store_id';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_validate_payment_store
  BEFORE INSERT ON public.order_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_order_payment_store();

-- 5. Trigger to auto-update customers.last_order_at when order is created
CREATE OR REPLACE FUNCTION public.update_customer_last_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL THEN
    UPDATE public.customers
      SET last_order_at = NEW.created_at
      WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_update_customer_last_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_customer_last_order();

-- 6. Backfill orphan orders: create order_payments from legacy payment_method
INSERT INTO public.order_payments (order_id, store_id, payment_method, amount)
SELECT o.id, o.store_id, COALESCE(o.payment_method, 'cash'), o.total
FROM public.orders o
WHERE NOT EXISTS (SELECT 1 FROM public.order_payments op WHERE op.order_id = o.id)
  AND o.total > 0;
