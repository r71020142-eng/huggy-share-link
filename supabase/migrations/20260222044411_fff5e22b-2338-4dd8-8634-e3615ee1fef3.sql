
-- App role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'superadmin');

-- Plan type enum
CREATE TYPE public.plan_type AS ENUM ('basic', 'pro');

-- Order status enum
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled');

-- Stores table (multi-tenant root)
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  whatsapp TEXT,
  address TEXT,
  operating_hours TEXT,
  promo_banner TEXT,
  estimated_time TEXT DEFAULT '30-45 min',
  min_order NUMERIC(10,2) DEFAULT 0,
  is_open BOOLEAN DEFAULT true,
  delivery_enabled BOOLEAN DEFAULT true,
  pickup_enabled BOOLEAN DEFAULT true,
  plan_type public.plan_type DEFAULT 'basic' NOT NULL,
  logo_url TEXT,
  banner_url TEXT,
  theme_color TEXT DEFAULT '#7c3aed',
  monthly_goal NUMERIC(10,2) DEFAULT 5000,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- User roles table (separate from profiles!)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  badge TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Product additionals/extras
CREATE TABLE public.product_additionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC(10,2) DEFAULT 0,
  min_qty INTEGER DEFAULT 0,
  max_qty INTEGER DEFAULT 1,
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Neighborhoods for delivery fees
CREATE TABLE public.neighborhoods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  neighborhood_id UUID REFERENCES public.neighborhoods(id),
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status public.order_status DEFAULT 'pending' NOT NULL,
  order_type TEXT DEFAULT 'delivery',
  payment_method TEXT DEFAULT 'cash',
  notes TEXT,
  tracking_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Order items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  additionals JSONB DEFAULT '[]',
  subtotal NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Activation keys
CREATE TABLE public.activation_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  plan_type public.plan_type NOT NULL DEFAULT 'pro',
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  used_by_store_id UUID REFERENCES public.stores(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Menus/Cardápios
CREATE TABLE public.menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  is_published BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false,
  logo_url TEXT,
  banner_url TEXT,
  theme_color TEXT DEFAULT '#7c3aed',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(store_id, slug)
);

-- Enable RLS on all tables
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_additionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Security definer to check store ownership
CREATE OR REPLACE FUNCTION public.is_store_owner(_user_id UUID, _store_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.stores
    WHERE id = _store_id AND owner_id = _user_id
  )
$$;

-- RLS Policies for stores
CREATE POLICY "Owners can manage their stores" ON public.stores
  FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Public can read stores" ON public.stores
  FOR SELECT TO anon
  USING (true);

-- RLS Policies for profiles
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Superadmins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- RLS Policies for categories (store-scoped)
CREATE POLICY "Store owners can manage categories" ON public.categories
  FOR ALL TO authenticated
  USING (public.is_store_owner(auth.uid(), store_id));
CREATE POLICY "Public can read active categories" ON public.categories
  FOR SELECT TO anon USING (is_active = true);

-- RLS Policies for products (store-scoped)
CREATE POLICY "Store owners can manage products" ON public.products
  FOR ALL TO authenticated
  USING (public.is_store_owner(auth.uid(), store_id));
CREATE POLICY "Public can read active products" ON public.products
  FOR SELECT TO anon USING (is_active = true);

-- RLS Policies for product_additionals
CREATE POLICY "Store owners can manage additionals" ON public.product_additionals
  FOR ALL TO authenticated
  USING (public.is_store_owner(auth.uid(), store_id));
CREATE POLICY "Public can read active additionals" ON public.product_additionals
  FOR SELECT TO anon USING (is_active = true);

-- RLS Policies for neighborhoods
CREATE POLICY "Store owners can manage neighborhoods" ON public.neighborhoods
  FOR ALL TO authenticated
  USING (public.is_store_owner(auth.uid(), store_id));
CREATE POLICY "Public can read active neighborhoods" ON public.neighborhoods
  FOR SELECT TO anon USING (is_active = true);

-- RLS Policies for orders
CREATE POLICY "Store owners can manage orders" ON public.orders
  FOR ALL TO authenticated
  USING (public.is_store_owner(auth.uid(), store_id));
CREATE POLICY "Anyone can create orders" ON public.orders
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public can read own orders by tracking" ON public.orders
  FOR SELECT TO anon USING (true);

-- RLS Policies for order_items
CREATE POLICY "Store owners can manage order items" ON public.order_items
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.is_store_owner(auth.uid(), o.store_id)
  ));
CREATE POLICY "Anyone can create order items" ON public.order_items
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public can read order items" ON public.order_items
  FOR SELECT TO anon USING (true);

-- RLS Policies for activation_keys
CREATE POLICY "Superadmins can manage keys" ON public.activation_keys
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Authenticated can read keys for validation" ON public.activation_keys
  FOR SELECT TO authenticated USING (true);

-- RLS Policies for menus
CREATE POLICY "Store owners can manage menus" ON public.menus
  FOR ALL TO authenticated
  USING (public.is_store_owner(auth.uid(), store_id));
CREATE POLICY "Public can read published menus" ON public.menus
  FOR SELECT TO anon USING (is_published = true);

-- Trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_menus_updated_at BEFORE UPDATE ON public.menus FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for orders (for live tracking)
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
