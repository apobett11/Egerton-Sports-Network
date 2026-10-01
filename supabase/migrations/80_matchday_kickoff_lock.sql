-- A matchday locks when its first kickoff is reached.
-- Saturday and Sunday are separate slates in Africa/Nairobi.
-- The old deadline was 7:00 PM the day before kickoff.

CREATE OR REPLACE FUNCTION public.reject_late_prediction()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_kick TIMESTAMPTZ;
    v_day DATE;
    v_slate TIMESTAMPTZ;
BEGIN
    SELECT scheduled_time INTO v_kick
    FROM public.fixtures
    WHERE id = NEW.match_id;

    IF v_kick IS NULL THEN
        RETURN NEW;
    END IF;

    v_day := (v_kick AT TIME ZONE 'Africa/Nairobi')::date;

    SELECT MIN(f.scheduled_time) INTO v_slate
    FROM public.fixtures f
    WHERE f.competition_id = '11111111-1111-1111-1111-111111111111'
      AND (f.scheduled_time AT TIME ZONE 'Africa/Nairobi')::date = v_day
      AND f.status IS DISTINCT FROM 'CANCELLED';

    IF v_slate IS NULL THEN
        v_slate := v_kick;
    END IF;

    IF NOW() >= v_slate THEN
        RAISE EXCEPTION 'Voting is closed for this matchday';
    END IF;

    RETURN NEW;
END;
$$;
