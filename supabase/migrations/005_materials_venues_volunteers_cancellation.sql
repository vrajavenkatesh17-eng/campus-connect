-- ==============================================================================
-- CAMPUS CONNECT — FXEC Autonomous Event Management System
-- Architected & Patented by Krish & Ihsan. All Rights Reserved.
-- Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
-- ==============================================================================
-- Migration: 005_materials_venues_volunteers_cancellation.sql
-- Description: Phase 5 Implementation:
--              1. Learning Materials Table & Storage (Restricted to Attended Students)
--              2. Venue Booking Conflict Prevention (Overlap Prevention & Capacity Check)
--              3. Event Volunteers System (Applications & Coordinator Assignment)
--              4. Event Cancellation RPC with Atomic Mass Notification
--              5. Automated Event Reminders & Database Keep-Alive (24h & 1h)
--              6. Strict Server-Side RLS Policies
-- ==============================================================================

-- 1. LEARNING MATERIALS TABLE
CREATE TABLE IF NOT EXISTS public.learning_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    material_type TEXT NOT NULL CHECK (material_type IN ('pdf', 'slides', 'code', 'link', 'notes')),
    file_url TEXT NOT NULL,
    file_size BIGINT,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_materials_event ON public.learning_materials(event_id);

-- Storage bucket for learning materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('learning-materials', 'learning-materials', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for learning-materials:
-- ONLY students who attended the session, the event's coordinator, or an admin can access/download files.
DROP POLICY IF EXISTS "Learning Materials Download Access" ON storage.objects;
CREATE POLICY "Learning Materials Download Access"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'learning-materials' AND (
            public.is_admin() OR
            EXISTS (
                SELECT 1 FROM public.attendance a
                JOIN public.learning_materials lm ON lm.event_id = a.event_id
                WHERE a.student_id = auth.uid() AND lm.file_url LIKE '%' || storage.objects.name || '%'
            ) OR
            EXISTS (
                SELECT 1 FROM public.events e
                JOIN public.learning_materials lm ON lm.event_id = e.id
                WHERE (e.coordinator_id = auth.uid() OR public.is_event_coordinator(e.id))
                  AND lm.file_url LIKE '%' || storage.objects.name || '%'
            )
        )
    );

DROP POLICY IF EXISTS "Learning Materials Coordinator Upload" ON storage.objects;
CREATE POLICY "Learning Materials Coordinator Upload"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'learning-materials' AND (
            public.is_admin() OR public.is_coordinator()
        )
    );

-- 2. VENUE BOOKING OVERLAP & CAPACITY VALIDATION
-- Ensures that two approved events cannot overlap in the same venue, and event capacity cannot exceed venue capacity.
CREATE OR REPLACE FUNCTION public.check_venue_conflict()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_venue RECORD;
    v_conflict_event RECORD;
