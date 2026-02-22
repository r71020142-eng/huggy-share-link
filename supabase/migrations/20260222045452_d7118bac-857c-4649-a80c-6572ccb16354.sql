
-- Create storage bucket for store assets
INSERT INTO storage.buckets (id, name, public) VALUES ('store-assets', 'store-assets', true);

-- Allow anyone to view files
CREATE POLICY "Public can view store assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'store-assets');

-- Store owners can upload files to their store folder
CREATE POLICY "Store owners can upload assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'store-assets' 
  AND auth.uid() IS NOT NULL
);

-- Store owners can update their assets
CREATE POLICY "Store owners can update assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'store-assets' 
  AND auth.uid() IS NOT NULL
);

-- Store owners can delete their assets
CREATE POLICY "Store owners can delete assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'store-assets' 
  AND auth.uid() IS NOT NULL
);
