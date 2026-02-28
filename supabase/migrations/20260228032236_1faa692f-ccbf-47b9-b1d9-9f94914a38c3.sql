
-- Update get_order_by_tracking to accept optional store_id for multi-tenant isolation
CREATE OR REPLACE FUNCTION public.get_order_by_tracking(p_tracking_code text, p_store_id uuid DEFAULT NULL)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result json;
BEGIN
  IF p_tracking_code IS NULL OR p_tracking_code = '' THEN
    RETURN NULL;
  END IF;

  SELECT json_build_object(
    'id', o.id,
    'status', o.status,
    'customer_name', o.customer_name,
    'total', o.total,
    'order_type', o.order_type,
    'tracking_code', o.tracking_code,
    'created_at', o.created_at
  ) INTO result
  FROM public.orders o
  WHERE o.tracking_code = p_tracking_code
    AND (p_store_id IS NULL OR o.store_id = p_store_id)
  LIMIT 1;

  RETURN result;
END;
$function$;

-- Update get_tracking_by_order_id to accept optional store_id for multi-tenant isolation
CREATE OR REPLACE FUNCTION public.get_tracking_by_order_id(p_order_id uuid, p_store_id uuid DEFAULT NULL)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result json;
BEGIN
  IF p_order_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT json_build_object(
    'id', o.id,
    'status', o.status,
    'tracking_code', o.tracking_code
  ) INTO result
  FROM public.orders o
  WHERE o.id = p_order_id
    AND (p_store_id IS NULL OR o.store_id = p_store_id)
  LIMIT 1;

  RETURN result;
END;
$function$;
