
CREATE OR REPLACE FUNCTION public.auto_create_print_job()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.print_jobs (store_id, order_id, idempotency_key)
  VALUES (NEW.store_id, NEW.id, 'print_' || NEW.id::text)
  ON CONFLICT (idempotency_key) DO NOTHING;
  RETURN NEW;
END;
$function$;
