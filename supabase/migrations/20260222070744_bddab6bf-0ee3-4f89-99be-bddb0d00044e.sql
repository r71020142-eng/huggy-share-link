
-- Drop restrictive SELECT policies and recreate as permissive

-- menus
DROP POLICY IF EXISTS "Public can read published menus" ON public.menus;
CREATE POLICY "Public can read published menus"
  ON public.menus FOR SELECT
  USING (is_published = true);

-- categories
DROP POLICY IF EXISTS "Public can read active categories" ON public.categories;
CREATE POLICY "Public can read active categories"
  ON public.categories FOR SELECT
  USING (is_active = true);

-- products
DROP POLICY IF EXISTS "Public can read active products" ON public.products;
CREATE POLICY "Public can read active products"
  ON public.products FOR SELECT
  USING (is_active = true);

-- neighborhoods
DROP POLICY IF EXISTS "Public can read active neighborhoods" ON public.neighborhoods;
CREATE POLICY "Public can read active neighborhoods"
  ON public.neighborhoods FOR SELECT
  USING (is_active = true);

-- product_additionals (also needed for public menu)
DROP POLICY IF EXISTS "Public can read active additionals" ON public.product_additionals;
CREATE POLICY "Public can read active additionals"
  ON public.product_additionals FOR SELECT
  USING (is_active = true);

-- menu_products
DROP POLICY IF EXISTS "Public can read menu products" ON public.menu_products;
CREATE POLICY "Public can read menu products"
  ON public.menu_products FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM menus
    WHERE menus.id = menu_products.menu_id AND menus.is_published = true
  ));
