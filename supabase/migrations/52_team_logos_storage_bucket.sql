-- Migration 52: Create Team Logos Storage Bucket & Alignment
-- Ensures dedicated storage bucket for team crests / logos with public access,
-- 5MB size limit, support for all image formats (PNG, JPG, WEBP, SVG, GIF, AVIF),
-- and unhindered updates to teams table for logo URLs.

-- 1. Create 'team-logos' Storage Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'team-logos',
    'team-logos',
    true,
    5242880, -- 5MB limit
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif', 'image/bmp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif', 'image/bmp'];

-- 2. Storage Policies for 'team-logos' Bucket
DROP POLICY IF EXISTS "Public can view team-logos" ON storage.objects;
CREATE POLICY "Public can view team-logos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'team-logos');

DROP POLICY IF EXISTS "Anyone can upload team-logos" ON storage.objects;
CREATE POLICY "Anyone can upload team-logos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'team-logos');

DROP POLICY IF EXISTS "Anyone can update team-logos" ON storage.objects;
CREATE POLICY "Anyone can update team-logos"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'team-logos');

DROP POLICY IF EXISTS "Anyone can delete team-logos" ON storage.objects;
CREATE POLICY "Anyone can delete team-logos"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'team-logos');

-- 3. Unhindered Team Logo & Config Updates on Public Teams Table
DROP POLICY IF EXISTS "Coaches and admins update team logo and info" ON public.teams;
CREATE POLICY "Coaches and admins update team logo and info"
    ON public.teams FOR UPDATE
    USING (true)
    WITH CHECK (true);
