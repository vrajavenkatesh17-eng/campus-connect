-- ==============================================================================
-- CAMPUS CONNECT - GUEST LECTURE & EVENT MANAGEMENT SYSTEM
-- Patented & Engineered by: Krishna Raja V (Krish) <v.rajavenkatesh17@gmail.com>
-- Institution: Francis Xavier Engineering College (FXEC)
-- Intellectual Property Protection: KRISH-FXEC-PATENT-2026-CC-AUTH
-- All Rights Reserved. Unauthorized copying or redistribution is prohibited.
-- ==============================================================================
-- Migration: 002_events_and_registrations.sql (Idempotent & Recursion-Free)
-- Description: Venues, Speakers, Events, Event Departments, Registrations,
--              Notifications, Activity Logs, Storage Bucket for Posters,
--              Atomic Seat & Waitlist RPCs, Department RLS, and Notification Triggers.
-- ==============================================================================

-- 1. VENUES TABLE
CREATE TABLE IF NOT EXISTS public.venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    building TEXT NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Seed Francis Xavier Engineering College Venues
INSERT INTO public.venues (name, building, capacity) VALUES
    ('APJ Abdul Kalam Auditorium', 'Main Administrative Block', 500),
    ('Campus Central Seminar Hall', 'Library Complex - 2nd Floor', 250),
    ('Civil Seminar Hall', 'Civil Engineering Block', 120),
    ('Mechanical Seminar Hall', 'Mechanical Engineering Block', 150),
    ('MBA Seminar Hall', 'Management Studies Block', 120),
    ('SCAD Smart Classroom 1', 'Main Block - 1st Floor', 80)
ON CONFLICT (name) DO NOTHING;

-- 2. SPEAKERS TABLE
CREATE TABLE IF NOT EXISTS public.speakers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    designation TEXT NOT NULL,
    company TEXT NOT NULL,
    experience TEXT,
    linkedin_url TEXT,
    photo_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_speakers_name ON public.speakers(name);
CREATE INDEX IF NOT EXISTS idx_speakers_company ON public.speakers(company);

-- 3. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    coordinator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    speaker_id UUID REFERENCES public.speakers(id) ON DELETE SET NULL,
    venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL,
    custom_venue TEXT,
    is_all_departments BOOLEAN NOT NULL DEFAULT true,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    seat_capacity INT NOT NULL CHECK (seat_capacity > 0),
    registered_count INT NOT NULL DEFAULT 0 CHECK (registered_count >= 0),
    waiting_count INT NOT NULL DEFAULT 0 CHECK (waiting_count >= 0),
    poster_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT check_event_time_order CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_coord ON public.events(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_events_start ON public.events(start_time);

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'guest_lecture';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_date DATE;
UPDATE public.events SET event_date = (start_time AT TIME ZONE 'Asia/Kolkata')::date WHERE event_date IS NULL;

-- Automatically populate event_date from start_time
CREATE OR REPLACE FUNCTION public.sync_event_date()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.event_date := (NEW.start_time AT TIME ZONE 'Asia/Kolkata')::date;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_event_date ON public.events;
CREATE TRIGGER trg_sync_event_date
    BEFORE INSERT OR UPDATE OF start_time ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_event_date();

-- 4. EVENT DEPARTMENTS (Department Targeting Junction Table)
CREATE TABLE IF NOT EXISTS public.event_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (event_id, department_id)
);

CREATE INDEX IF NOT EXISTS idx_evt_dept_event ON public.event_departments(event_id);
CREATE INDEX IF NOT EXISTS idx_evt_dept_dept ON public.event_departments(department_id);

-- 5. REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('registered', 'waitlisted', 'cancelled')),
    queue_position INT,
    registered_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    promoted_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    UNIQUE (event_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_reg_event_status ON public.registrations(event_id, status);
CREATE INDEX IF NOT EXISTS idx_reg_student ON public.registrations(student_id);

-- 6. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_unread ON public.notifications(user_id, is_read);

-- 7. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_act_logs_entity ON public.activity_logs(entity_type, entity_id);

-- 8. STORAGE BUCKET FOR EVENT POSTERS
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-posters', 'event-posters', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Public Event Posters Read" ON storage.objects;
CREATE POLICY "Public Event Posters Read"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'event-posters');

