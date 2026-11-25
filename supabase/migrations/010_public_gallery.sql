-- ==============================================================================
-- CAMPUS CONNECT — FXEC Autonomous Event Management System
-- Migration: 010_public_gallery.sql
-- Description: Public gallery paginated RPC (SECURITY DEFINER, anon readable),
--              event-photos Storage bucket with CORS & approved-only anon RLS.
-- ==============================================================================

-- 1. PUBLIC GALLERY RPC (paginated, newest first, zero student PII)
CREATE OR REPLACE FUNCTION public.public_gallery(
    limit_count INT DEFAULT 24,
    offset_count INT DEFAULT 0,
    filter_event_id UUID DEFAULT NULL,
    filter_year INT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    src TEXT,
    caption TEXT,
    event_id UUID,
    event_title TEXT,
    event_date DATE,
    venue TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT
        ep.id,
        ep.storage_path AS src,
        ep.caption,
        e.id AS event_id,
        e.title AS event_title,
        COALESCE(e.event_date, (e.start_time AT TIME ZONE 'Asia/Kolkata')::date) AS event_date,
        COALESCE(v.name, e.custom_venue, 'FXEC Campus') AS venue,
        ep.created_at
    FROM public.event_photos ep
    JOIN public.events e ON e.id = ep.event_id
    LEFT JOIN public.venues v ON v.id = e.venue_id
    WHERE ep.status = 'approved'
      AND (filter_event_id IS NULL OR e.id = filter_event_id)
      AND (
          filter_year IS NULL
          OR EXTRACT(YEAR FROM COALESCE(e.event_date, (e.start_time AT TIME ZONE 'Asia/Kolkata')::date))::INT = filter_year
      )
    ORDER BY ep.created_at DESC
    LIMIT LEAST(GREATEST(COALESCE(limit_count, 24), 1), 48)
    OFFSET GREATEST(COALESCE(offset_count, 0), 0);
$$;

GRANT EXECUTE ON FUNCTION public.public_gallery(INT, INT, UUID, INT) TO anon, authenticated, service_role;

-- 2. STORAGE BUCKET FOR EVENT PHOTOS & POSTERS (public read with approved check)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'event-photos',
    'event-photos',
    true,
    5242880, -- 5 MB max after WebP optimization
    ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png'];

-- Anon & authenticated can read only objects referenced by an approved row in event_photos
-- (or event posters stored under posters/)
DROP POLICY IF EXISTS "Public read approved gallery objects" ON storage.objects;
CREATE POLICY "Public read approved gallery objects"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'event-photos' AND (
            name LIKE 'posters/%'
            OR EXISTS (
                SELECT 1 FROM public.event_photos ep
                WHERE ep.status = 'approved'
                  AND (ep.storage_path LIKE '%' || storage.objects.name)
            )
        )
    );

-- Coordinators & Admins can upload to event-photos bucket
DROP POLICY IF EXISTS "Coordinators and admins upload event photos" ON storage.objects;
CREATE POLICY "Coordinators and admins upload event photos"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'event-photos'
        AND auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('coordinator', 'admin')
        )
    );

-- Admins can delete any object in event-photos bucket
DROP POLICY IF EXISTS "Admins delete event photos" ON storage.objects;
CREATE POLICY "Admins delete event photos"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'event-photos'
        AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );
