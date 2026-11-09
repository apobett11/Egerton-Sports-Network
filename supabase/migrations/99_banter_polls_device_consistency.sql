-- Migration 99: Banter Community Polls & Device-Level Anti-Double-Vote Assurance Engine
-- Egerton Sports Network (ESN)
-- Guarantees that one device will NEVER poll twice across sessions or reloads.
-- Fast single-query indexed batch lookups to avoid N+1 queries.

-- 1. Create banter_polls table if not exists
CREATE TABLE IF NOT EXISTS public.banter_polls (
    id TEXT PRIMARY KEY,
    post_id UUID REFERENCES public.banter_posts(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_votes INT NOT NULL DEFAULT 0,
    voters JSONB NOT NULL DEFAULT '{}'::jsonb,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure post_id allows NULL for standalone or seeded polls
ALTER TABLE public.banter_polls ALTER COLUMN post_id DROP NOT NULL;

-- 2. Create banter_poll_votes table for authoritative 1-device-1-vote tracking
CREATE TABLE IF NOT EXISTS public.banter_poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id TEXT NOT NULL REFERENCES public.banter_polls(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    option_id INT NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_banter_poll_device UNIQUE (poll_id, device_id)
);

-- 3. Performance Indexes: Direct device ID and poll lookups (Avoids N+1, supports direct row fetch)
CREATE INDEX IF NOT EXISTS idx_banter_polls_post_id
    ON public.banter_polls (post_id);

CREATE INDEX IF NOT EXISTS idx_banter_polls_created
    ON public.banter_polls (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_banter_poll_votes_device
    ON public.banter_poll_votes (device_id);

CREATE INDEX IF NOT EXISTS idx_banter_poll_votes_poll_device
    ON public.banter_poll_votes (poll_id, device_id);

CREATE INDEX IF NOT EXISTS idx_banter_posts_poll_id
    ON public.banter_posts (poll_id)
    WHERE poll_id IS NOT NULL;

-- Ensure anonymous_devices table has index on device_id
CREATE INDEX IF NOT EXISTS idx_anonymous_devices_device_id_text
    ON public.anonymous_devices (device_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.banter_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banter_poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for banter_polls
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'banter_polls' AND policyname = 'Public reads allowed on banter_polls'
    ) THEN
        CREATE POLICY "Public reads allowed on banter_polls"
        ON public.banter_polls FOR SELECT
        TO anon, authenticated
        USING (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'banter_polls' AND policyname = 'Public inserts and updates on banter_polls'
    ) THEN
        CREATE POLICY "Public inserts and updates on banter_polls"
        ON public.banter_polls FOR ALL
        TO anon, authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- RLS Policies for banter_poll_votes
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'banter_poll_votes' AND policyname = 'Public reads allowed on banter_poll_votes'
    ) THEN
        CREATE POLICY "Public reads allowed on banter_poll_votes"
        ON public.banter_poll_votes FOR SELECT
        TO anon, authenticated
        USING (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'banter_poll_votes' AND policyname = 'Public inserts allowed on banter_poll_votes'
    ) THEN
        CREATE POLICY "Public inserts allowed on banter_poll_votes"
        ON public.banter_poll_votes FOR INSERT
        TO anon, authenticated
        WITH CHECK (device_id IS NOT NULL AND length(trim(device_id)) > 0);
    END IF;
END $$;

-- 5. Seed Predefined Community Polls
INSERT INTO public.banter_polls (id, post_id, question, options, total_votes, voters)
VALUES
(
    'poll-pause-01',
    'b1000000-0000-4000-8000-000000000002',
    'Will the mid-season pause disrupt Super Eagles title momentum?',
    '[{"id": 1, "text": "No, they will run away with title", "votes": 78}, {"id": 2, "text": "Legends or Wazito will close gap", "votes": 34}, {"id": 3, "text": "Teams will take 2 weeks to regain rhythm", "votes": 21}]'::jsonb,
    133,
    '{}'::jsonb
),
(
    'poll-ref-02',
    'b1000000-0000-4000-8000-000000000003',
    'Which referee has shown highest fairness across Matchdays 1-6?',
    '[{"id": 1, "text": "Referee Lamoh (Firm control & fair cards)", "votes": 56}, {"id": 2, "text": "Referee Ericko (Allows match to flow)", "votes": 39}, {"id": 3, "text": "Referee Jark (Strict on penalties)", "votes": 28}, {"id": 4, "text": "Referee Chalo (Strict on offsides)", "votes": 14}]'::jsonb,
    137,
    '{}'::jsonb
),
(
    'poll-champ-03',
    'b1000000-0000-4000-8000-000000000007',
    'Who gets promoted from Championship division to Premier League?',
    '[{"id": 1, "text": "Talanta fc (League leaders)", "votes": 52}, {"id": 2, "text": "Ajax fc (Free-scoring attack)", "votes": 38}, {"id": 3, "text": "Fass Elites / young stars", "votes": 18}]'::jsonb,
    108,
    '{}'::jsonb
),
(
    'poll-qa-04',
    'b1000000-0000-4000-8000-000000000008',
    'Biggest shock statistic in the Egerton League so far?',
    '[{"id": 1, "text": "Super Eagles +32 GD dominance", "votes": 68}, {"id": 2, "text": "Mighty Blacks conceding 39 goals", "votes": 42}, {"id": 3, "text": "Talanta FC leading Championship", "votes": 27}, {"id": 4, "text": "Santos FC down in 11th position", "votes": 19}]'::jsonb,
    156,
    '{}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 6. Atomic Stored Procedure: vote_banter_poll
-- Checks device ID first, locks poll row, prevents any double poll, updates votes & reason
CREATE OR REPLACE FUNCTION public.vote_banter_poll(
    p_poll_id TEXT,
    p_option_id INT,
    p_device_id TEXT,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_poll public.banter_polls%ROWTYPE;
    v_options JSONB;
    v_new_options JSONB;
    v_opt JSONB;
    v_found BOOLEAN := FALSE;
BEGIN
    -- 1. Device ID is the first thing checked
    IF p_device_id IS NULL OR length(btrim(p_device_id)) = 0 THEN
        RAISE EXCEPTION 'Device ID is required to cast a vote.';
    END IF;

    -- 2. Lock poll row for update
    SELECT * INTO v_poll FROM public.banter_polls WHERE id = p_poll_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Poll not found.';
    END IF;

    -- 3. Strict anti-double-vote assurance: check both table & JSONB voters
    IF EXISTS (
        SELECT 1 FROM public.banter_poll_votes
        WHERE poll_id = p_poll_id AND device_id = p_device_id
    ) OR (v_poll.voters ? p_device_id) THEN
        RAISE EXCEPTION 'Device has already voted on this poll.';
    END IF;

    -- 4. Record vote in banter_poll_votes table
    INSERT INTO public.banter_poll_votes (poll_id, device_id, option_id, reason)
    VALUES (p_poll_id, p_device_id, p_option_id, p_reason)
    ON CONFLICT (poll_id, device_id) DO NOTHING;

    -- 5. Atomically update options array
    v_options := v_poll.options;
    v_new_options := '[]'::jsonb;
    FOR v_opt IN SELECT * FROM jsonb_array_elements(v_options)
    LOOP
        IF (v_opt->>'id')::int = p_option_id THEN
            v_opt := jsonb_set(v_opt, '{votes}', to_jsonb(COALESCE((v_opt->>'votes')::int, 0) + 1));
            v_found := TRUE;
        END IF;
        v_new_options := v_new_options || jsonb_build_array(v_opt);
    END LOOP;

    IF NOT v_found THEN
        RAISE EXCEPTION 'Option not found in poll.';
    END IF;

    -- 6. Update banter_polls row
    UPDATE public.banter_polls
    SET options = v_new_options,
        total_votes = COALESCE(total_votes, 0) + 1,
        voters = jsonb_set(COALESCE(voters, '{}'::jsonb), ARRAY[p_device_id], to_jsonb(p_option_id)),
        updated_at = NOW()
    WHERE id = p_poll_id
    RETURNING * INTO v_poll;

    -- 7. If user provided a reason, create reply post in banter_posts
    IF p_reason IS NOT NULL AND length(btrim(p_reason)) > 0 AND v_poll.post_id IS NOT NULL THEN
        INSERT INTO public.banter_posts (
            parent_id,
            root_id,
            content,
            author_handle,
            author_device_id,
            author_name,
            author_type,
            source_type,
            uid
        ) VALUES (
            v_poll.post_id,
            v_poll.post_id,
            p_reason,
            'fanatic',
            p_device_id,
            'Fanatic',
            'user',
            'user',
            'usr_' || substring(p_device_id, 1, 8) || '_' || to_char(NOW(), 'YYMMDDHH24MISS')
        );
    END IF;

    RETURN to_jsonb(v_poll);
END;
$$;

GRANT EXECUTE ON FUNCTION public.vote_banter_poll(TEXT, INT, TEXT, TEXT) TO anon, authenticated, service_role;
