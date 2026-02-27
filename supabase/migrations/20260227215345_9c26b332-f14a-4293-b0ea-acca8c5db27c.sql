
CREATE OR REPLACE FUNCTION public.get_tracking_by_order_id(p_order_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  LIMIT 1;

  RETURN result;
END;
$$;
