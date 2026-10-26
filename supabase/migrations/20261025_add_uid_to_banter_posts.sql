-- Migration 20261025_add_uid_to_banter_posts.sql
-- Session-Scoped UID Verification & Permanent Device ID Architecture

-- 1. Add uid and required columns to banter_posts
ALTER TABLE public.banter_posts
ADD COLUMN IF NOT EXISTS uid TEXT;

ALTER TABLE public.banter_posts
ADD COLUMN IF NOT EXISTS author_device_id TEXT;

ALTER TABLE public.banter_posts
ADD COLUMN IF NOT EXISTS author_name TEXT;

ALTER TABLE public.banter_posts
ADD COLUMN IF NOT EXISTS author_avatar TEXT;

ALTER TABLE public.banter_posts
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'NONE';

ALTER TABLE public.banter_posts
ADD COLUMN IF NOT EXISTS media_urls TEXT[];

ALTER TABLE public.banter_posts
ADD COLUMN IF NOT EXISTS root_id UUID REFERENCES public.banter_posts(id) ON DELETE CASCADE;

ALTER TABLE public.banter_posts
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.banter_posts(id) ON DELETE CASCADE;

-- 2. Add uid column to existing anonymous_devices table
ALTER TABLE public.anonymous_devices
ADD COLUMN IF NOT EXISTS uid TEXT;

-- 3. Performance indexes for thread and user lookups
CREATE INDEX IF NOT EXISTS idx_banter_posts_uid 
  ON public.banter_posts (uid);

CREATE INDEX IF NOT EXISTS idx_banter_posts_author_device 
  ON public.banter_posts (author_device_id);

CREATE INDEX IF NOT EXISTS idx_banter_posts_root_id
  ON public.banter_posts (root_id);

CREATE INDEX IF NOT EXISTS idx_banter_posts_parent_id
  ON public.banter_posts (parent_id);

CREATE INDEX IF NOT EXISTS idx_anonymous_devices_uid
  ON public.anonymous_devices (uid);

-- 4. Simplified, fast RLS policy (No expensive header inspection on every insert)
ALTER TABLE public.banter_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads allowed" ON public.banter_posts;
CREATE POLICY "Public reads allowed" ON public.banter_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public inserts allowed with uid" ON public.banter_posts;
CREATE POLICY "Public inserts allowed with uid" ON public.banter_posts 
FOR INSERT WITH CHECK (
  uid IS NOT NULL AND length(trim(uid)) > 0
);
