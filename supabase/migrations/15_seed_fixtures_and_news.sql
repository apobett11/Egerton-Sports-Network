-- Migration 15: Seed Fixtures and Categorized News Articles
-- Ensures sample fixtures for both Egerton Premier League and Egerton Championships across different dates
-- and seeds published news articles with diverse categories (match_report, transfer, injury, general)

-- 1. Ensure Competitions Exist
INSERT INTO public.competitions (id, name, slug, country, season, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Egerton Premier League', 'egerton-premier-league', 'Kenya', '2025/2026', true),
  ('22222222-2222-2222-2222-222222222222', 'Egerton Championship', 'egerton-championship', 'Kenya', '2025/2026', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Ensure Sample Premier League Teams Exist
INSERT INTO public.teams (id, competition_id, name, short_name, logo_url, color_code, status)
VALUES 
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Sharklets FC', 'SHK', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80', '#D4AF37', 'approved'),
  ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Faculty of Arts', 'FOA', 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80', '#2563EB', 'approved'),
  ('a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Faculty of Science', 'FOS', 'https://images.unsplash.com/photo-1543351611-c823948c2a50?w=100&auto=format&fit=crop&q=80', '#10B981', 'approved'),
  ('a4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Njoro FC', 'NJR', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100&auto=format&fit=crop&q=80', '#EF4444', 'approved')
ON CONFLICT (id) DO NOTHING;

-- 3. Ensure Sample Championship Teams Exist
INSERT INTO public.teams (id, competition_id, name, short_name, logo_url, color_code, status)
VALUES 
  ('c1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Championship FC Alpha', 'CHP-A', 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=100&auto=format&fit=crop&q=80', '#10B981', 'approved'),
  ('c2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Championship FC Beta', 'CHP-B', 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=100&auto=format&fit=crop&q=80', '#6366F1', 'approved'),
  ('c3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Championship FC Gamma', 'CHP-C', 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=100&auto=format&fit=crop&q=80', '#F59E0B', 'approved'),
  ('c4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Championship FC Delta', 'CHP-D', 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=100&auto=format&fit=crop&q=80', '#EC4899', 'approved')
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Premier League Fixtures Across Different Dates
INSERT INTO public.fixtures (id, competition_id, home_team_id, away_team_id, scheduled_time, status, score_home, score_away, venue, matchday)
VALUES 
  ('f1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', NOW() + INTERVAL '2 hours', 'UPCOMING', 0, 0, 'Egerton Pavilion Stadium', 5),
  ('f2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', 'a4444444-4444-4444-4444-444444444444', NOW() - INTERVAL '1 day', 'FT', 2, 1, 'Main Campus Pitch A', 4),
  ('f3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'a4444444-4444-4444-4444-444444444444', NOW() + INTERVAL '1 day', 'UPCOMING', 0, 0, 'Egerton Pavilion Stadium', 6)
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Championship Fixtures Across Different Dates
INSERT INTO public.fixtures (id, competition_id, home_team_id, away_team_id, scheduled_time, status, score_home, score_away, venue, matchday)
VALUES 
  ('f4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', NOW() + INTERVAL '4 hours', 'UPCOMING', 0, 0, 'Sports Complex Arena 2', 4),
  ('f5555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'c3333333-3333-3333-3333-333333333333', 'c4444444-4444-4444-4444-444444444444', NOW() - INTERVAL '1 day', 'FT', 3, 0, 'Njoro Ground 1', 3),
  ('f6666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'c3333333-3333-3333-3333-333333333333', NOW() + INTERVAL '2 days', 'UPCOMING', 0, 0, 'Sports Complex Arena 2', 5)
ON CONFLICT (id) DO NOTHING;

-- 6. Seed Categorized News Articles for Filtering & Sorting
INSERT INTO public.news_articles (id, title, slug, excerpt, content, image_url, category, status, published_at)
VALUES 
  (
    'b1111111-1111-1111-1111-111111111111',
    'Sharklets Maintain Premier League Lead After Stoppage-Time Thriller',
    'sharklets-maintain-lead-stoppage-time-thriller',
    'Egerton Sharklets FC secured a dramatic 2-1 victory over Faculty of Science under floodlights at Egerton Pavilion Stadium.',
    'In a dramatic night fixture at the Egerton Pavilion Stadium, Sharklets FC maintained their top spot in the Egerton Premier League table following an 88th-minute winning header. Both managers praised the intense tactical battle and pitch conditions.',
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
    'match_report',
    'published',
    NOW() - INTERVAL '2 hours'
  ),
  (
    'b2222222-2222-2222-2222-222222222222',
    'Championship Transfer Wire: Beta FC Signs Star Midfielder Omondi',
    'championship-transfer-wire-beta-fc-signs-omondi',
    'Championship FC Beta has finalized the mid-season transfer of playmaker Brian Omondi on a two-year campus scholarship deal.',
    'Official announcement: Championship FC Beta has completed the signing of creative midfielder Brian Omondi. The transfer fee was undisclosed, but club officials confirmed the player will wear jersey number 10 for the remainder of the season.',
    'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=800&auto=format&fit=crop&q=80',
    'transfer',
    'published',
    NOW() - INTERVAL '5 hours'
  ),
  (
    'b3333333-3333-3333-3333-333333333333',
    'Injury Update: Faculty of Arts Captain Cleared for Weekend Derby',
    'injury-update-foa-captain-cleared-weekend-derby',
    'Following successful rehabilitation with Varsity Health Desk, FOA captain returns to full team training ahead of kickoff.',
    'Medical clearance: The Varsity Health Desk medical team has passed FOA captain fit to start in this weekend derby against Sharklets FC following a minor hamstring strain suffered during Matchday 4.',
    'https://images.unsplash.com/photo-1543351611-c823948c2a50?w=800&auto=format&fit=crop&q=80',
    'injury',
    'published',
    NOW() - INTERVAL '1 day'
  ),
  (
    'b4444444-4444-4444-4444-444444444444',
    'Egerton Athletics Commission New Stadium Floodlights and VAR Monitor',
    'egerton-athletics-commission-new-stadium-floodlights',
    'Official statement from Egerton Sports Council confirming upgraded stadium lighting for evening championship fixtures.',
    'The Egerton Sports Council has officially commissioned high-grade LED floodlights and official VAR monitor technology at Pavilion Stadium, enabling night matches across all division tiers.',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
    'general',
    'published',
    NOW() - INTERVAL '2 days'
  )
ON CONFLICT (id) DO NOTHING;
