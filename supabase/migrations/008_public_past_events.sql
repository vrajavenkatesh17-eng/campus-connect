-- Migration: 008_public_past_events.sql
-- Function: public_past_events
-- Purpose: Public-facing read-only endpoint returning completed events for the /login past-events carousel.
-- Security: SECURITY DEFINER, anon/authenticated/service_role execute, no PII, no student counts.

CREATE OR REPLACE FUNCTION public.public_past_events(limit_count INT DEFAULT 12)
RETURNS TABLE (
    id UUID,
    title TEXT,
    event_date DATE,
    poster_url TEXT,
    speaker_name TEXT,
    speaker_company TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT
        e.id,
        e.title,
        COALESCE(e.event_date, (e.start_time AT TIME ZONE 'Asia/Kolkata')::date) AS event_date,
        e.poster_url,
        s.name AS speaker_name,
        s.company AS speaker_company
    FROM public.events e
    LEFT JOIN public.speakers s ON s.id = e.speaker_id
    WHERE e.status = 'completed'
    ORDER BY COALESCE(e.event_date, (e.start_time AT TIME ZONE 'Asia/Kolkata')::date) DESC, e.start_time DESC
    LIMIT LEAST(GREATEST(COALESCE(limit_count, 12), 1), 20);
$$;

-- Grant execution to anon, authenticated, and service_role
GRANT EXECUTE ON FUNCTION public.public_past_events(INT) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.public_past_events(INT) IS 
'Public endpoint for pre-login carousel displaying strictly completed events with speaker metadata. Capped at 20 rows.';
