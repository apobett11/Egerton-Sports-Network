-- Migration 03: Database Functions, Triggers & Search RPCs

-- Trigger function: Automatically create user profile upon signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role user_role;
  v_first TEXT;
  v_last TEXT;
BEGIN
  v_role := COALESCE((new.raw_user_meta_data->>'role')::user_role, 'player'::user_role);
  v_first := COALESCE(new.raw_user_meta_data->>'first_name', 'User');
  v_last := COALESCE(new.raw_user_meta_data->>'last_name', new.id::text);

  INSERT INTO public.profiles (id, email, role, first_name, last_name)
  VALUES (new.id, new.email, v_role, v_first, v_last)
  ON CONFLICT (id) DO NOTHING;

  IF v_role = 'player' THEN
    INSERT INTO public.players (profile_id)
    VALUES (new.id)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Audit Logging RPC
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
  v_role user_role;
BEGIN
  v_role := public.get_auth_role();
  INSERT INTO public.audit_logs (user_id, user_role, action, resource_type, resource_id, details)
  VALUES (auth.uid(), v_role::text, p_action, p_resource_type, p_resource_id, p_details)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Global Search RPC
CREATE OR REPLACE FUNCTION public.global_search(query_text TEXT)
RETURNS TABLE (
  entity_type TEXT,
  id UUID,
  title TEXT,
  subtitle TEXT,
  link_path TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Players
  SELECT 
    'player'::TEXT AS entity_type,
    p.id,
    (prof.first_name || ' ' || prof.last_name)::TEXT AS title,
    COALESCE(t.name, 'Free Agent')::TEXT AS subtitle,
    ('/players/' || p.id)::TEXT AS link_path
  FROM public.players p
  JOIN public.profiles prof ON p.profile_id = prof.id
  LEFT JOIN public.teams t ON p.team_id = t.id
  WHERE prof.first_name ILIKE '%' || query_text || '%'
     OR prof.last_name ILIKE '%' || query_text || '%'

  UNION ALL

  -- Teams
  SELECT 
    'team'::TEXT AS entity_type,
    t.id,
    t.name::TEXT AS title,
    t.short_name::TEXT AS subtitle,
    ('/teams/' || t.id)::TEXT AS link_path
  FROM public.teams t
  WHERE t.name ILIKE '%' || query_text || '%'
     OR t.short_name ILIKE '%' || query_text || '%'

  UNION ALL

  -- News Articles
  SELECT 
    'news'::TEXT AS entity_type,
    n.id,
    n.title::TEXT AS title,
    n.category::TEXT AS subtitle,
    ('/news/' || n.slug)::TEXT AS link_path
  FROM public.news_articles n
  WHERE n.status = 'published'
    AND (n.title ILIKE '%' || query_text || '%' OR n.excerpt ILIKE '%' || query_text || '%')

  UNION ALL

  -- Competitions
  SELECT 
    'competition'::TEXT AS entity_type,
    c.id,
    c.name::TEXT AS title,
    c.season::TEXT AS subtitle,
    '/league'::TEXT AS link_path
  FROM public.competitions c
  WHERE c.name ILIKE '%' || query_text || '%';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
