
-- Create a secure public view for stores that excludes sensitive fields
CREATE OR REPLACE VIEW public.stores_public AS
SELECT
  id,
  name,
  slug,
  address,
  whatsapp,
  logo_url,
  banner_url,
  theme_color,
  is_open,
  delivery_enabled,
  pickup_enabled,
  min_order,
  estimated_time,
  promo_banner,
  operating_hours,
  plan_type,
  created_at
FROM public.stores;

-- Grant select on the view to anon and authenticated roles
GRANT SELECT ON public.stores_public TO anon;
GRANT SELECT ON public.stores_public TO authenticated;
