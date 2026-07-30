-- Migration 04: Seed Data for LiveScore Platform

-- Insert Default Competitions
INSERT INTO public.competitions (id, name, slug, country, season, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Egerton Premier League', 'egerton-premier-league', 'Kenya', '2025/2026', true),
  ('22222222-2222-2222-2222-222222222222', 'Egerton Championship', 'egerton-championship', 'Kenya', '2025/2026', true)
ON CONFLICT (id) DO NOTHING;

-- Insert Default Clubs
INSERT INTO public.clubs (id, name, short_name, stadium, founded)
VALUES 
  ('33333333-3333-3333-3333-333333333333', 'Egerton FC', 'EGE', 'Egerton Main Stadium', 1985),
  ('44444444-4444-4444-4444-444444444444', 'Njoro City FC', 'NJR', 'Njoro Arena', 1998),
  ('55555555-5555-5555-5555-555555555555', 'Tatton Rovers', 'TAT', 'Tatton Ground', 2005)
ON CONFLICT (id) DO NOTHING;

-- Insert Default Teams
INSERT INTO public.teams (id, club_id, competition_id, name, short_name, color_code)
VALUES 
  ('66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Egerton FC First Team', 'Egerton', '#D4AF37'),
  ('77777777-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Njoro City Senior', 'Njoro', '#2563EB'),
  ('88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Tatton Rovers Seniors', 'Tatton', '#DC2626')
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Fixtures
INSERT INTO public.fixtures (id, competition_id, home_team_id, away_team_id, scheduled_time, status, score_home, score_away, venue, matchday)
VALUES
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777777', NOW() - INTERVAL '2 hours', 'FT', 2, 1, 'Egerton Main Stadium', 12),
  ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', '66666666-6666-6666-6666-666666666666', NOW() + INTERVAL '1 day', 'UPCOMING', 0, 0, 'Tatton Ground', 13)
ON CONFLICT (id) DO NOTHING;

-- Insert Sample News
INSERT INTO public.news_articles (id, title, slug, excerpt, content, category, status, published_at)
VALUES
  ('b1111111-1111-1111-1111-111111111111', 'Egerton FC Secures Crucial 2-1 Victory Over Njoro City', 'egerton-fc-victory-njoro-city', 'A late winning goal sealed three points for Egerton FC in a thrilling campus derby.', 'Full match report describing tactical maneuvers and crucial saves in the 88th minute.', 'match_report', 'published', NOW() - INTERVAL '1 hour'),
  ('b2222222-2222-2222-2222-222222222222', 'New Tactical Lineup Engine Introduced for Coaches', 'tactical-lineup-engine-introduced', 'Coaches across the Egerton Premier League can now manage player positioning interactively.', 'Detailed overview of the interactive tactical feature now available on the coach dashboard.', 'announcement', 'published', NOW() - INTERVAL '5 hours')
ON CONFLICT (id) DO NOTHING;

-- Insert Sample System Settings
INSERT INTO public.system_settings (key, value)
VALUES 
  ('platform_info', '{"name": "LiveScore Football Ecosystem", "version": "1.0.0", "maintenance_mode": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;
