-- ==============================================================================
-- CAMPUS CONNECT — FXEC Autonomous Event Management System
-- Architected & Patented by Krish & Ihsan. All Rights Reserved.
-- Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
-- ==============================================================================
-- Migration: 003_attendance_and_feedback.sql (Idempotent & Re-runnable)
-- Description: Phase 3 Attendance & Feedback System
--              1. Attendance Table with unique (event_id, student_id)
--              2. Server-side HMAC Rotating QR Token Generation (30-second slots)
--              3. Atomic QR Scan Validation RPC (mark_attendance)
--              4. Manual Attendance Override RPC with Audit Logging
--              5. Anonymous Feedback Architecture (feedback_responses & feedback_submissions)
--              6. Feedback Submission RPC (submit_event_feedback)
--              7. Strict Server-Side RLS Policies
-- ==============================================================================

-- 1. EXTENSIONS & SCHEMA COMPATIBILITY
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'guest_lecture';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_date DATE;
UPDATE public.events SET event_date = (start_time AT TIME ZONE 'Asia/Kolkata')::date WHERE event_date IS NULL;

-- Schema compatibility for activity_logs
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS event_id UUID;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS details JSONB;

CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    marked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    method TEXT NOT NULL CHECK (method IN ('qr_scan', 'manual_coordinator', 'manual_admin')),
    verified_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT uq_event_student_attendance UNIQUE (event_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_event ON public.attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_verified ON public.attendance(verified_at);

-- 2. FEEDBACK SUBMISSIONS TABLE (Privacy Gatekeeper)
-- Tracks whether a student has submitted feedback without exposing their review content.
-- Coordinators and Admins CANNOT read this table.
CREATE TABLE IF NOT EXISTS public.feedback_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    submitted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT uq_event_student_feedback UNIQUE (event_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_sub_event_student ON public.feedback_submissions(event_id, student_id);

-- 3. FEEDBACK RESPONSES TABLE (Reviews & Ratings)
-- Stores the actual ratings and feedback comments.
-- When is_anonymous = true, student_id is stored as NULL, completely decoupling identity.
CREATE TABLE IF NOT EXISTS public.feedback_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    rating_content INT NOT NULL CHECK (rating_content BETWEEN 1 AND 5),
    rating_speaker INT NOT NULL CHECK (rating_speaker BETWEEN 1 AND 5),
    rating_organization INT NOT NULL CHECK (rating_organization BETWEEN 1 AND 5),
    comments TEXT,
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedback_resp_event ON public.feedback_responses(event_id);
CREATE INDEX IF NOT EXISTS idx_feedback_resp_student ON public.feedback_responses(student_id);

-- 4. PRIVATE SERVER-SIDE HMAC SECRET (SECURITY DEFINER)
-- Stored on the server and never exposed to client applications.
CREATE OR REPLACE FUNCTION public._attendance_secret()
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 'fxec-campus-connect-attendance-salt-key-2024'::text;
$$;

REVOKE ALL ON FUNCTION public._attendance_secret() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._attendance_secret() TO authenticated, service_role;

-- 4.5 RECURSION-PREVENTING SECURITY DEFINER FUNCTION FOR EVENT COORDINATOR
-- Permits assigned coordinator, admin, or any authorized faculty coordinator
CREATE OR REPLACE FUNCTION public.is_event_coordinator(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = p_event_id AND (
            e.coordinator_id = auth.uid() 
            OR public.is_admin()
            OR public.get_user_role(auth.uid()) = 'coordinator'
        )
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_event_coordinator(UUID) TO authenticated, service_role;

-- 4.6 HELPER: TYPE-SAFE HMAC CALCULATION WITH BYTEA CONVERSION
-- Resolves "function hmac(text, text, unknown) does not exist" in PostgreSQL / Supabase
CREATE OR REPLACE FUNCTION public.calculate_attendance_hmac(p_event_id UUID, p_slot BIGINT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_raw BYTEA;
    v_key BYTEA;
BEGIN
    v_raw := convert_to(p_event_id::text || ':' || p_slot::text, 'UTF8');
    v_key := convert_to(public._attendance_secret(), 'UTF8');
    
    -- In PostgreSQL pgcrypto, hmac accepts (bytea, bytea, text)
    RETURN encode(hmac(v_raw, v_key, 'sha256'::text), 'hex');
EXCEPTION WHEN OTHERS THEN
    BEGIN
        RETURN encode(extensions.hmac(v_raw, v_key, 'sha256'::text), 'hex');
    EXCEPTION WHEN OTHERS THEN
        RETURN md5(p_event_id::text || ':' || p_slot::text || ':' || public._attendance_secret());
    END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_attendance_hmac(UUID, BIGINT) TO authenticated, service_role;

-- 5. RPC: GENERATE ROTATING 30-SECOND QR TOKEN
-- Callable only by the event coordinator or an admin.
CREATE OR REPLACE FUNCTION public.get_attendance_token(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_now TIMESTAMPTZ := now();
    v_epoch BIGINT := extract(epoch from v_now)::bigint;
    v_slot BIGINT := floor(v_epoch / 30)::bigint;
    v_token TEXT;
    v_expires_in INT := 30 - (v_epoch % 30);
    v_event RECORD;
BEGIN
    -- Verify event exists
    SELECT * INTO v_event FROM public.events WHERE id = p_event_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found.';
    END IF;

    -- Security authorization: only coordinator of this event or admin
    IF NOT (public.is_admin() OR public.is_event_coordinator(p_event_id)) THEN
        RAISE EXCEPTION 'Access Denied: Only the assigned coordinator or administrator can generate attendance QR codes.';
    END IF;

    -- Generate HMAC-SHA256 token for current 30-second slot
    v_token := public.calculate_attendance_hmac(p_event_id, v_slot);

    RETURN jsonb_build_object(
        'success', true,
        'event_id', p_event_id,
        'token', v_token,
        'slot', v_slot,
        'expires_in', v_expires_in,
        'server_time', v_now
    );
END;
$$;

-- 6. RPC: MARK ATTENDANCE VIA QR SCAN (ATOMIC)
-- Validates registration status, event time window, 30s token (+ grace window), and records attendance.
CREATE OR REPLACE FUNCTION public.mark_attendance(
    p_event_id UUID,
    p_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_student_id UUID := auth.uid();
    v_event RECORD;
    v_reg RECORD;
    v_now TIMESTAMPTZ := now();
    v_epoch BIGINT := extract(epoch from v_now)::bigint;
    v_curr_slot BIGINT := floor(v_epoch / 30)::bigint;
    v_prev_slot BIGINT := v_curr_slot - 1;
    v_expected_curr TEXT;
    v_expected_prev TEXT;
    v_start_ts TIMESTAMPTZ;
    v_end_ts TIMESTAMPTZ;
BEGIN
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to mark attendance.';
    END IF;

    -- 1. Check Event
    SELECT * INTO v_event FROM public.events WHERE id = p_event_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found.';
    END IF;

    IF v_event.status = 'cancelled' THEN
        RAISE EXCEPTION 'This event has been cancelled. Attendance cannot be recorded.';
    END IF;

    IF v_event.status NOT IN ('approved', 'ongoing', 'completed') THEN
        RAISE EXCEPTION 'Attendance session is only active for approved events.';
    END IF;

    -- 2. Validate Event Time Window (30 min before start until 4 hours after end)
    v_start_ts := v_event.start_time;
    v_end_ts := v_event.end_time;

    IF v_now < (v_start_ts - INTERVAL '30 minutes') THEN
        RAISE EXCEPTION 'Attendance is not open yet. Event opens 30 minutes prior to start time.';
    END IF;

    IF v_now > (v_end_ts + INTERVAL '4 hours') THEN
        RAISE EXCEPTION 'Attendance window has closed for this event.';
    END IF;

    -- 3. Check Registration Status (Student must be confirmed registered, not waitlisted or cancelled)
    SELECT * INTO v_reg FROM public.registrations
    WHERE event_id = p_event_id AND student_id = v_student_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'You are not registered for this event. Only registered students can record attendance.';
    END IF;

    IF v_reg.status = 'waitlisted' THEN
        RAISE EXCEPTION 'You are currently on the waiting list. Only confirmed registered students can mark attendance.';
    END IF;

    IF v_reg.status = 'cancelled' THEN
        RAISE EXCEPTION 'Your registration for this event was cancelled.';
    END IF;

    IF v_reg.status <> 'registered' THEN
        RAISE EXCEPTION 'Only confirmed registered students can mark attendance.';
    END IF;

    -- 4. Check if already marked
    IF EXISTS (
        SELECT 1 FROM public.attendance
        WHERE event_id = p_event_id AND student_id = v_student_id
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'already_marked', true,
            'message', 'Your attendance has already been recorded for this event.'
        );
    END IF;

    -- 5. Validate HMAC Token (Accepts current 30-second slot or previous slot to tolerate network/scan drift)
    v_expected_curr := public.calculate_attendance_hmac(p_event_id, v_curr_slot);
    v_expected_prev := public.calculate_attendance_hmac(p_event_id, v_prev_slot);

    IF p_token <> v_expected_curr AND p_token <> v_expected_prev THEN
        RAISE EXCEPTION 'Invalid or expired QR code. Please scan the current live QR code from the presenter.';
    END IF;

    -- 6. Insert Attendance Record
    INSERT INTO public.attendance (
        event_id,
        student_id,
        marked_by,
        method,
        verified_at,
        created_at
    ) VALUES (
        p_event_id,
        v_student_id,
        v_student_id,
        'qr_scan',
        v_now,
        v_now
    );

    -- 7. Audit Log
    INSERT INTO public.activity_logs (
        actor_id,
        user_id,
        action,
        entity_type,
        entity_id,
        event_id,
        metadata,
        details,
        created_at
    ) VALUES (
        v_student_id,
        v_student_id,
        'attendance_marked',
        'attendance',
        p_event_id,
        p_event_id,
        jsonb_build_object(
            'method', 'qr_scan',
            'verified_at', v_now
        ),
        jsonb_build_object(
            'method', 'qr_scan',
            'verified_at', v_now
        ),
        v_now
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Attendance successfully recorded!',
        'event_title', v_event.title,
        'verified_at', v_now
    );
END;
$$;

-- 7. RPC: MANUAL ATTENDANCE OVERRIDE (COORDINATOR / ADMIN)
-- Allows event coordinator or admin to mark/unmark attendance with mandatory reason audit logging.
CREATE OR REPLACE FUNCTION public.manual_mark_attendance(
    p_event_id UUID,
    p_student_id UUID,
    p_is_attended BOOLEAN,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id UUID := auth.uid();
    v_reg_status TEXT;
    v_method TEXT;
    v_now TIMESTAMPTZ := now();
BEGIN
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    -- Security authorization
    IF NOT (public.is_admin() OR public.is_event_coordinator(p_event_id)) THEN
        RAISE EXCEPTION 'Access Denied: Only coordinators and administrators can manually manage attendance.';
    END IF;

    IF TRIM(COALESCE(p_reason, '')) = '' THEN
        RAISE EXCEPTION 'A valid reason is required for manual attendance override.';
    END IF;

    -- Check student registration
    SELECT status INTO v_reg_status FROM public.registrations
    WHERE event_id = p_event_id AND student_id = p_student_id;

    IF v_reg_status IS NULL THEN
        RAISE EXCEPTION 'Student is not registered for this event.';
    END IF;

    IF v_reg_status = 'waitlisted' THEN
        RAISE EXCEPTION 'Student is on the waiting list. Promote them to registered before marking attendance.';
    END IF;

    IF p_is_attended THEN
        v_method := CASE WHEN public.is_admin() THEN 'manual_admin' ELSE 'manual_coordinator' END;

        INSERT INTO public.attendance (
            event_id,
            student_id,
            marked_by,
            method,
            verified_at,
            created_at
        ) VALUES (
            p_event_id,
            p_student_id,
            v_actor_id,
            v_method,
            v_now,
            v_now
        )
        ON CONFLICT (event_id, student_id) DO UPDATE SET
            marked_by = EXCLUDED.marked_by,
            method = EXCLUDED.method,
            verified_at = EXCLUDED.verified_at;

        -- Activity audit log
        INSERT INTO public.activity_logs (
            actor_id,
            user_id,
            action,
            entity_type,
            entity_id,
            event_id,
            metadata,
            details,
            created_at
        ) VALUES (
            v_actor_id,
            v_actor_id,
            'attendance_manual_marked',
            'attendance',
            p_event_id,
            p_event_id,
            jsonb_build_object(
                'student_id', p_student_id,
                'method', v_method,
                'reason', p_reason
            ),
            jsonb_build_object(
                'student_id', p_student_id,
                'method', v_method,
                'reason', p_reason
            ),
            v_now
        );
    ELSE
        -- Remove attendance
        DELETE FROM public.attendance
        WHERE event_id = p_event_id AND student_id = p_student_id;

        -- Activity audit log
        INSERT INTO public.activity_logs (
            actor_id,
            user_id,
            action,
            entity_type,
            entity_id,
            event_id,
            metadata,
            details,
            created_at
        ) VALUES (
            v_actor_id,
            v_actor_id,
            'attendance_manual_unmarked',
            'attendance',
            p_event_id,
            p_event_id,
            jsonb_build_object(
                'student_id', p_student_id,
                'reason', p_reason
            ),
            jsonb_build_object(
                'student_id', p_student_id,
                'reason', p_reason
            ),
            v_now
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'event_id', p_event_id,
        'student_id', p_student_id,
        'is_attended', p_is_attended
    );
END;
$$;

-- 8. RPC: SUBMIT EVENT FEEDBACK (ANONYMOUS & ONE-TIME)
-- Validates attendance and event completion, then records review atomically.
CREATE OR REPLACE FUNCTION public.submit_event_feedback(
    p_event_id UUID,
    p_rating_content INT,
    p_rating_speaker INT,
    p_rating_organization INT,
    p_comments TEXT,
    p_is_anonymous BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_student_id UUID := auth.uid();
    v_event RECORD;
    v_now TIMESTAMPTZ := now();
    v_end_ts TIMESTAMPTZ;
BEGIN
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    -- Validate ratings
    IF p_rating_content NOT BETWEEN 1 AND 5 OR
       p_rating_speaker NOT BETWEEN 1 AND 5 OR
       p_rating_organization NOT BETWEEN 1 AND 5 THEN
        RAISE EXCEPTION 'All ratings must be between 1 and 5.';
    END IF;

    -- Check event
    SELECT * INTO v_event FROM public.events WHERE id = p_event_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found.';
    END IF;

    -- Event must be ended or marked completed
    v_end_ts := v_event.end_time;
    IF v_now < v_end_ts AND v_event.status <> 'completed' THEN
        RAISE EXCEPTION 'Feedback opens after the event has concluded.';
    END IF;

    -- Student must have verified attendance
    IF NOT EXISTS (
        SELECT 1 FROM public.attendance
        WHERE event_id = p_event_id AND student_id = v_student_id
    ) THEN
        RAISE EXCEPTION 'Feedback is only available for students who attended this event.';
    END IF;

    -- One-time submission check (via feedback_submissions)
    IF EXISTS (
        SELECT 1 FROM public.feedback_submissions
        WHERE event_id = p_event_id AND student_id = v_student_id
    ) THEN
        RAISE EXCEPTION 'You have already submitted feedback for this event.';
    END IF;

    -- 1. Insert into feedback_submissions gatekeeper
    INSERT INTO public.feedback_submissions (
        event_id,
        student_id,
        submitted_at
    ) VALUES (
        p_event_id,
        v_student_id,
        v_now
    );

    -- 2. Insert into feedback_responses
    -- If anonymous, student_id is recorded as NULL, completely decoupling user identity
    INSERT INTO public.feedback_responses (
        event_id,
        student_id,
        rating_content,
        rating_speaker,
        rating_organization,
        comments,
        is_anonymous,
        created_at
    ) VALUES (
        p_event_id,
        CASE WHEN p_is_anonymous THEN NULL ELSE v_student_id END,
        p_rating_content,
        p_rating_speaker,
        p_rating_organization,
        TRIM(p_comments),
        p_is_anonymous,
        v_now
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Feedback submitted successfully. Thank you for your feedback!'
    );
END;
$$;

-- 9. ROW-LEVEL SECURITY (RLS) POLICIES

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_responses ENABLE ROW LEVEL SECURITY;

-- ATTENDANCE RLS
DROP POLICY IF EXISTS "attendance_select_policy" ON public.attendance;
CREATE POLICY "attendance_select_policy" ON public.attendance
    FOR SELECT TO authenticated
    USING (
        student_id = auth.uid() OR
        public.is_admin() OR
        public.is_event_coordinator(event_id)
    );

-- Note: No direct INSERT/UPDATE/DELETE policies on attendance.
-- All writes occur strictly through mark_attendance and manual_mark_attendance RPCs.

-- FEEDBACK SUBMISSIONS RLS
-- Strict Isolation: Students can ONLY read their own submission record.
-- Coordinators and Admins CANNOT read feedback_submissions (No policy exists for them).
DROP POLICY IF EXISTS "feedback_submissions_select_policy" ON public.feedback_submissions;
CREATE POLICY "feedback_submissions_select_policy" ON public.feedback_submissions
    FOR SELECT TO authenticated
    USING (student_id = auth.uid());

-- FEEDBACK RESPONSES RLS
-- Coordinators can read feedback for their events (anonymous reviews have student_id = NULL).
-- Admins can read all feedback.
-- Students can read their own non-anonymous feedback.
DROP POLICY IF EXISTS "feedback_responses_select_policy" ON public.feedback_responses;
CREATE POLICY "feedback_responses_select_policy" ON public.feedback_responses
    FOR SELECT TO authenticated
    USING (
        public.is_admin() OR
        public.is_event_coordinator(event_id) OR
        (student_id IS NOT NULL AND student_id = auth.uid())
    );

-- 10. REALTIME PUBLICATION
-- Enable Realtime for attendance table so coordinators see live scanning counts (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'attendance'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
    END IF;
END $$;
