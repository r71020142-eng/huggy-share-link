
-- =============================================
-- FIX: Replace header-based policies with proper RPC approach
-- The public tracking will use an RPC function instead of direct table access
-- =============================================

-- Remove the broken header-based policies
DROP POLICY IF EXISTS "Public can read own orders by tracking code" ON public.orders;
DROP POLICY IF EXISTS "Public can read order items via tracking" ON public.order_items;

-- Create RPC for public order tracking (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_order_by_tracking(p_tracking_code text)
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
  LIMIT 1;

  RETURN result;
END;
$function$;
