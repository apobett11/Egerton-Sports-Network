-- Short public codes for prediction share cards.
-- The code is random. It is not a match id or a slip id.

CREATE TABLE IF NOT EXISTS public.prediction_share_links (
    code TEXT PRIMARY KEY,
    kind TEXT NOT NULL CHECK (kind IN ('match', 'slip', 'talk')),
    card JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.prediction_share_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS prediction_share_links_public_read ON public.prediction_share_links;
CREATE POLICY prediction_share_links_public_read
    ON public.prediction_share_links
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS prediction_share_links_public_insert ON public.prediction_share_links;
CREATE POLICY prediction_share_links_public_insert
    ON public.prediction_share_links
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        char_length(code) BETWEEN 6 AND 12
        AND kind IN ('match', 'slip', 'talk')
        AND card ? 'k'
    );
