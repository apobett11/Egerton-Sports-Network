const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

const sql = `
CREATE TABLE IF NOT EXISTS public.banter_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    root_id UUID REFERENCES public.banter_posts(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.banter_posts(id) ON DELETE CASCADE,
    uid TEXT,
    author_device_id TEXT,
    author_name TEXT,
    author_handle TEXT NOT NULL,
    author_avatar TEXT,
    author_type TEXT NOT NULL DEFAULT 'user',
    author_badge TEXT,
    content TEXT NOT NULL,
    media_type TEXT DEFAULT 'NONE',
    media_urls TEXT[],
    match_id UUID,
    league_id UUID,
    tagged_team_id TEXT,
    tagged_team_name TEXT,
    poll_id TEXT,
    reaction_fire_count INT NOT NULL DEFAULT 0,
    reaction_clown_count INT NOT NULL DEFAULT 0,
    reaction_skull_count INT NOT NULL DEFAULT 0,
    comment_count INT NOT NULL DEFAULT 0,
    replies_count INT NOT NULL DEFAULT 0,
    impressions_count INT NOT NULL DEFAULT 0,
    views_count INT NOT NULL DEFAULT 0,
    repost_count INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.banter_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public reads allowed" ON public.banter_posts;
CREATE POLICY "Public reads allowed" ON public.banter_posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public inserts allowed" ON public.banter_posts;
CREATE POLICY "Public inserts allowed" ON public.banter_posts FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public updates allowed" ON public.banter_posts;
CREATE POLICY "Public updates allowed" ON public.banter_posts FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public deletes allowed" ON public.banter_posts;
CREATE POLICY "Public deletes allowed" ON public.banter_posts FOR DELETE USING (true);

CREATE TABLE IF NOT EXISTS public.banter_polls (
    id TEXT PRIMARY KEY,
    post_id UUID REFERENCES public.banter_posts(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_votes INT NOT NULL DEFAULT 0,
    voters JSONB NOT NULL DEFAULT '{}'::jsonb,
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.banter_polls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public reads allowed on banter_polls" ON public.banter_polls;
CREATE POLICY "Public reads allowed on banter_polls" ON public.banter_polls FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public inserts allowed on banter_polls" ON public.banter_polls;
CREATE POLICY "Public inserts allowed on banter_polls" ON public.banter_polls FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public updates allowed on banter_polls" ON public.banter_polls;
CREATE POLICY "Public updates allowed on banter_polls" ON public.banter_polls FOR UPDATE USING (true);

CREATE OR REPLACE FUNCTION public.vote_banter_poll(
    p_poll_id TEXT,
    p_option_id INT,
    p_device_id TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_poll RECORD;
    v_voters JSONB;
    v_options JSONB;
    v_new_options JSONB;
    v_total_votes INT;
    v_elem JSONB;
    v_idx INT;
    v_opt_id INT;
    v_opt_votes INT;
    v_result JSONB;
BEGIN
    SELECT * INTO v_poll FROM public.banter_polls WHERE id = p_poll_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Poll not found';
    END IF;

    v_voters := COALESCE(v_poll.voters, '{}'::jsonb);
    IF v_voters ? p_device_id THEN
        RAISE EXCEPTION 'Device has already voted on this poll.';
    END IF;

    v_options := v_poll.options;
    v_new_options := '[]'::jsonb;
    FOR v_idx IN 0 .. jsonb_array_length(v_options) - 1 LOOP
        v_elem := v_options->v_idx;
        v_opt_id := (v_elem->>'id')::int;
        v_opt_votes := COALESCE((v_elem->>'votes')::int, 0);
        IF v_opt_id = p_option_id THEN
            v_elem := jsonb_set(v_elem, '{votes}', to_jsonb(v_opt_votes + 1));
        END IF;
        v_new_options := v_new_options || jsonb_build_array(v_elem);
    END LOOP;

    v_voters := jsonb_set(v_voters, ARRAY[p_device_id], to_jsonb(p_option_id));
    v_total_votes := COALESCE(v_poll.total_votes, 0) + 1;

    UPDATE public.banter_polls
    SET options = v_new_options,
        voters = v_voters,
        total_votes = v_total_votes
    WHERE id = p_poll_id;

    SELECT to_jsonb(p) INTO v_result FROM (
        SELECT id, post_id, question, v_new_options as options, v_total_votes as total_votes, v_voters as voters, expires_at
        FROM public.banter_polls WHERE id = p_poll_id
    ) p;

    RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_banter_post_reply_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id IS NOT NULL THEN
        UPDATE public.banter_posts
        SET comment_count = COALESCE(comment_count, 0) + 1,
            replies_count = COALESCE(replies_count, 0) + 1
        WHERE id = NEW.parent_id;
    END IF;

    IF NEW.root_id IS NOT NULL AND NEW.root_id <> NEW.parent_id THEN
        UPDATE public.banter_posts
        SET comment_count = COALESCE(comment_count, 0) + 1,
            replies_count = COALESCE(replies_count, 0) + 1
        WHERE id = NEW.root_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_banter_post_reply_counts ON public.banter_posts;
CREATE TRIGGER trigger_update_banter_post_reply_counts
AFTER INSERT ON public.banter_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_banter_post_reply_counts();

-- Clear old test runs
DELETE FROM public.banter_posts WHERE content LIKE '%Root Derby Match Take%';
DELETE FROM public.banter_posts WHERE content LIKE '%Thread Alpha Discussion%';
DELETE FROM public.banter_posts WHERE content LIKE '%Thread Beta Discussion%';

`;

client.connect()
  .then(() => client.query(sql))
  .then(() => {
    console.log('SUCCESS: banter_posts, banter_polls, and vote_banter_poll ready in Postgres!');
    return client.end();
  })
  .catch((err) => {
    console.error('ERROR applying banter schema:', err);
    client.end();
    process.exit(1);
  });
