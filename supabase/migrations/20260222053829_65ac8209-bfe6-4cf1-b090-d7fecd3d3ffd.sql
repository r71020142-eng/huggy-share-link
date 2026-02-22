
-- Junction table linking menus to products
CREATE TABLE public.menu_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(menu_id, product_id)
);

-- Enable RLS
ALTER TABLE public.menu_products ENABLE ROW LEVEL SECURITY;

-- Public can read menu products for published menus
CREATE POLICY "Public can read menu products"
ON public.menu_products
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.menus
    WHERE menus.id = menu_products.menu_id AND menus.is_published = true
  )
);

-- Store owners can manage menu products
CREATE POLICY "Store owners can manage menu products"
ON public.menu_products
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.menus
    WHERE menus.id = menu_products.menu_id
    AND is_store_owner(auth.uid(), menus.store_id)
  )
);

-- Index for performance
CREATE INDEX idx_menu_products_menu_id ON public.menu_products(menu_id);
CREATE INDEX idx_menu_products_product_id ON public.menu_products(product_id);
