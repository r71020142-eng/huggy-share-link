// Auto-gerado a partir do schema atual do banco (schema public).
// Use para recriar as tabelas em outro projeto.
export const SCHEMA_SQL = `-- =====================================================
-- SCHEMA SQL - migracao das tabelas (schema public)
-- =====================================================

-- ENUM TYPES
DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'superadmin'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.plan_type AS ENUM ('basic', 'pro'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.activation_keys (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  code text NOT NULL,
  plan_type plan_type DEFAULT 'pro'::plan_type NOT NULL,
  max_uses integer DEFAULT 1,
  current_uses integer DEFAULT 0,
  is_active boolean DEFAULT true,
  expires_at timestamp with time zone,
  used_at timestamp with time zone,
  used_by_store_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT activation_keys_used_by_store_id_fkey FOREIGN KEY (used_by_store_id) REFERENCES stores(id),
  CONSTRAINT activation_keys_pkey PRIMARY KEY (id),
  CONSTRAINT activation_keys_code_key UNIQUE (code)
);
ALTER TABLE public.activation_keys ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activation_keys TO authenticated;
GRANT ALL ON public.activation_keys TO service_role;

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  user_email text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb,
  ip_address text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id)
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs USING btree (action);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;

CREATE TABLE IF NOT EXISTS public.cash_movements (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  cash_session_id uuid NOT NULL,
  type text NOT NULL,
  amount numeric(10,2) NOT NULL,
  description text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT cash_movements_type_check CHECK ((type = ANY (ARRAY['sangria'::text, 'suprimento'::text]))),
  CONSTRAINT cash_movements_cash_session_id_fkey FOREIGN KEY (cash_session_id) REFERENCES cash_sessions(id),
  CONSTRAINT cash_movements_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id),
  CONSTRAINT cash_movements_pkey PRIMARY KEY (id)
);
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_movements TO authenticated;
GRANT ALL ON public.cash_movements TO service_role;

CREATE TABLE IF NOT EXISTS public.cash_sessions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  opened_by uuid NOT NULL,
  opened_at timestamp with time zone DEFAULT now() NOT NULL,
  closed_at timestamp with time zone,
  initial_cash_amount numeric(10,2) DEFAULT 0 NOT NULL,
  final_cash_amount numeric(10,2),
  expected_cash_amount numeric(10,2),
  cash_difference numeric(10,2),
  status text DEFAULT 'open'::text NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  closed_by uuid,
  total_sales_amount numeric(10,2) DEFAULT 0,
  total_cash_amount numeric(10,2) DEFAULT 0,
  total_pix_amount numeric(10,2) DEFAULT 0,
  total_card_amount numeric(10,2) DEFAULT 0,
  total_sangrias numeric(10,2) DEFAULT 0,
  total_suprimentos numeric(10,2) DEFAULT 0,
  CONSTRAINT cash_sessions_status_check CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text]))),
  CONSTRAINT cash_sessions_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  CONSTRAINT cash_sessions_pkey PRIMARY KEY (id)
);
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_cash_sessions_store_status ON public.cash_sessions USING btree (store_id, status);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_store_opened ON public.cash_sessions USING btree (store_id, opened_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cash_sessions_one_open_per_store ON public.cash_sessions USING btree (store_id) WHERE (status = 'open'::text);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_sessions TO authenticated;
GRANT ALL ON public.cash_sessions TO service_role;

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  name text NOT NULL,
  icon text,
  image_url text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT categories_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  address text,
  bairro text,
  complemento text,
  observations text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  last_order_at timestamp with time zone,
  first_order_at timestamp with time zone,
  total_orders integer DEFAULT 0 NOT NULL,
  total_spent numeric(10,2) DEFAULT 0 NOT NULL,
  crm_status text DEFAULT 'novo'::text NOT NULL,
  CONSTRAINT customers_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT unique_store_phone UNIQUE (store_id, phone)
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_customers_store_crm_status ON public.customers USING btree (store_id, crm_status);
CREATE INDEX IF NOT EXISTS idx_customers_store_phone ON public.customers USING btree (store_id, phone);
CREATE INDEX IF NOT EXISTS idx_customers_store_last_order ON public.customers USING btree (store_id, last_order_at);
CREATE INDEX IF NOT EXISTS idx_customers_store_name ON public.customers USING btree (store_id, name);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;

CREATE TABLE IF NOT EXISTS public.menu_banners (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  menu_id uuid NOT NULL,
  store_id uuid NOT NULL,
  image_url text NOT NULL,
  link_url text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  link_product_id uuid,
  link_category_id uuid,
  CONSTRAINT menu_banners_link_category_id_fkey FOREIGN KEY (link_category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT menu_banners_link_product_id_fkey FOREIGN KEY (link_product_id) REFERENCES products(id) ON DELETE SET NULL,
  CONSTRAINT menu_banners_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
  CONSTRAINT menu_banners_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  CONSTRAINT menu_banners_pkey PRIMARY KEY (id)
);
ALTER TABLE public.menu_banners ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_banners TO authenticated;
GRANT ALL ON public.menu_banners TO service_role;

CREATE TABLE IF NOT EXISTS public.menu_products (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  menu_id uuid NOT NULL,
  product_id uuid NOT NULL,
  sort_order integer DEFAULT 0,
  is_available boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT menu_products_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
  CONSTRAINT menu_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT menu_products_pkey PRIMARY KEY (id),
  CONSTRAINT menu_products_menu_id_product_id_key UNIQUE (menu_id, product_id)
);
ALTER TABLE public.menu_products ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_menu_products_menu_id ON public.menu_products USING btree (menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_products_product_id ON public.menu_products USING btree (product_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_products TO authenticated;
GRANT ALL ON public.menu_products TO service_role;

CREATE TABLE IF NOT EXISTS public.menus (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  is_published boolean DEFAULT false,
  is_primary boolean DEFAULT false,
  logo_url text,
  banner_url text,
  theme_color text DEFAULT '#7c3aed'::text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  font_family text DEFAULT 'Inter'::text,
  bg_color text DEFAULT '#ffffff'::text,
  text_color text DEFAULT '#1a1a1a'::text,
  show_banner boolean DEFAULT true,
  show_categories boolean DEFAULT true,
  show_featured boolean DEFAULT true,
  show_search boolean DEFAULT true,
  show_all_category boolean DEFAULT true,
  banner_mode text DEFAULT 'single'::text,
  CONSTRAINT menus_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  CONSTRAINT menus_pkey PRIMARY KEY (id),
  CONSTRAINT menus_store_id_slug_key UNIQUE (store_id, slug)
);
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menus TO authenticated;
GRANT ALL ON public.menus TO service_role;

CREATE TABLE IF NOT EXISTS public.neighborhoods (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  name text NOT NULL,
  delivery_fee numeric(10,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT neighborhoods_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  CONSTRAINT neighborhoods_pkey PRIMARY KEY (id)
);
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.neighborhoods TO authenticated;
GRANT ALL ON public.neighborhoods TO service_role;

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  order_id uuid NOT NULL,
  product_id uuid,
  product_name text NOT NULL,
  quantity integer DEFAULT 1 NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  additionals jsonb DEFAULT '[]'::jsonb,
  subtotal numeric(10,2) NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  CONSTRAINT order_items_pkey PRIMARY KEY (id)
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;

CREATE TABLE IF NOT EXISTS public.order_payments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  order_id uuid NOT NULL,
  store_id uuid NOT NULL,
  payment_method text NOT NULL,
  amount numeric(10,2) DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  cash_session_id uuid,
  CONSTRAINT order_payments_cash_session_id_fkey FOREIGN KEY (cash_session_id) REFERENCES cash_sessions(id),
  CONSTRAINT order_payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT order_payments_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  CONSTRAINT order_payments_pkey PRIMARY KEY (id)
);
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_order_payments_order ON public.order_payments USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_store ON public.order_payments USING btree (store_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_session ON public.order_payments USING btree (cash_session_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_payments TO authenticated;
GRANT ALL ON public.order_payments TO service_role;

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  customer_name text NOT NULL,
  customer_phone text,
  customer_address text,
  neighborhood_id uuid,
  delivery_fee numeric(10,2) DEFAULT 0,
  subtotal numeric(10,2) DEFAULT 0 NOT NULL,
  total numeric(10,2) DEFAULT 0 NOT NULL,
  status order_status DEFAULT 'pending'::order_status NOT NULL,
  order_type text DEFAULT 'delivery'::text,
  payment_method text DEFAULT 'cash'::text,
  notes text,
  tracking_code text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  customer_id uuid,
  is_manual boolean DEFAULT false,
  payment_status text DEFAULT 'paid'::text NOT NULL,
  paid_at timestamp with time zone,
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT orders_neighborhood_id_fkey FOREIGN KEY (neighborhood_id) REFERENCES neighborhoods(id),
  CONSTRAINT orders_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  CONSTRAINT orders_pkey PRIMARY KEY (id)
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

CREATE TABLE IF NOT EXISTS public.print_agents (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  token_hash text NOT NULL,
  machine_name text,
  agent_version text,
  last_seen_at timestamp with time zone,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT print_agents_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  CONSTRAINT print_agents_pkey PRIMARY KEY (id)
);
ALTER TABLE public.print_agents ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_print_agents_store_id ON public.print_agents USING btree (store_id);
CREATE INDEX IF NOT EXISTS idx_print_agents_token_hash ON public.print_agents USING btree (token_hash);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.print_agents TO authenticated;
GRANT ALL ON public.print_agents TO service_role;

CREATE TABLE IF NOT EXISTS public.print_jobs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  order_id uuid NOT NULL,
  idempotency_key text NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  attempts integer DEFAULT 0 NOT NULL,
  error_message text,
  printed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT print_jobs_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT print_jobs_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  CONSTRAINT print_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT print_jobs_idempotency_key_key UNIQUE (idempotency_key)
);
ALTER TABLE public.print_jobs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_print_jobs_store_status ON public.print_jobs USING btree (store_id, status);
CREATE INDEX IF NOT EXISTS idx_print_jobs_order ON public.print_jobs USING btree (order_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.print_jobs TO authenticated;
GRANT ALL ON public.print_jobs TO service_role;

CREATE TABLE IF NOT EXISTS public.print_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  job_id uuid,
  order_id uuid,
  status text DEFAULT 'success'::text NOT NULL,
  error_message text,
  attempts integer DEFAULT 1 NOT NULL,
  printed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT print_logs_job_id_fkey FOREIGN KEY (job_id) REFERENCES print_jobs(id),
  CONSTRAINT print_logs_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT print_logs_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id),
  CONSTRAINT print_logs_pkey PRIMARY KEY (id)
);
ALTER TABLE public.print_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_print_logs_store_id ON public.print_logs USING btree (store_id);
CREATE INDEX IF NOT EXISTS idx_print_logs_created_at ON public.print_logs USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_print_logs_status ON public.print_logs USING btree (status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.print_logs TO authenticated;
GRANT ALL ON public.print_logs TO service_role;

CREATE TABLE IF NOT EXISTS public.product_additionals (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  product_id uuid NOT NULL,
  name text NOT NULL,
  price numeric(10,2) DEFAULT 0,
  min_qty integer DEFAULT 0,
  max_qty integer DEFAULT 1,
  is_required boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  category text DEFAULT 'geral'::text,
  description text,
  CONSTRAINT product_additionals_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT product_additionals_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  CONSTRAINT product_additionals_pkey PRIMARY KEY (id)
);
ALTER TABLE public.product_additionals ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_additionals TO authenticated;
GRANT ALL ON public.product_additionals TO service_role;

CREATE TABLE IF NOT EXISTS public.products (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  category_id uuid,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  image_url text,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  badge text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  max_free_additionals integer,
  free_additionals_limits jsonb,
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT products_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_user_id_key UNIQUE (user_id)
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

CREATE TABLE IF NOT EXISTS public.store_print_metrics_daily (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  metric_date date DEFAULT CURRENT_DATE NOT NULL,
  total_prints integer DEFAULT 0 NOT NULL,
  total_errors integer DEFAULT 0 NOT NULL,
  success_rate numeric(5,2) DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT store_print_metrics_daily_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  CONSTRAINT store_print_metrics_daily_pkey PRIMARY KEY (id),
  CONSTRAINT store_print_metrics_daily_store_id_metric_date_key UNIQUE (store_id, metric_date)
);
ALTER TABLE public.store_print_metrics_daily ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_print_metrics_daily TO authenticated;
GRANT ALL ON public.store_print_metrics_daily TO service_role;

CREATE TABLE IF NOT EXISTS public.store_print_settings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  auto_print boolean DEFAULT false NOT NULL,
  print_mode text DEFAULT 'both'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT store_print_settings_print_mode_check CHECK ((print_mode = ANY (ARRAY['kitchen'::text, 'counter'::text, 'both'::text]))),
  CONSTRAINT store_print_settings_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  CONSTRAINT store_print_settings_pkey PRIMARY KEY (id),
  CONSTRAINT store_print_settings_store_id_key UNIQUE (store_id)
);
ALTER TABLE public.store_print_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_print_settings TO authenticated;
GRANT ALL ON public.store_print_settings TO service_role;

CREATE TABLE IF NOT EXISTS public.store_runtime_status (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  last_heartbeat timestamp with time zone,
  printer_status text DEFAULT 'offline'::text NOT NULL,
  printer_type text DEFAULT 'none'::text,
  printer_name text,
  queue_size integer DEFAULT 0 NOT NULL,
  failed_jobs integer DEFAULT 0 NOT NULL,
  last_print_at timestamp with time zone,
  total_prints integer DEFAULT 0 NOT NULL,
  total_errors integer DEFAULT 0 NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT store_runtime_status_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id),
  CONSTRAINT store_runtime_status_pkey PRIMARY KEY (id),
  CONSTRAINT store_runtime_status_store_id_key UNIQUE (store_id)
);
ALTER TABLE public.store_runtime_status ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_runtime_status TO authenticated;
GRANT ALL ON public.store_runtime_status TO service_role;

CREATE TABLE IF NOT EXISTS public.store_whatsapp_integrations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  provider text DEFAULT 'zapi'::text NOT NULL,
  instance_id text NOT NULL,
  phone_e164 text,
  active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT store_whatsapp_integrations_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  CONSTRAINT store_whatsapp_integrations_pkey PRIMARY KEY (id),
  CONSTRAINT uq_provider_instance UNIQUE (provider, instance_id),
  CONSTRAINT uq_store_provider UNIQUE (store_id, provider)
);
ALTER TABLE public.store_whatsapp_integrations ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_whatsapp_integrations TO authenticated;
GRANT ALL ON public.store_whatsapp_integrations TO service_role;

CREATE TABLE IF NOT EXISTS public.stores (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  owner_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  whatsapp text,
  address text,
  operating_hours text,
  promo_banner text,
  estimated_time text DEFAULT '30-45 min'::text,
  min_order numeric(10,2) DEFAULT 0,
  is_open boolean DEFAULT true,
  delivery_enabled boolean DEFAULT true,
  pickup_enabled boolean DEFAULT true,
  plan_type plan_type DEFAULT 'basic'::plan_type NOT NULL,
  logo_url text,
  banner_url text,
  theme_color text DEFAULT '#7c3aed'::text,
  monthly_goal numeric(10,2) DEFAULT 5000,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  dashboard_pin_hash text,
  CONSTRAINT stores_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT stores_pkey PRIMARY KEY (id),
  CONSTRAINT stores_slug_key UNIQUE (slug)
);
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO authenticated;
GRANT ALL ON public.stores TO service_role;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

CREATE TABLE IF NOT EXISTS public.whatsapp_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  provider text DEFAULT 'zapi'::text NOT NULL,
  instance_id text NOT NULL,
  external_message_id text NOT NULL,
  customer_phone text,
  customer_name text,
  message_text text,
  payload_raw jsonb,
  order_id uuid,
  status text DEFAULT 'received'::text NOT NULL,
  error_message text,
  received_at timestamp with time zone DEFAULT now() NOT NULL,
  processed_at timestamp with time zone,
  CONSTRAINT whatsapp_events_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  CONSTRAINT whatsapp_events_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  CONSTRAINT whatsapp_events_pkey PRIMARY KEY (id),
  CONSTRAINT uq_whatsapp_event_idempotency UNIQUE (provider, instance_id, external_message_id)
);
ALTER TABLE public.whatsapp_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_store_id ON public.whatsapp_events USING btree (store_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_received_at ON public.whatsapp_events USING btree (received_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_status ON public.whatsapp_events USING btree (status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_events TO authenticated;
GRANT ALL ON public.whatsapp_events TO service_role;

-- =====================================================
-- POLITICAS RLS
-- =====================================================
CREATE POLICY "Authenticated can read active keys for validation" ON public.activation_keys FOR SELECT TO public USING (((auth.uid() IS NOT NULL) AND (is_active = true) AND ((current_uses < max_uses) OR (max_uses IS NULL)) AND ((expires_at IS NULL) OR (expires_at > now()))));
CREATE POLICY "Superadmins can manage keys" ON public.activation_keys FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role));
CREATE POLICY "Superadmins can insert logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));
CREATE POLICY "Superadmins can read all logs" ON public.activity_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role));
CREATE POLICY "Users can insert own logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Store owners can insert cash movements" ON public.cash_movements FOR INSERT TO public WITH CHECK (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Store owners can view cash movements" ON public.cash_movements FOR SELECT TO public USING (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Store owners can insert cash sessions" ON public.cash_sessions FOR INSERT TO public WITH CHECK (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Store owners can update cash sessions" ON public.cash_sessions FOR UPDATE TO public USING (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Store owners can view cash sessions" ON public.cash_sessions FOR SELECT TO public USING (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Public can read active categories" ON public.categories FOR SELECT TO public USING ((is_active = true));
CREATE POLICY "Store owners can manage categories" ON public.categories FOR ALL TO authenticated USING (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Store owners can delete customers" ON public.customers FOR DELETE TO public USING (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Store owners can insert customers" ON public.customers FOR INSERT TO public WITH CHECK (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Store owners can update customers" ON public.customers FOR UPDATE TO public USING (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Store owners can view their customers" ON public.customers FOR SELECT TO public USING (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Public can read active banners" ON public.menu_banners FOR SELECT TO public USING (((is_active = true) AND (EXISTS ( SELECT 1);
CREATE POLICY "" ON public.   FROM menus FOR  TO ;
CREATE POLICY "" ON public.  WHERE ((menus.id = menu_banners.menu_id) AND (menus.is_published = true))))) FOR  TO ;
CREATE POLICY "Store owners can manage banners" ON public.menu_banners FOR ALL TO authenticated USING (is_store_owner(auth.uid(), store_id)) WITH CHECK (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Public can read menu products" ON public.menu_products FOR SELECT TO public USING ((EXISTS ( SELECT 1);
CREATE POLICY "" ON public.   FROM menus FOR  TO ;
CREATE POLICY "" ON public.  WHERE ((menus.id = menu_products.menu_id) AND (menus.is_published = true)))) FOR  TO ;
CREATE POLICY "Store owners can manage menu products" ON public.menu_products FOR ALL TO public USING ((EXISTS ( SELECT 1);
CREATE POLICY "" ON public.   FROM menus FOR  TO ;
CREATE POLICY "" ON public.  WHERE ((menus.id = menu_products.menu_id) AND is_store_owner(auth.uid(), menus.store_id)))) FOR  TO ;
CREATE POLICY "Public can read published menus" ON public.menus FOR SELECT TO public USING ((is_published = true));
CREATE POLICY "Store owners can manage menus" ON public.menus FOR ALL TO authenticated USING (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Public can read active neighborhoods" ON public.neighborhoods FOR SELECT TO public USING ((is_active = true));
CREATE POLICY "Store owners can manage neighborhoods" ON public.neighborhoods FOR ALL TO authenticated USING (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Anyone can create order items for valid orders" ON public.order_items FOR INSERT TO public WITH CHECK (order_exists(order_id));
CREATE POLICY "Store owners can manage order items" ON public.order_items FOR ALL TO authenticated USING ((EXISTS ( SELECT 1);
CREATE POLICY "" ON public.   FROM orders o FOR  TO ;
CREATE POLICY "" ON public.  WHERE ((o.id = order_items.order_id) AND is_store_owner(auth.uid(), o.store_id)))) FOR  TO ;
CREATE POLICY "Store owners can read order items" ON public.order_items FOR SELECT TO public USING ((EXISTS ( SELECT 1);
CREATE POLICY "" ON public.   FROM orders o FOR  TO ;
CREATE POLICY "" ON public.  WHERE ((o.id = order_items.order_id) AND is_store_owner(auth.uid(), o.store_id)))) FOR  TO ;
CREATE POLICY "Store owners can delete order payments" ON public.order_payments FOR DELETE TO public USING (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Store owners can insert order payments" ON public.order_payments FOR INSERT TO public WITH CHECK (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Store owners can update order payments" ON public.order_payments FOR UPDATE TO public USING (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Store owners can view their order payments" ON public.order_payments FOR SELECT TO public USING (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Anyone can create orders with valid store" ON public.orders FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1);
CREATE POLICY "" ON public.   FROM stores FOR  TO ;
CREATE POLICY "" ON public.  WHERE ((stores.id = orders.store_id) AND (stores.is_open = true)))) FOR  TO ;
CREATE POLICY "Store owners can manage orders" ON public.orders FOR ALL TO authenticated USING (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Store owners can read orders" ON public.orders FOR SELECT TO public USING (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Superadmins can read all orders" ON public.orders FOR SELECT TO public USING (has_role(auth.uid(), 'superadmin'::app_role));
CREATE POLICY "Store owners can manage their print agents" ON public.print_agents FOR ALL TO public USING (is_store_owner(auth.uid(), store_id)) WITH CHECK (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Superadmins can read all print agents" ON public.print_agents FOR SELECT TO public USING (has_role(auth.uid(), 'superadmin'::app_role));
CREATE POLICY "Store owners manage print jobs" ON public.print_jobs FOR ALL TO public USING (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Superadmins can read all print jobs" ON public.print_jobs FOR SELECT TO public USING (has_role(auth.uid(), 'superadmin'::app_role));
CREATE POLICY "Store owners can insert print logs" ON public.print_logs FOR INSERT TO public WITH CHECK (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Store owners can view their print logs" ON public.print_logs FOR SELECT TO public USING (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Superadmins can read all print logs" ON public.print_logs FOR SELECT TO public USING (has_role(auth.uid(), 'superadmin'::app_role));
CREATE POLICY "Public can read active additionals" ON public.product_additionals FOR SELECT TO public USING ((is_active = true));
CREATE POLICY "Store owners can manage additionals" ON public.product_additionals FOR ALL TO authenticated USING (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Public can read active products" ON public.products FOR SELECT TO public USING ((is_active = true));
CREATE POLICY "Store owners can manage products" ON public.products FOR ALL TO authenticated USING (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Superadmins can read all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY "Store owners can view their print metrics" ON public.store_print_metrics_daily FOR SELECT TO public USING (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Superadmins can read all print metrics" ON public.store_print_metrics_daily FOR SELECT TO public USING (has_role(auth.uid(), 'superadmin'::app_role));
CREATE POLICY "System can manage print metrics" ON public.store_print_metrics_daily FOR ALL TO public USING (is_store_owner(auth.uid(), store_id)) WITH CHECK (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Store owners can manage print settings" ON public.store_print_settings FOR ALL TO public USING (is_store_owner(auth.uid(), store_id)) WITH CHECK (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Superadmins can read all print settings" ON public.store_print_settings FOR SELECT TO public USING (has_role(auth.uid(), 'superadmin'::app_role));
CREATE POLICY "Store owners can manage their runtime status" ON public.store_runtime_status FOR ALL TO public USING (is_store_owner(auth.uid(), store_id)) WITH CHECK (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Superadmins can read all runtime statuses" ON public.store_runtime_status FOR SELECT TO public USING (has_role(auth.uid(), 'superadmin'::app_role));
CREATE POLICY "Store owners can delete their integrations" ON public.store_whatsapp_integrations FOR DELETE TO authenticated USING (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Store owners can insert their integrations" ON public.store_whatsapp_integrations FOR INSERT TO authenticated WITH CHECK (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Store owners can update their integrations" ON public.store_whatsapp_integrations FOR UPDATE TO authenticated USING (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Store owners can view their integrations" ON public.store_whatsapp_integrations FOR SELECT TO authenticated USING (is_store_owner(auth.uid(), store_id));
CREATE POLICY "Owners can manage their stores" ON public.stores FOR ALL TO authenticated USING (((owner_id = auth.uid()) OR has_role(auth.uid(), 'superadmin'::app_role))) WITH CHECK (((owner_id = auth.uid()) OR has_role(auth.uid(), 'superadmin'::app_role)));
CREATE POLICY "Public can read open stores" ON public.stores FOR SELECT TO anon,authenticated USING ((is_open = true));
CREATE POLICY "Superadmins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role));
CREATE POLICY "Superadmins can manage user_roles" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role));
CREATE POLICY "Superadmins can read all user_roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role));
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY "Store owners can view whatsapp events" ON public.whatsapp_events FOR SELECT TO authenticated USING (is_store_owner(auth.uid(), store_id));
`;
