-- Migration 17: Journalist Schema, RLS Security & Matchday/Monthly Indexing
-- Ensures database columns, RLS isolation for journalists, and performance indices for news articles

-- 1. Ensure required columns on news_articles
DO $$ BEGIN
  -- fixture_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_articles' AND column_name = 'fixture_id') THEN
    ALTER TABLE public.news_articles ADD COLUMN fixture_id UUID REFERENCES public.fixtures(id) ON DELETE SET NULL;
  END IF;

  -- team_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_articles' AND column_name = 'team_id') THEN
    ALTER TABLE public.news_articles ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
  END IF;

  -- competition_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_articles' AND column_name = 'competition_id') THEN
    ALTER TABLE public.news_articles ADD COLUMN competition_id UUID REFERENCES public.competitions(id) ON DELETE SET NULL;
  END IF;

  -- views_count
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_articles' AND column_name = 'views_count') THEN
    ALTER TABLE public.news_articles ADD COLUMN views_count INT NOT NULL DEFAULT 0;
  END IF;

  -- is_breaking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_articles' AND column_name = 'is_breaking') THEN
    ALTER TABLE public.news_articles ADD COLUMN is_breaking BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;

  -- tags
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_articles' AND column_name = 'tags') THEN
    ALTER TABLE public.news_articles ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- 2. Enhanced Indices for Monthly & Matchday Sorting
CREATE INDEX IF NOT EXISTS idx_news_articles_author ON public.news_articles(author_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_created_month ON public.news_articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_published_month ON public.news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_fixture ON public.news_articles(fixture_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_team ON public.news_articles(team_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_competition ON public.news_articles(competition_id);

-- 3. Row Level Security Policies for news_articles
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

-- Clean up any conflicting old policies
DROP POLICY IF EXISTS "Published news readable by everyone" ON public.news_articles;
DROP POLICY IF EXISTS "Journalists insert/update own articles" ON public.news_articles;
DROP POLICY IF EXISTS "Journalists update own articles" ON public.news_articles;
DROP POLICY IF EXISTS "Admins manage news articles" ON public.news_articles;
DROP POLICY IF EXISTS "Journalists view own or published articles" ON public.news_articles;
DROP POLICY IF EXISTS "Journalists insert own articles" ON public.news_articles;
DROP POLICY IF EXISTS "Journalists delete own articles" ON public.news_articles;

-- SELECT: Public can see published news; Journalists see all their own articles + published ones; Admin sees all
CREATE POLICY "Journalists view own or published articles"
  ON public.news_articles FOR SELECT
  USING (
    status = 'published'
    OR (auth.uid() IS NOT NULL AND author_id = auth.uid())
    OR public.get_auth_role() = 'admin'
  );

-- INSERT: Authenticated users with journalist / coach / captain / admin role can create articles with their own author_id
CREATE POLICY "Journalists insert own articles"
  ON public.news_articles FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (author_id = auth.uid() OR author_id IS NULL)
    AND public.get_auth_role() IN ('journalist', 'coach', 'captain', 'admin', 'president')
  );

-- UPDATE: Journalists can update their own articles; Admins can update any
CREATE POLICY "Journalists update own articles"
  ON public.news_articles FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND author_id = auth.uid())
    OR public.get_auth_role() = 'admin'
  );

-- DELETE: Journalists can delete their own articles; Admins can delete any
CREATE POLICY "Journalists delete own articles"
  ON public.news_articles FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND author_id = auth.uid())
    OR public.get_auth_role() = 'admin'
  );