BEGIN
    -- If venue_id is assigned
    IF NEW.venue_id IS NOT NULL THEN
        -- 1. Check venue capacity
        SELECT * INTO v_venue FROM public.venues WHERE id = NEW.venue_id;
        IF FOUND AND v_venue.capacity IS NOT NULL AND NEW.seat_capacity > v_venue.capacity THEN
            RAISE EXCEPTION 'Capacity Error: Event seat capacity (%) exceeds venue "%" maximum capacity (%).',
                NEW.seat_capacity, v_venue.name, v_venue.capacity;
        END IF;

        -- 2. Check overlap with other approved sessions in the same venue
        -- Overlap logic: (startA < endB) AND (endA > startB)
        IF NEW.status = 'approved' THEN
            SELECT * INTO v_conflict_event FROM public.events
            WHERE venue_id = NEW.venue_id
              AND status = 'approved'
              AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
              AND (NEW.start_time < end_time AND NEW.end_time > start_time)
            LIMIT 1;

            IF FOUND THEN
                RAISE EXCEPTION 'Venue Conflict: Venue "%" is already booked for approved event "%" between % and %.',
                    v_venue.name, v_conflict_event.title, 
                    to_char(v_conflict_event.start_time AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY HH:MI AM'),
                    to_char(v_conflict_event.end_time AT TIME ZONE 'Asia/Kolkata', 'HH:MI AM');
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_venue_conflict ON public.events;
CREATE TRIGGER trg_check_venue_conflict
    BEFORE INSERT OR UPDATE OF venue_id, start_time, end_time, status, seat_capacity ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.check_venue_conflict();

-- 3. EVENT VOLUNTEERS TABLE
CREATE TABLE IF NOT EXISTS public.event_volunteers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_preference TEXT,
    assigned_role TEXT,
    status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'accepted', 'rejected')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT uq_event_student_volunteer UNIQUE (event_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_volunteers_event ON public.event_volunteers(event_id);
CREATE INDEX IF NOT EXISTS idx_volunteers_student ON public.event_volunteers(student_id);

-- Volunteer RPC: Student applies
CREATE OR REPLACE FUNCTION public.apply_to_volunteer(
    p_event_id UUID,
    p_role_preference TEXT DEFAULT 'General Volunteer'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_student_id UUID := auth.uid();
    v_event RECORD;
BEGIN
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    SELECT * INTO v_event FROM public.events WHERE id = p_event_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found.';
    END IF;

    IF v_event.status <> 'approved' THEN
        RAISE EXCEPTION 'Volunteer applications are only open for approved events.';
    END IF;

    INSERT INTO public.event_volunteers (
        event_id,
        student_id,
        role_preference,
        status,
        created_at
    ) VALUES (
        p_event_id,
        v_student_id,
        COALESCE(p_role_preference, 'General Support'),
        'applied',
        now()
    )
    ON CONFLICT (event_id, student_id) DO NOTHING;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Volunteer application submitted successfully.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_to_volunteer(UUID, TEXT) TO authenticated, service_role;

-- Volunteer RPC: Coordinator decides on volunteer
CREATE OR REPLACE FUNCTION public.decide_volunteer(
    p_volunteer_id UUID,
    p_decision TEXT,
    p_assigned_role TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_vol RECORD;
    v_event RECORD;
BEGIN
    SELECT * INTO v_vol FROM public.event_volunteers WHERE id = p_volunteer_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Volunteer application not found.';
    END IF;

    IF NOT (public.is_admin() OR public.is_event_coordinator(v_vol.event_id)) THEN
        RAISE EXCEPTION 'Access Denied: Only event coordinators and administrators can manage volunteers.';
    END IF;

    IF p_decision NOT IN ('accepted', 'rejected') THEN
        RAISE EXCEPTION 'Decision must be accepted or rejected.';
    END IF;

    SELECT * INTO v_event FROM public.events WHERE id = v_vol.event_id;

    UPDATE public.event_volunteers
    SET status = p_decision,
        assigned_role = CASE WHEN p_decision = 'accepted' THEN COALESCE(p_assigned_role, v_vol.role_preference, 'Volunteer') ELSE NULL END,
        notes = p_notes
    WHERE id = p_volunteer_id;

    -- Notify student
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        event_id
    ) VALUES (
        v_vol.student_id,
        'Volunteer Application ' || initcap(p_decision),
        'Your volunteer application for "' || v_event.title || '" has been ' || p_decision || '.' ||
        CASE WHEN p_decision = 'accepted' THEN ' Assigned Role: ' || COALESCE(p_assigned_role, 'Event Support') ELSE '' END,
        'volunteer_update',
        v_vol.event_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'status', p_decision
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.decide_volunteer(UUID, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- 4. RPC: ATOMIC EVENT CANCELLATION
-- Coordinator or Admin cancels an event with a mandatory reason.
-- Updates event status to 'cancelled' and notifies ALL registered and waitlisted students in ONE transaction.
CREATE OR REPLACE FUNCTION public.cancel_event(
    p_event_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id UUID := auth.uid();
    v_event RECORD;
    v_reg RECORD;
    v_notified_count INT := 0;
    v_now TIMESTAMPTZ := now();
BEGIN
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    -- Verify coordinator or admin
    IF NOT (public.is_admin() OR public.is_event_coordinator(p_event_id)) THEN
        RAISE EXCEPTION 'Access Denied: Only event coordinators or administrators can cancel this event.';
    END IF;

    -- Reason is mandatory
    IF TRIM(COALESCE(p_reason, '')) = '' THEN
        RAISE EXCEPTION 'A cancellation reason is required.';
    END IF;

    SELECT * INTO v_event FROM public.events WHERE id = p_event_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found.';
    END IF;

    IF v_event.status = 'cancelled' THEN
        RAISE EXCEPTION 'Event is already cancelled.';
    END IF;

    -- Update event status
    UPDATE public.events
    SET status = 'cancelled',
        rejection_reason = TRIM(p_reason),
        updated_at = v_now
    WHERE id = p_event_id;

    -- Write activity log
    INSERT INTO public.activity_logs (
        actor_id,
        action,
        entity_type,
        entity_id,
        event_id,
        metadata,
        created_at
    ) VALUES (
        v_actor_id,
        'EVENT_CANCELLED',
        'event',
        p_event_id,
        p_event_id,
        jsonb_build_object('title', v_event.title, 'reason', p_reason),
        v_now
    );

    -- Notify all registered and waitlisted students
    FOR v_reg IN 
        SELECT student_id FROM public.registrations
        WHERE event_id = p_event_id AND status IN ('registered', 'waitlisted')
    LOOP
        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            type,
            event_id
        ) VALUES (
            v_reg.student_id,
            'Event Cancelled: ' || v_event.title,
            'Notice: The session "' || v_event.title || '" has been cancelled. Reason: ' || p_reason,
            'event_cancelled',
            p_event_id
        );
        v_notified_count := v_notified_count + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'event_id', p_event_id,
        'status', 'cancelled',
        'students_notified', v_notified_count
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_event(UUID, TEXT) TO authenticated, service_role;

-- 5. AUTOMATED EVENT REMINDERS & KEEPALIVE ENGINE
-- Columns on events to track idempotent reminder delivery
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS reminder_24h_sent BOOLEAN DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS reminder_1h_sent BOOLEAN DEFAULT false;

-- RPC: PROCESS EVENT REMINDERS (IDEMPOTENT)
-- Callable by Supabase Edge Function or GitHub Actions cron workflow.
CREATE OR REPLACE FUNCTION public.process_event_reminders()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_now TIMESTAMPTZ := now();
    v_event RECORD;
    v_reg RECORD;
    v_24h_count INT := 0;
    v_1h_count INT := 0;
BEGIN
    -- 1. 24-Hour Reminders (Starts in 23h to 25h, not sent yet)
    FOR v_event IN
        SELECT * FROM public.events
        WHERE status = 'approved'
          AND reminder_24h_sent = false
          AND start_time BETWEEN (v_now + INTERVAL '23 hours') AND (v_now + INTERVAL '25 hours')
    LOOP
        FOR v_reg IN 
            SELECT student_id FROM public.registrations
            WHERE event_id = v_event.id AND status = 'registered'
        LOOP
            INSERT INTO public.notifications (user_id, title, message, type, event_id)
            VALUES (
                v_reg.student_id,
                'Reminder: 24h to ' || v_event.title,
                'Your registered guest lecture begins tomorrow at ' || to_char(v_event.start_time AT TIME ZONE 'Asia/Kolkata', 'HH:MI AM') || '.',
                'reminder_24h',
                v_event.id
            );
            v_24h_count := v_24h_count + 1;
        END LOOP;

        UPDATE public.events SET reminder_24h_sent = true WHERE id = v_event.id;
    END LOOP;

    -- 2. 1-Hour Reminders (Starts in 50m to 70m, not sent yet)
    FOR v_event IN
        SELECT * FROM public.events
        WHERE status = 'approved'
          AND reminder_1h_sent = false
          AND start_time BETWEEN (v_now + INTERVAL '50 minutes') AND (v_now + INTERVAL '70 minutes')
    LOOP
        FOR v_reg IN 
            SELECT student_id FROM public.registrations
            WHERE event_id = v_event.id AND status = 'registered'
        LOOP
            INSERT INTO public.notifications (user_id, title, message, type, event_id)
            VALUES (
                v_reg.student_id,
                'Starting in 1 Hour: ' || v_event.title,
                'The session is starting shortly. Please arrive at the venue to scan the attendance QR code.',
                'reminder_1h',
                v_event.id
            );
            v_1h_count := v_1h_count + 1;
        END LOOP;

        UPDATE public.events SET reminder_1h_sent = true WHERE id = v_event.id;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'reminders_24h_sent', v_24h_count,
        'reminders_1h_sent', v_1h_count,
        'executed_at', v_now
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_event_reminders() TO anon, authenticated, service_role;

-- 6. STRICT RLS POLICIES FOR MATERIALS & VOLUNTEERS

-- LEARNING MATERIALS RLS
ALTER TABLE public.learning_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "learning_materials_select_policy" ON public.learning_materials;
CREATE POLICY "learning_materials_select_policy" ON public.learning_materials
    FOR SELECT TO authenticated
    USING (
        public.is_admin() OR
        public.is_event_coordinator(event_id) OR
        EXISTS (
            SELECT 1 FROM public.attendance
            WHERE event_id = learning_materials.event_id AND student_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "learning_materials_manage_policy" ON public.learning_materials;
CREATE POLICY "learning_materials_manage_policy" ON public.learning_materials
    FOR ALL TO authenticated
    USING (public.is_admin() OR public.is_event_coordinator(event_id))
    WITH CHECK (public.is_admin() OR public.is_event_coordinator(event_id));

-- EVENT VOLUNTEERS RLS
ALTER TABLE public.event_volunteers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_volunteers_select_policy" ON public.event_volunteers;
CREATE POLICY "event_volunteers_select_policy" ON public.event_volunteers
    FOR SELECT TO authenticated
    USING (
        student_id = auth.uid() OR
        public.is_admin() OR
        public.is_event_coordinator(event_id)
    );
