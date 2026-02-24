
-- Drop trigger antigo
DROP TRIGGER IF EXISTS trg_update_customer_crm_on_order ON public.orders;

-- Recriar função para funcionar com INSERT e UPDATE, só em completed
CREATE OR REPLACE FUNCTION public.update_customer_crm_on_order()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.customer_id IS NOT NULL AND NEW.status = 'completed' THEN
    IF TG_OP = 'UPDATE' AND OLD.status = 'completed' THEN
      RETURN NEW;
    END IF;

    UPDATE public.customers SET
      total_orders = total_orders + 1,
      total_spent = total_spent + COALESCE(NEW.total, 0),
      last_order_at = NEW.created_at,
      first_order_at = COALESCE(first_order_at, NEW.created_at)
    WHERE id = NEW.customer_id;

    PERFORM public.classify_customer_crm_status(NEW.customer_id);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_update_customer_crm_on_order_insert
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_customer_crm_on_order();

CREATE TRIGGER trg_update_customer_crm_on_order_update
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_customer_crm_on_order();