DROP POLICY IF EXISTS "Coordinators & Admins Poster Upload" ON storage.objects;
CREATE POLICY "Coordinators & Admins Poster Upload"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'event-posters' AND
        public.is_coordinator()
    );

DROP POLICY IF EXISTS "Coordinators & Admins Poster Update" ON storage.objects;
CREATE POLICY "Coordinators & Admins Poster Update"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'event-posters' AND public.is_coordinator());

-- 9. RECURSION-PREVENTING SECURITY DEFINER HELPER FUNCTIONS
-- Checks whether a student's department matches event targeting (bypasses RLS recursion)
CREATE OR REPLACE FUNCTION public.can_student_view_event(p_event_id UUID, p_is_all_departments BOOLEAN)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        p_is_all_departments OR
        EXISTS (
            SELECT 1 FROM public.event_departments ed
            JOIN public.profiles p ON p.id = auth.uid()
            WHERE ed.event_id = p_event_id AND ed.department_id = p.department_id
        );
$$;

-- Checks whether caller is coordinator of event or system admin (bypasses RLS recursion)
CREATE OR REPLACE FUNCTION public.is_event_coordinator(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.events 
        WHERE id = p_event_id AND (coordinator_id = auth.uid() OR public.is_admin())
    );
$$;

-- 10. ADMIN EVENT REVIEW RPC (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.admin_decide_event(
    p_event_id UUID,
    p_decision TEXT,
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_event RECORD;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Only administrators can approve or reject events.';
    END IF;

    IF p_decision NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid decision: Must be approved or rejected.';
    END IF;

    IF p_decision = 'rejected' AND (p_rejection_reason IS NULL OR TRIM(p_rejection_reason) = '') THEN
        RAISE EXCEPTION 'A reason is strictly required when rejecting an event.';
    END IF;

    SELECT * INTO v_event FROM public.events WHERE id = p_event_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found.';
    END IF;

    IF p_decision = 'approved' THEN
        UPDATE public.events
        SET status = 'approved',
            rejection_reason = NULL,
            updated_at = now()
        WHERE id = p_event_id;

        -- Notify coordinator
        INSERT INTO public.notifications (user_id, title, message, type, event_id)
        VALUES (
            v_event.coordinator_id,
            'Event Approved',
            'Your event "' || v_event.title || '" has been approved by the Administration.',
            'event_approved',
            p_event_id
        );

        -- Activity log
        INSERT INTO public.activity_logs (actor_id, action, entity_type, entity_id, metadata)
        VALUES (auth.uid(), 'EVENT_APPROVED', 'event', p_event_id, jsonb_build_object('title', v_event.title));
    ELSE
        UPDATE public.events
        SET status = 'rejected',
            rejection_reason = p_rejection_reason,
            updated_at = now()
        WHERE id = p_event_id;

        -- Notify coordinator with reason
        INSERT INTO public.notifications (user_id, title, message, type, event_id)
        VALUES (
            v_event.coordinator_id,
            'Event Proposal Rejected',
            'Your proposal "' || v_event.title || '" was rejected. Reason: ' || p_rejection_reason,
            'event_rejected',
            p_event_id
        );

        -- Activity log
        INSERT INTO public.activity_logs (actor_id, action, entity_type, entity_id, metadata)
        VALUES (auth.uid(), 'EVENT_REJECTED', 'event', p_event_id, jsonb_build_object('title', v_event.title, 'reason', p_rejection_reason));
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'event_id', p_event_id,
        'status', p_decision
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_decide_event FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_decide_event TO authenticated;

-- 11. TRIGGER: EDITS TO APPROVED EVENTS (DATE, TIME, VENUE) TRIGGER ACTIVITY LOG & STUDENT NOTIFICATIONS
CREATE OR REPLACE FUNCTION public.handle_approved_event_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_change_details TEXT := '';
    v_reg RECORD;
BEGIN
    -- Only trigger if event is already approved and date/time/venue changed
    IF OLD.status = 'approved' AND (
        OLD.start_time IS DISTINCT FROM NEW.start_time OR
        OLD.end_time IS DISTINCT FROM NEW.end_time OR
        OLD.venue_id IS DISTINCT FROM NEW.venue_id OR
        OLD.custom_venue IS DISTINCT FROM NEW.custom_venue
    ) THEN
        IF OLD.start_time IS DISTINCT FROM NEW.start_time THEN
            v_change_details := v_change_details || ' New Date/Time: ' || to_char(NEW.start_time AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY HH:MI AM') || '.';
        END IF;
        IF OLD.venue_id IS DISTINCT FROM NEW.venue_id OR OLD.custom_venue IS DISTINCT FROM NEW.custom_venue THEN
            v_change_details := v_change_details || ' Venue has been updated.';
        END IF;

        -- 1. Insert Activity Log
        INSERT INTO public.activity_logs (actor_id, action, entity_type, entity_id, metadata)
        VALUES (
            auth.uid(),
            'EVENT_SCHEDULE_CHANGED',
            'event',
            NEW.id,
            jsonb_build_object(
                'event_title', NEW.title,
                'old_start', OLD.start_time,
                'new_start', NEW.start_time,
                'details', v_change_details
            )
        );

        -- 2. Notify all registered and waitlisted students
        FOR v_reg IN 
            SELECT student_id FROM public.registrations
            WHERE event_id = NEW.id AND status IN ('registered', 'waitlisted')
        LOOP
            INSERT INTO public.notifications (user_id, title, message, type, event_id)
            VALUES (
                v_reg.student_id,
                'Schedule Update: ' || NEW.title,
                'Important updates made to your registered event.' || v_change_details,
                'event_update',
                NEW.id
            );
        END LOOP;
    END IF;

    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_approved_event_update ON public.events;
CREATE TRIGGER trg_handle_approved_event_update
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_approved_event_update();

-- 12. ATOMIC EVENT REGISTRATION RPC (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.register_for_event(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_user_role TEXT;
    v_user_dept UUID;
    v_event RECORD;
    v_dept_eligible BOOLEAN := false;
    v_existing_status TEXT;
    v_next_queue_pos INT;
BEGIN
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to register for events.';
    END IF;

    -- 1. Lock the event row for update
    SELECT * INTO v_event FROM public.events WHERE id = p_event_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found.';
    END IF;

    -- 2. Validate status and start time (only approved, future events accept registration)
    IF v_event.status <> 'approved' THEN
        RAISE EXCEPTION 'Registration is not available. This event is %.', v_event.status;
    END IF;

    IF v_event.start_time <= now() THEN
        RAISE EXCEPTION 'Registration has closed as this event has already started.';
    END IF;

    -- 3. Validate student department eligibility
    SELECT role, department_id INTO v_user_role, v_user_dept
    FROM public.profiles WHERE id = v_caller_id;

    v_dept_eligible := public.can_student_view_event(p_event_id, v_event.is_all_departments);

    IF NOT v_dept_eligible THEN
        RAISE EXCEPTION 'This event is restricted to specific departments. Your department is not eligible.';
    END IF;

    -- 4. Check duplicate / existing registration
    SELECT status INTO v_existing_status FROM public.registrations
    WHERE event_id = p_event_id AND student_id = v_caller_id;

    IF v_existing_status IN ('registered', 'waitlisted') THEN
        RAISE EXCEPTION 'You are already % for this event.', v_existing_status;
    END IF;

    -- 5. Atomic Seat Allocation
    IF v_event.registered_count < v_event.seat_capacity THEN
        IF v_existing_status = 'cancelled' THEN
            UPDATE public.registrations
            SET status = 'registered',
                queue_position = NULL,
                registered_at = now(),
                cancelled_at = NULL
            WHERE event_id = p_event_id AND student_id = v_caller_id;
        ELSE
            INSERT INTO public.registrations (event_id, student_id, status, queue_position, registered_at)
            VALUES (p_event_id, v_caller_id, 'registered', NULL, now());
        END IF;

        UPDATE public.events
        SET registered_count = registered_count + 1,
            updated_at = now()
        WHERE id = p_event_id;

        INSERT INTO public.notifications (user_id, title, message, type, event_id)
        VALUES (
            v_caller_id,
            'Registration Confirmed!',
            'Your seat for "' || v_event.title || '" is confirmed.',
            'registration_confirmed',
            p_event_id
        );

        RETURN jsonb_build_object(
            'success', true,
            'status', 'registered',
            'message', 'Your seat has been successfully confirmed!'
        );
    ELSE
        SELECT COALESCE(MAX(queue_position), 0) + 1 INTO v_next_queue_pos
        FROM public.registrations
        WHERE event_id = p_event_id AND status = 'waitlisted';

        IF v_existing_status = 'cancelled' THEN
            UPDATE public.registrations
            SET status = 'waitlisted',
                queue_position = v_next_queue_pos,
                registered_at = now(),
                cancelled_at = NULL
            WHERE event_id = p_event_id AND student_id = v_caller_id;
        ELSE
            INSERT INTO public.registrations (event_id, student_id, status, queue_position, registered_at)
            VALUES (p_event_id, v_caller_id, 'waitlisted', v_next_queue_pos, now());
        END IF;

        UPDATE public.events
        SET waiting_count = waiting_count + 1,
            updated_at = now()
        WHERE id = p_event_id;

        INSERT INTO public.notifications (user_id, title, message, type, event_id)
        VALUES (
            v_caller_id,
            'Added to Waiting List',
            'Seats are full for "' || v_event.title || '". You are in position #' || v_next_queue_pos || ' on the waiting list.',
            'waitlist_added',
            p_event_id
        );

        RETURN jsonb_build_object(
            'success', true,
            'status', 'waitlisted',
            'queue_position', v_next_queue_pos,
            'message', 'Capacity reached. You have been placed on the waiting list at position #' || v_next_queue_pos || '.'
        );
    END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.register_for_event FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_for_event TO authenticated;

-- 13. ATOMIC CANCELLATION & WAITLIST PROMOTION RPC (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.cancel_registration(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_event RECORD;
    v_reg RECORD;
    v_waitlist_cand RECORD;
BEGIN
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    -- Lock event row
    SELECT * INTO v_event FROM public.events WHERE id = p_event_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found.';
    END IF;

    -- Lock user's registration
    SELECT * INTO v_reg FROM public.registrations
    WHERE event_id = p_event_id AND student_id = v_caller_id
    FOR UPDATE;

    IF NOT FOUND OR v_reg.status = 'cancelled' THEN
        RAISE EXCEPTION 'You do not have an active registration for this event.';
    END IF;

    IF v_reg.status = 'registered' THEN
        UPDATE public.registrations
        SET status = 'cancelled',
            cancelled_at = now()
        WHERE id = v_reg.id;

        -- Promote oldest waitlisted candidate
        SELECT * INTO v_waitlist_cand
        FROM public.registrations
        WHERE event_id = p_event_id AND status = 'waitlisted'
        ORDER BY queue_position ASC, registered_at ASC
        LIMIT 1
        FOR UPDATE;

        IF FOUND THEN
            UPDATE public.registrations
            SET status = 'registered',
                queue_position = NULL,
                promoted_at = now()
            WHERE id = v_waitlist_cand.id;

            UPDATE public.events
            SET waiting_count = GREATEST(0, waiting_count - 1),
                updated_at = now()
            WHERE id = p_event_id;

            INSERT INTO public.notifications (user_id, title, message, type, event_id)
            VALUES (
                v_waitlist_cand.student_id,
                'Waitlist Promotion: Seat Confirmed!',
                'A seat opened up for "' || v_event.title || '"! Your registration is now confirmed.',
                'waitlist_promoted',
                p_event_id
            );
        ELSE
            UPDATE public.events
            SET registered_count = GREATEST(0, registered_count - 1),
                updated_at = now()
            WHERE id = p_event_id;
        END IF;

    ELSIF v_reg.status = 'waitlisted' THEN
        UPDATE public.registrations
        SET status = 'cancelled',
            cancelled_at = now()
        WHERE id = v_reg.id;

        UPDATE public.events
        SET waiting_count = GREATEST(0, waiting_count - 1),
            updated_at = now()
        WHERE id = p_event_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Registration cancelled successfully.'
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cancel_registration FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_registration TO authenticated;

-- 14. ROW LEVEL SECURITY (RLS) POLICIES (Recursion-Free)

ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- VENUES POLICIES
DROP POLICY IF EXISTS "venues_select_policy" ON public.venues;
CREATE POLICY "venues_select_policy"
    ON public.venues FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "venues_admin_policy" ON public.venues;
CREATE POLICY "venues_admin_policy"
    ON public.venues FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- SPEAKERS POLICIES
DROP POLICY IF EXISTS "speakers_select_policy" ON public.speakers;
CREATE POLICY "speakers_select_policy"
    ON public.speakers FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "speakers_coord_insert_policy" ON public.speakers;
CREATE POLICY "speakers_coord_insert_policy"
    ON public.speakers FOR INSERT
    TO authenticated
    WITH CHECK (public.is_coordinator());

DROP POLICY IF EXISTS "speakers_coord_update_policy" ON public.speakers;
CREATE POLICY "speakers_coord_update_policy"
    ON public.speakers FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid() OR public.is_admin())
    WITH CHECK (created_by = auth.uid() OR public.is_admin());

-- EVENTS POLICIES
DROP POLICY IF EXISTS "events_select_policy" ON public.events;
CREATE POLICY "events_select_policy"
    ON public.events FOR SELECT
    TO authenticated
    USING (
        public.is_admin() OR
        coordinator_id = auth.uid() OR
        (status IN ('approved', 'completed') AND public.can_student_view_event(id, is_all_departments))
    );

DROP POLICY IF EXISTS "events_insert_policy" ON public.events;
CREATE POLICY "events_insert_policy"
    ON public.events FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_coordinator() AND
        coordinator_id = auth.uid()
    );

DROP POLICY IF EXISTS "events_update_policy" ON public.events;
CREATE POLICY "events_update_policy"
    ON public.events FOR UPDATE
    TO authenticated
    USING (
        (public.is_coordinator() AND coordinator_id = auth.uid()) OR
        public.is_admin()
    )
    WITH CHECK (
        (public.is_coordinator() AND coordinator_id = auth.uid()) OR
        public.is_admin()
    );

DROP POLICY IF EXISTS "events_delete_policy" ON public.events;
CREATE POLICY "events_delete_policy"
    ON public.events FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- EVENT DEPARTMENTS POLICIES (Explicit separate commands, no 'FOR ALL' recursion)
DROP POLICY IF EXISTS "event_dept_select_policy" ON public.event_departments;
CREATE POLICY "event_dept_select_policy"
    ON public.event_departments FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "event_dept_manage_policy" ON public.event_departments;
DROP POLICY IF EXISTS "event_dept_insert_policy" ON public.event_departments;
CREATE POLICY "event_dept_insert_policy"
    ON public.event_departments FOR INSERT
    TO authenticated
    WITH CHECK (public.is_event_coordinator(event_id));

DROP POLICY IF EXISTS "event_dept_update_policy" ON public.event_departments;
CREATE POLICY "event_dept_update_policy"
    ON public.event_departments FOR UPDATE
    TO authenticated
    USING (public.is_event_coordinator(event_id))
    WITH CHECK (public.is_event_coordinator(event_id));

DROP POLICY IF EXISTS "event_dept_delete_policy" ON public.event_departments;
CREATE POLICY "event_dept_delete_policy"
    ON public.event_departments FOR DELETE
    TO authenticated
    USING (public.is_event_coordinator(event_id));

-- REGISTRATIONS POLICIES
DROP POLICY IF EXISTS "reg_select_policy" ON public.registrations;
CREATE POLICY "reg_select_policy"
    ON public.registrations FOR SELECT
    TO authenticated
    USING (
        student_id = auth.uid() OR
        public.is_admin() OR
        public.is_event_coordinator(event_id)
    );

-- NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "notif_select_policy" ON public.notifications;
CREATE POLICY "notif_select_policy"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notif_update_policy" ON public.notifications;
CREATE POLICY "notif_update_policy"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ACTIVITY LOGS POLICIES
DROP POLICY IF EXISTS "activity_logs_admin_select" ON public.activity_logs;
CREATE POLICY "activity_logs_admin_select"
    ON public.activity_logs FOR SELECT
    TO authenticated
    USING (public.is_admin());
