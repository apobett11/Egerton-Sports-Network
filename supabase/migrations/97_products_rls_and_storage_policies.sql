-- ==============================================================================
-- Migration 97: Store Products, Product Images & Storage Bucket RLS Policies
-- Grants full admin and storefront permissions to add and manage products.
-- Ensures zero RLS violations for products, product_images, and product-images bucket.
-- ==============================================================================

-- 1. Ensure products table has RLS and permissive policies for Store Admin & Public
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to products" ON public.products;
CREATE POLICY "Allow public read access to products"
  ON public.products FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow admin insert to products" ON public.products;
CREATE POLICY "Allow admin insert to products"
  ON public.products FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin update to products" ON public.products;
CREATE POLICY "Allow admin update to products"
  ON public.products FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow admin delete to products" ON public.products;
CREATE POLICY "Allow admin delete to products"
  ON public.products FOR DELETE
  USING (true);

-- 2. Ensure product_images table has RLS and permissive policies
ALTER TABLE IF EXISTS public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to product_images" ON public.product_images;
CREATE POLICY "Allow public read access to product_images"
  ON public.product_images FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow admin insert to product_images" ON public.product_images;
CREATE POLICY "Allow admin insert to product_images"
  ON public.product_images FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin update to product_images" ON public.product_images;
CREATE POLICY "Allow admin update to product_images"
  ON public.product_images FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow admin delete to product_images" ON public.product_images;
CREATE POLICY "Allow admin delete to product_images"
  ON public.product_images FOR DELETE
  USING (true);

-- 3. Ensure 'product-images' storage bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760, -- 10MB limit per image
  ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];

-- 4. Storage Objects RLS Policies for 'product-images' bucket
DROP POLICY IF EXISTS "Allow public read access to product-images" ON storage.objects;
CREATE POLICY "Allow public read access to product-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Allow store upload to product-images" ON storage.objects;
CREATE POLICY "Allow store upload to product-images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Allow store update to product-images" ON storage.objects;
CREATE POLICY "Allow store update to product-images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Allow store delete to product-images" ON storage.objects;
CREATE POLICY "Allow store delete to product-images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images');
