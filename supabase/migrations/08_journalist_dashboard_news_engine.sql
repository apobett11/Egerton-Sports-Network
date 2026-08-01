-- Migration 08: Journalist Dashboard News Engine & Media Gallery
-- Temporary live news event classification, referee override support, and article gallery table

-- 1. Add is_temporary_news column to match_events if not present
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'match_events' AND column_name = 'is_temporary_news'
  ) THEN
    ALTER TABLE public.match_events ADD COLUMN is_temporary_news BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- 2. Create article_gallery table for journalist media uploads
CREATE TABLE IF NOT EXISTS public.article_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journalist_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_article_gallery_journalist ON public.article_gallery(journalist_id);

-- 3. RLS Security Policies for Article Gallery
ALTER TABLE public.article_gallery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public gallery images readable by everyone" ON public.article_gallery;
CREATE POLICY "Public gallery images readable by everyone"
  ON public.article_gallery FOR SELECT USING (true);

DROP POLICY IF EXISTS "Journalists manage own gallery images" ON public.article_gallery;
CREATE POLICY "Journalists manage own gallery images"
  ON public.article_gallery FOR ALL USING (
    journalist_id = auth.uid() OR public.get_auth_role() IN ('journalist', 'admin')
  );

-- 4. Enable Supabase Realtime Publication
ALTER TABLE public.article_gallery REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.article_gallery;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
