-- ==============================================================================
-- CAMPUS CONNECT — FXEC Autonomous Event Management System
-- Migration: 009_public_landing_and_event_status.sql
-- Description: Public Landing RPCs, event_photos table, events.public_summary,
--              derived event status function, and anonymous access policies.
-- ==============================================================================

-- 1. EXTEND EVENTS TABLE WITH PUBLIC SUMMARY
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS public_summary TEXT;

-- 2. CREATE EVENT PHOTOS TABLE
CREATE TABLE IF NOT EXISTS public.event_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    caption TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_event_photos_event_id ON public.event_photos(event_id);
CREATE INDEX IF NOT EXISTS idx_event_photos_status ON public.event_photos(status);

-- Enable RLS on event_photos
ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;

-- Anon and authenticated can read approved event photos
CREATE POLICY "Allow public read of approved event photos"
    ON public.event_photos FOR SELECT
    USING (status = 'approved');

-- Coordinators can insert photos for events they coordinate
CREATE POLICY "Coordinators can upload event photos"
    ON public.event_photos FOR INSERT
    WITH CHECK (
        auth.uid() = uploaded_by AND
        EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = event_id AND (e.coordinator_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
            ))
        )
    );

-- Admins can manage all event photos
CREATE POLICY "Admins have full access to event photos"
    ON public.event_photos FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- 3. DERIVED STATUS HELPER FUNCTION & VIEW
CREATE OR REPLACE FUNCTION public.get_event_derived_status(
    p_status TEXT,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE
        WHEN p_status = 'cancelled' THEN 'cancelled'
        WHEN p_status = 'rejected' THEN 'rejected'
        WHEN p_end_time <= now() THEN 'completed'
        ELSE p_status
    END;
$$;

GRANT EXECUTE ON FUNCTION public.get_event_derived_status(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO anon, authenticated, service_role;

CREATE OR REPLACE VIEW public.events_view AS
SELECT
    e.*,
    CASE
        WHEN e.status = 'cancelled' THEN 'cancelled'
        WHEN e.status = 'rejected' THEN 'rejected'
        WHEN e.end_time <= now() THEN 'completed'
        ELSE e.status
    END AS derived_status
FROM public.events e;

GRANT SELECT ON public.events_view TO anon, authenticated, service_role;

-- 4. PUBLIC STATS RPC
CREATE OR REPLACE FUNCTION public.public_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'events_hosted', (
            SELECT count(*)::int
            FROM public.events
            WHERE status IN ('approved', 'completed')
              AND end_time <= now()
        ),
        'students_engaged', (
            SELECT count(DISTINCT student_id)::int
            FROM public.attendance
            WHERE status = 'present'
        ),
        'certificates_issued', (
            SELECT count(*)::int
            FROM public.certificates
        ),
        'guest_speakers', (
            SELECT count(DISTINCT speaker_id)::int
            FROM public.events
            WHERE speaker_id IS NOT NULL
              AND status IN ('approved', 'completed')
              AND end_time <= now()
        )
    ) INTO result;
    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.public_stats() TO anon, authenticated, service_role;

-- 5. PUBLIC NEXT EVENT RPC
CREATE OR REPLACE FUNCTION public.public_next_event()
RETURNS TABLE (
    id UUID,
    title TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    venue TEXT,
    poster_url TEXT,
    speaker_name TEXT,
    speaker_company TEXT,
    seat_capacity INT,
    registered_count INT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT
        e.id,
        e.title,
        e.start_time,
        e.end_time,
        COALESCE(v.name, e.custom_venue, 'Campus Central') AS venue,
        e.poster_url,
        s.name AS speaker_name,
        s.company AS speaker_company,
        e.seat_capacity,
        e.registered_count
    FROM public.events e
    LEFT JOIN public.venues v ON v.id = e.venue_id
    LEFT JOIN public.speakers s ON s.id = e.speaker_id
    WHERE e.status = 'approved' AND e.start_time > now()
    ORDER BY e.start_time ASC
    LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.public_next_event() TO anon, authenticated, service_role;

-- 6. PUBLIC UPCOMING EVENTS RPC (Capped at 12)
CREATE OR REPLACE FUNCTION public.public_upcoming_events(limit_count INT DEFAULT 6)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    venue TEXT,
    poster_url TEXT,
    speaker_name TEXT,
    speaker_company TEXT,
    seat_capacity INT,
    registered_count INT,
    category TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT
        e.id,
        e.title,
        e.description,
        e.start_time,
        e.end_time,
        COALESCE(v.name, e.custom_venue, 'Campus Central') AS venue,
        e.poster_url,
        s.name AS speaker_name,
        s.company AS speaker_company,
        e.seat_capacity,
        e.registered_count,
        e.category
    FROM public.events e
    LEFT JOIN public.venues v ON v.id = e.venue_id
    LEFT JOIN public.speakers s ON s.id = e.speaker_id
    WHERE e.status = 'approved' AND e.start_time > now()
    ORDER BY e.start_time ASC
    LIMIT LEAST(GREATEST(COALESCE(limit_count, 6), 1), 12);
$$;

GRANT EXECUTE ON FUNCTION public.public_upcoming_events(INT) TO anon, authenticated, service_role;

-- 7. PUBLIC PAST EVENTS RPC (With approved photos and summary)
CREATE OR REPLACE FUNCTION public.public_past_events(limit_count INT DEFAULT 20)
RETURNS TABLE (
    id UUID,
    title TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    event_date DATE,
    poster_url TEXT,
    public_summary TEXT,
    speaker_name TEXT,
    speaker_company TEXT,
    photos JSONB
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT
        e.id,
        e.title,
        e.start_time,
        e.end_time,
        COALESCE(e.event_date, (e.start_time AT TIME ZONE 'Asia/Kolkata')::date) AS event_date,
        e.poster_url,
        e.public_summary,
        s.name AS speaker_name,
        s.company AS speaker_company,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', ep.id,
                        'storage_path', ep.storage_path,
                        'caption', ep.caption
                    )
                )
                FROM public.event_photos ep
                WHERE ep.event_id = e.id AND ep.status = 'approved'
            ),
            '[]'::jsonb
        ) AS photos
    FROM public.events e
    LEFT JOIN public.speakers s ON s.id = e.speaker_id
    WHERE (e.status IN ('approved', 'completed')) AND e.end_time <= now()
    ORDER BY e.end_time DESC
    LIMIT LEAST(GREATEST(COALESCE(limit_count, 20), 1), 30);
$$;

GRANT EXECUTE ON FUNCTION public.public_past_events(INT) TO anon, authenticated, service_role;

-- 8. PUBLIC SPEAKER COMPANIES RPC
CREATE OR REPLACE FUNCTION public.public_speaker_companies()
RETURNS TABLE (
    company TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT DISTINCT trim(s.company) AS company
    FROM public.speakers s
    JOIN public.events e ON e.speaker_id = s.id
    WHERE (e.status IN ('approved', 'completed'))
      AND e.end_time <= now()
      AND s.company IS NOT NULL
      AND trim(s.company) != ''
    ORDER BY company ASC
    LIMIT 20;
$$;

GRANT EXECUTE ON FUNCTION public.public_speaker_companies() TO anon, authenticated, service_role;
