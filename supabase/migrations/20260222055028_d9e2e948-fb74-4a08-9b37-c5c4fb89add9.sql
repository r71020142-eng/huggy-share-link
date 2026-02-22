
-- Add design columns to menus table for fonts, layout, and colors
ALTER TABLE public.menus
  ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS bg_color text DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS text_color text DEFAULT '#1a1a1a',
  ADD COLUMN IF NOT EXISTS show_banner boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_categories boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_featured boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_search boolean DEFAULT true;
