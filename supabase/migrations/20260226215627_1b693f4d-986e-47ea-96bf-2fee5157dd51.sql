
-- Trigger to recalculate order_items subtotal based on real additional prices
-- Prevents frontend price manipulation
CREATE OR REPLACE FUNCTION public.validate_order_item_prices()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_real_product_price NUMERIC;
  v_real_adds_total NUMERIC := 0;
  v_add RECORD;
  v_adds JSONB;
  v_recalculated_adds JSONB := '[]'::jsonb;
BEGIN
  -- Get real product price
  SELECT price INTO v_real_product_price
    FROM public.products
    WHERE id = NEW.product_id;

  IF v_real_product_price IS NULL THEN
    -- product_id may be null for custom items, skip validation
    RETURN NEW;
  END IF;

  -- Override unit_price with real price
  NEW.unit_price := v_real_product_price;

  -- Recalculate additionals from real DB prices
  IF NEW.additionals IS NOT NULL AND NEW.additionals::text != 'null' AND NEW.additionals::text != '[]' THEN
    v_adds := NEW.additionals::jsonb;
    
    FOR v_add IN SELECT * FROM jsonb_array_elements(v_adds)
    LOOP
      DECLARE
        v_add_id UUID;
        v_real_add_price NUMERIC;
        v_add_qty INTEGER;
        v_add_name TEXT;
      BEGIN
        v_add_id := (v_add.value ->> 'id')::uuid;
        v_add_qty := COALESCE((v_add.value ->> 'quantity')::integer, 1);
        v_add_name := v_add.value ->> 'name';

        -- Get real price from DB, validate it belongs to same store via product
        SELECT pa.price INTO v_real_add_price
          FROM public.product_additionals pa
          WHERE pa.id = v_add_id
            AND pa.product_id = NEW.product_id
            AND pa.is_active = true;

        IF v_real_add_price IS NOT NULL THEN
          v_real_adds_total := v_real_adds_total + (COALESCE(v_real_add_price, 0) * v_add_qty);
          -- Rebuild additional with real price
          v_recalculated_adds := v_recalculated_adds || jsonb_build_object(
            'id', v_add_id,
            'name', v_add_name,
            'price', v_real_add_price,
            'quantity', v_add_qty
          );
        END IF;
        -- If additional not found or not belonging to product, silently skip it
      END;
    END LOOP;

    NEW.additionals := v_recalculated_adds;
  END IF;

  -- Recalculate subtotal = (product_price + adds_total) * quantity
  NEW.subtotal := (v_real_product_price + v_real_adds_total) * NEW.quantity;

  RETURN NEW;
END;
$function$;

-- Apply trigger on INSERT (and UPDATE for corrections)
DROP TRIGGER IF EXISTS trg_validate_order_item_prices ON public.order_items;
CREATE TRIGGER trg_validate_order_item_prices
  BEFORE INSERT OR UPDATE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_order_item_prices();

-- Also create a trigger to recalculate order total after items change
CREATE OR REPLACE FUNCTION public.recalculate_order_total()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_subtotal NUMERIC;
  v_delivery_fee NUMERIC;
BEGIN
  SELECT COALESCE(SUM(subtotal), 0) INTO v_subtotal
    FROM public.order_items
    WHERE order_id = NEW.order_id;

  SELECT COALESCE(delivery_fee, 0) INTO v_delivery_fee
    FROM public.orders
    WHERE id = NEW.order_id;

  UPDATE public.orders
    SET subtotal = v_subtotal,
        total = v_subtotal + v_delivery_fee
    WHERE id = NEW.order_id;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_recalculate_order_total ON public.order_items;
CREATE TRIGGER trg_recalculate_order_total
  AFTER INSERT OR UPDATE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_order_total();
