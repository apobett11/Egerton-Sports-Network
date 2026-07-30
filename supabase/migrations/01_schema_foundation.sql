-- Migration 01: Core Schema Foundation
-- Canonical roles and main application tables

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Canonical Roles Enum
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'guest',
    'player',
    'captain',
    'coach',
    'journalist',
    'referee',
    'linesman',
    'president',
    'admin'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- User Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'player',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  country TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Competitions
CREATE TABLE IF NOT EXISTS public.competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  country TEXT NOT NULL,
  season TEXT NOT NULL,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clubs
CREATE TABLE IF NOT EXISTS public.clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  logo_url TEXT,
  stadium TEXT,
  founded INT,
  president_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Teams
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  competition_id UUID REFERENCES public.competitions(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  logo_url TEXT,
  color_code TEXT DEFAULT '#D4AF37',
  coach_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  captain_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Players
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  jersey_number INT,
  position TEXT CHECK (position IN ('GK', 'DEF', 'MID', 'FWD')),
  height NUMERIC(5,2),
  weight NUMERIC(5,2),
  preferred_foot TEXT CHECK (preferred_foot IN ('left', 'right', 'both')),
  nationality TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fixtures
CREATE TABLE IF NOT EXISTS public.fixtures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE,
  home_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  away_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'LIVE', 'HT', 'FT', 'POSTPONED', 'CANCELLED')),
  score_home INT NOT NULL DEFAULT 0,
  score_away INT NOT NULL DEFAULT 0,
  venue TEXT,
  referee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  linesman_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  matchday INT DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Match Events
CREATE TABLE IF NOT EXISTS public.match_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fixture_id UUID REFERENCES public.fixtures(id) ON DELETE CASCADE,
  minute INT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('goal', 'yellow', 'red', 'sub_in', 'sub_out', 'penalty', 'own_goal')),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  assist_player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  detail_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Match Lineups
CREATE TABLE IF NOT EXISTS public.match_lineups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fixture_id UUID REFERENCES public.fixtures(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  formation TEXT NOT NULL DEFAULT '4-3-3',
  starting_xi JSONB NOT NULL DEFAULT '[]'::jsonb,
  substitutes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(fixture_id, team_id)
);

-- Official Match Reports
CREATE TABLE IF NOT EXISTS public.match_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fixture_id UUID REFERENCES public.fixtures(id) ON DELETE CASCADE,
  official_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  official_role TEXT NOT NULL CHECK (official_role IN ('referee', 'linesman')),
  report_text TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- News Articles
CREATE TABLE IF NOT EXISTS public.news_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL CHECK (category IN ('transfer', 'match_report', 'injury', 'general', 'announcement')),
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Platform & Team Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_role TEXT NOT NULL DEFAULT 'all',
  target_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Squad Requests (Captain / Coach workflows)
CREATE TABLE IF NOT EXISTS public.squad_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tactical Squad Configurations
CREATE TABLE IF NOT EXISTS public.squad_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID UNIQUE REFERENCES public.teams(id) ON DELETE CASCADE,
  formation TEXT NOT NULL DEFAULT '4-3-3',
  coordinates JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_role TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System Settings
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_fixtures_competition ON public.fixtures(competition_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_teams ON public.fixtures(home_team_id, away_team_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_time ON public.fixtures(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_match_events_fixture ON public.match_events(fixture_id);
CREATE INDEX IF NOT EXISTS idx_news_status ON public.news_articles(status, published_at);
CREATE INDEX IF NOT EXISTS idx_players_team ON public.players(team_id);
