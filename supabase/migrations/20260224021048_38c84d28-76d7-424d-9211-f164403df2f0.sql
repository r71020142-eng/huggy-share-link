
-- ============================================================
-- CRM AVANÇADO: colunas, triggers, classificação automática
-- ============================================================

-- ETAPA 1: Adicionar colunas na tabela customers
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS first_order_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS total_orders INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_spent NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS crm_status TEXT NOT NULL DEFAULT 'novo';

-- Índice para consultas CRM por loja e status
CREATE INDEX IF NOT EXISTS idx_customers_store_crm_status
  ON public.customers (store_id, crm_status);

-- ============================================================
-- ETAPA 2: Trigger incremental em orders (AFTER INSERT)
-- Atualiza total_orders, total_spent, last_order_at, first_order_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_customer_crm_on_order()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Só processa se tiver customer_id
  IF NEW.customer_id IS NOT NULL THEN
    UPDATE public.customers SET
      total_orders = total_orders + 1,
      total_spent = total_spent + COALESCE(NEW.total, 0),
      last_order_at = NEW.created_at,
      first_order_at = COALESCE(first_order_at, NEW.created_at)
    WHERE id = NEW.customer_id;

    -- Recalcular crm_status após atualizar last_order_at
    PERFORM public.classify_customer_crm_status(NEW.customer_id);
  END IF;
  RETURN NEW;
END;
$function$;

-- Dropar trigger antigo de last_order_at para evitar duplicação
DROP TRIGGER IF EXISTS trg_update_customer_last_order ON public.orders;

-- Criar novo trigger unificado
CREATE TRIGGER trg_update_customer_crm_on_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_customer_crm_on_order();

-- ============================================================
-- ETAPA 3: Função de classificação automática
-- ============================================================

CREATE OR REPLACE FUNCTION public.classify_customer_crm_status(p_customer_id UUID)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_last_order TIMESTAMPTZ;
  v_total_orders INTEGER;
  v_new_status TEXT;
  v_days_since INTEGER;
BEGIN
  SELECT last_order_at, total_orders
    INTO v_last_order, v_total_orders
    FROM public.customers
    WHERE id = p_customer_id;

  -- Sem pedidos = novo
  IF v_last_order IS NULL OR v_total_orders = 0 THEN
    v_new_status := 'novo';
  ELSE
    v_days_since := EXTRACT(DAY FROM (now() - v_last_order))::INTEGER;

    IF v_days_since <= 10 THEN
      v_new_status := 'ativo';
    ELSIF v_days_since <= 30 THEN
      v_new_status := 'morno';
    ELSIF v_days_since <= 60 THEN
      v_new_status := 'inativo';
    ELSE
      v_new_status := 'perdido';
    END IF;
  END IF;

  UPDATE public.customers
    SET crm_status = v_new_status
    WHERE id = p_customer_id AND crm_status IS DISTINCT FROM v_new_status;
END;
$function$;

-- ============================================================
-- Trigger para reclassificar quando last_order_at muda
-- ============================================================

CREATE OR REPLACE FUNCTION public.trigger_classify_customer_crm()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.last_order_at IS DISTINCT FROM OLD.last_order_at THEN
    PERFORM public.classify_customer_crm_status(NEW.id);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_classify_customer_crm ON public.customers;

CREATE TRIGGER trg_classify_customer_crm
  AFTER UPDATE OF last_order_at ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_classify_customer_crm();

-- ============================================================
-- Função batch para reclassificar TODOS os clientes de uma loja
-- (útil para manutenção / cron)
-- ============================================================

CREATE OR REPLACE FUNCTION public.reclassify_all_customers(p_store_id UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_count INTEGER := 0;
  v_customer RECORD;
BEGIN
  FOR v_customer IN
    SELECT id FROM public.customers
    WHERE (p_store_id IS NULL OR store_id = p_store_id)
  LOOP
    PERFORM public.classify_customer_crm_status(v_customer.id);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$function$;

-- ============================================================
-- Backfill: popular dados para clientes existentes
-- Calcula total_orders e total_spent a partir de orders existentes
-- ============================================================

UPDATE public.customers c SET
  total_orders = sub.cnt,
  total_spent = sub.total,
  first_order_at = sub.first_at,
  last_order_at = COALESCE(c.last_order_at, sub.last_at)
FROM (
  SELECT
    customer_id,
    COUNT(*)::INTEGER as cnt,
    COALESCE(SUM(total), 0) as total,
    MIN(created_at) as first_at,
    MAX(created_at) as last_at
  FROM public.orders
  WHERE customer_id IS NOT NULL
  GROUP BY customer_id
) sub
WHERE c.id = sub.customer_id;

-- Reclassificar todos após backfill
SELECT public.reclassify_all_customers();
