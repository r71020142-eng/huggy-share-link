
-- =============================================
-- AUDIT FIX 1: CRM Triggers with proper WHEN clauses
-- Two separate triggers because INSERT WHEN cannot reference OLD
-- =============================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS trg_update_customer_crm_on_order_insert ON public.orders;
DROP TRIGGER IF EXISTS trg_update_customer_crm_on_order_update ON public.orders;
DROP TRIGGER IF EXISTS trg_update_customer_crm_on_order ON public.orders;

-- INSERT trigger: only fires when inserted directly as completed
CREATE TRIGGER trg_update_customer_crm_on_order_insert
  AFTER INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.update_customer_crm_on_order();

-- UPDATE trigger: only fires when transitioning TO completed from non-completed
CREATE TRIGGER trg_update_customer_crm_on_order_update
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (
    OLD.status IS DISTINCT FROM 'completed'
    AND NEW.status = 'completed'
  )
  EXECUTE FUNCTION public.update_customer_crm_on_order();

-- =============================================
-- AUDIT FIX 2: Harden the function with defense-in-depth
-- =============================================
CREATE OR REPLACE FUNCTION public.update_customer_crm_on_order()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  -- Skip if no customer linked
  IF NEW.customer_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Defense-in-depth (WHEN clauses already guarantee this)
  IF NEW.status <> 'completed' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  -- Atomic server-side update (no frontend dependency)
  UPDATE public.customers SET
    total_orders = total_orders + 1,
    total_spent = total_spent + COALESCE(NEW.total, 0),
    last_order_at = NEW.created_at,
    first_order_at = COALESCE(first_order_at, NEW.created_at)
  WHERE id = NEW.customer_id;

  -- Reclassify CRM status
  PERFORM public.classify_customer_crm_status(NEW.customer_id);

  RETURN NEW;
END;
$function$;

-- =============================================
-- AUDIT: Drop orphan function (no trigger attached)
-- =============================================
DROP FUNCTION IF EXISTS public.update_customer_last_order();
