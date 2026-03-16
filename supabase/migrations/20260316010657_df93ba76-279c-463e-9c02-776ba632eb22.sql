
CREATE TABLE public.menu_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  link_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_banners ENABLE ROW LEVEL SECURITY;

-- Public can read active banners for published menus
CREATE POLICY "Public can read active banners"
  ON public.menu_banners FOR SELECT
  TO public
  USING (
    is_active = true AND EXISTS (
      SELECT 1 FROM public.menus WHERE menus.id = menu_banners.menu_id AND menus.is_published = true
    )
  );

-- Store owners can manage their banners
CREATE POLICY "Store owners can manage banners"
  ON public.menu_banners FOR ALL
  TO authenticated
  USING (is_store_owner(auth.uid(), store_id))
  WITH CHECK (is_store_owner(auth.uid(), store_id));

-- Add carousel mode to menus
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS banner_mode TEXT DEFAULT 'single';
