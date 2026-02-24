
-- Auto-generate tracking_code for all new orders
CREATE OR REPLACE FUNCTION public.generate_tracking_code()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.tracking_code IS NULL THEN
    -- Generate a short alphanumeric code: first 4 chars of uuid + random 4 digits
    NEW.tracking_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4))
                       || lpad(floor(random() * 10000)::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_generate_tracking_code
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_tracking_code();

-- Backfill existing orders without tracking codes
UPDATE public.orders
SET tracking_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4))
                  || lpad(floor(random() * 10000)::text, 4, '0')
WHERE tracking_code IS NULL;
