-- ==============================================================================
-- CAMPUS CONNECT - GUEST LECTURE & EVENT MANAGEMENT SYSTEM
-- Patented & Engineered by: Krishna Raja V (Krish) <v.rajavenkatesh17@gmail.com>
-- Institution: Francis Xavier Engineering College (FXEC)
-- Intellectual Property Protection: KRISH-FXEC-PATENT-2026-CC-AUTH
-- All Rights Reserved. Unauthorized copying or redistribution is prohibited.
-- ==============================================================================
-- Migration: 004_reward_points_and_certificates.sql
-- Description: Phase 4 Implementation:
--              1. App Settings Table (Per-event points cap, feedback requirement for certs)
--              2. Append-Only Points Ledger (No UPDATE/DELETE policies)
--              3. Coordinator Point Awarding RPC (award_points) with per-event cap check
--              4. Admin Point Adjustment RPC (admin_adjust_points)
--              5. Privacy-Preserving Leaderboard RPC (get_leaderboard)
--              6. Server-Side Certificate Issuance RPC (issue_certificate) with duplicate prevention
--              7. Public Certificate Verification RPC (verify_certificate) for anon access
--              8. Strict Server-Side RLS Policies
-- ==============================================================================

-- 1. APP SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

INSERT INTO public.app_settings (key, value, description)
VALUES 
    ('points_per_event_cap', '100'::jsonb, 'Maximum bonus interaction points a coordinator can award to one student per event'),
    ('certificate_requires_feedback', 'true'::jsonb, 'Whether a student must submit event feedback before a certificate can be issued')
ON CONFLICT (key) DO NOTHING;

-- 2. APPEND-ONLY POINTS LEDGER
CREATE TABLE IF NOT EXISTS public.points_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    awarded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN (
        'attendance', 
        'feedback', 
        'asked_question', 
        'answered_question', 
        'discussion', 
        'admin_adjustment', 
        'other'
    )),
    points INT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_points_ledger_student ON public.points_ledger(student_id);
CREATE INDEX IF NOT EXISTS idx_points_ledger_event ON public.points_ledger(event_id);
CREATE INDEX IF NOT EXISTS idx_points_ledger_created ON public.points_ledger(created_at);

-- 3. CERTIFICATES TABLE
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    certificate_code TEXT UNIQUE NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT uq_event_student_certificate UNIQUE (event_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_certificates_student ON public.certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_event ON public.certificates(event_id);
CREATE INDEX IF NOT EXISTS idx_certificates_code ON public.certificates(certificate_code);

-- 4. RPC: AWARD BONUS POINTS (COORDINATOR)
-- Callable only by the event coordinator or admin.
-- Student must have attended; category must be valid; reason mandatory; cap enforced.
CREATE OR REPLACE FUNCTION public.award_points(
    p_event_id UUID,
    p_student_id UUID,
    p_category TEXT,
    p_points INT,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id UUID := auth.uid();
    v_cap INT := 100;
    v_current_total INT := 0;
    v_event RECORD;
    v_student RECORD;
BEGIN
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    -- Security authorization
    IF NOT (public.is_admin() OR public.is_event_coordinator(p_event_id)) THEN
        RAISE EXCEPTION 'Access Denied: Only event coordinators and administrators can award interaction points.';
    END IF;

    -- Validate Category
    IF p_category NOT IN ('asked_question', 'answered_question', 'discussion', 'other') THEN
        RAISE EXCEPTION 'Invalid category. Must be asked_question, answered_question, discussion, or other.';
    END IF;

    -- Validate Points
    IF p_points <= 0 THEN
        RAISE EXCEPTION 'Points awarded must be greater than zero.';
    END IF;

    -- Validate Reason
    IF TRIM(COALESCE(p_reason, '')) = '' THEN
        RAISE EXCEPTION 'A clear reason for awarding points is mandatory.';
    END IF;

    -- Verify event
    SELECT * INTO v_event FROM public.events WHERE id = p_event_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found.';
    END IF;

    -- Verify student attended the event
    IF NOT EXISTS (
        SELECT 1 FROM public.attendance
        WHERE event_id = p_event_id AND student_id = p_student_id
    ) THEN
        RAISE EXCEPTION 'Points can only be awarded to students who have verified attendance for this event.';
    END IF;

    -- Fetch cap from app_settings
    SELECT COALESCE((value)::int, 100) INTO v_cap
    FROM public.app_settings
    WHERE key = 'points_per_event_cap';

    -- Compute current bonus points awarded to this student for this event
    SELECT COALESCE(SUM(points), 0) INTO v_current_total
    FROM public.points_ledger
    WHERE event_id = p_event_id 
      AND student_id = p_student_id
      AND category IN ('asked_question', 'answered_question', 'discussion', 'other');

    IF (v_current_total + p_points) > v_cap THEN
        RAISE EXCEPTION 'Exceeds cap: This student already has % bonus points for this event. Maximum allowed is % points.',
            v_current_total, v_cap;
    END IF;

    -- Insert into append-only points ledger
    INSERT INTO public.points_ledger (
        student_id,
        event_id,
        awarded_by,
        category,
        points,
        reason,
        created_at
    ) VALUES (
        p_student_id,
        p_event_id,
        v_actor_id,
        p_category,
        p_points,
        TRIM(p_reason),
        now()
    );

    -- Notify student
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        event_id
    ) VALUES (
        p_student_id,
        'Reward Points Awarded! (+' || p_points || ' pts)',
        'You earned ' || p_points || ' bonus points in "' || v_event.title || '" for: ' || p_reason,
        'points_awarded',
        p_event_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'points_awarded', p_points,
        'total_bonus_for_event', v_current_total + p_points,
        'cap', v_cap
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_points(UUID, UUID, TEXT, INT, TEXT) TO authenticated, service_role;

-- 5. RPC: ADMIN POINT CORRECTION (ADMIN ONLY)
-- Append-only: Corrections are negative or positive entries signed by admin.
CREATE OR REPLACE FUNCTION public.admin_adjust_points(
    p_student_id UUID,
    p_points INT,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Only administrators can create point adjustments.';
    END IF;

    IF TRIM(COALESCE(p_reason, '')) = '' THEN
        RAISE EXCEPTION 'A justification reason is required for administrator point adjustments.';
    END IF;

    INSERT INTO public.points_ledger (
        student_id,
        awarded_by,
        category,
        points,
        reason,
        created_at
    ) VALUES (
        p_student_id,
        auth.uid(),
        'admin_adjustment',
        p_points,
        TRIM(p_reason),
        now()
    );

    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type
    ) VALUES (
        p_student_id,
        'Points Adjustment (' || CASE WHEN p_points > 0 THEN '+' || p_points ELSE p_points::text END || ' pts)',
        'An administrative point adjustment was made: ' || p_reason,
        'points_adjusted'
    );

    RETURN jsonb_build_object(
        'success', true,
        'adjusted_points', p_points
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_adjust_points(UUID, INT, TEXT) TO authenticated, service_role;

-- 6. RPC: PRIVACY-PRESERVING LEADERBOARD
-- Exposes ONLY rank, name, department_code, total_points. Never emails or phone numbers.
CREATE OR REPLACE FUNCTION public.get_leaderboard(
    p_department_id UUID DEFAULT NULL,
    p_limit INT DEFAULT 50
)
RETURNS TABLE (
    leaderboard_rank BIGINT,
    student_id UUID,
    student_name TEXT,
    department_code TEXT,
    total_points BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    WITH student_totals AS (
        SELECT 
            p.id as student_id,
            p.name as student_name,
            d.code as department_code,
            COALESCE(SUM(l.points), 0)::BIGINT as total_points
        FROM public.profiles p
        LEFT JOIN public.departments d ON d.id = p.department_id
        LEFT JOIN public.points_ledger l ON l.student_id = p.id
        WHERE p.role = 'student'
          AND (p_department_id IS NULL OR p.department_id = p_department_id)
        GROUP BY p.id, p.name, d.code
    )
    SELECT 
        DENSE_RANK() OVER (ORDER BY total_points DESC, student_name ASC) as leaderboard_rank,
        student_id,
        student_name,
        COALESCE(department_code, 'FXEC') as department_code,
        total_points
    FROM student_totals
    ORDER BY total_points DESC, student_name ASC
    LIMIT LEAST(p_limit, 100);
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard(UUID, INT) TO anon, authenticated, service_role;

-- 7. RPC: SERVER-SIDE CERTIFICATE ISSUANCE (ATOMIC)
-- Checks attendance, feedback requirement, event completion, and prevents duplicates.
CREATE OR REPLACE FUNCTION public.issue_certificate(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_student_id UUID := auth.uid();
    v_event RECORD;
    v_requires_feedback BOOLEAN := true;
    v_existing_code TEXT;
    v_new_code TEXT;
    v_cert_id UUID;
BEGIN
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to receive certificates.';
    END IF;

    -- 1. Check if already issued
    SELECT id, certificate_code INTO v_cert_id, v_existing_code
    FROM public.certificates
    WHERE event_id = p_event_id AND student_id = v_student_id;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'already_issued', true,
            'certificate_id', v_cert_id,
            'certificate_code', v_existing_code,
            'message', 'Certificate already issued.'
        );
    END IF;

    -- 2. Verify Event Exists & Status
    SELECT * INTO v_event FROM public.events WHERE id = p_event_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found.';
    END IF;

    -- Event must have concluded
    IF now() < v_event.end_time AND v_event.status <> 'completed' THEN
        RAISE EXCEPTION 'Certificates are issued only after the event has concluded.';
    END IF;

    -- 3. Verify Student Attendance
    IF NOT EXISTS (
        SELECT 1 FROM public.attendance
        WHERE event_id = p_event_id AND student_id = v_student_id
    ) THEN
        RAISE EXCEPTION 'Eligibility failed: Attendance verification is required for certificate issuance.';
    END IF;

    -- 4. Check Feedback Requirement from app_settings
    SELECT COALESCE((value)::boolean, true) INTO v_requires_feedback
    FROM public.app_settings
    WHERE key = 'certificate_requires_feedback';

    IF v_requires_feedback THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.feedback_submissions
            WHERE event_id = p_event_id AND student_id = v_student_id
        ) THEN
            RAISE EXCEPTION 'Eligibility failed: Please submit your feedback review for this session before claiming your certificate.';
        END IF;
    END IF;

    -- 5. Generate Random Unique Certificate Code: FXEC-YYYY-XXXX-XXXX
    v_new_code := 'FXEC-' || to_char(now(), 'YYYY') || '-' || 
                  upper(substring(md5(gen_random_uuid()::text) from 1 for 4)) || '-' || 
                  upper(substring(md5(gen_random_uuid()::text) from 5 for 4));

    -- 6. Insert Certificate (Unique constraint prevents duplicates)
    INSERT INTO public.certificates (
        event_id,
        student_id,
        certificate_code,
        issued_at
    ) VALUES (
        p_event_id,
        v_student_id,
        v_new_code,
        now()
    )
    RETURNING id INTO v_cert_id;

    -- 7. Notify Student
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        event_id
    ) VALUES (
        v_student_id,
        'Certificate Available!',
        'Your official certificate for "' || v_event.title || '" is ready for download.',
        'certificate_issued',
        p_event_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'already_issued', false,
        'certificate_id', v_cert_id,
        'certificate_code', v_new_code,
        'message', 'Certificate issued successfully!'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.issue_certificate(UUID) TO authenticated, service_role;

-- 8. RPC: PUBLIC CERTIFICATE VERIFICATION (ANON ACCESSIBLE)
-- Public URL /verify/:code uses this function to verify authenticity without disclosing private student emails.
CREATE OR REPLACE FUNCTION public.verify_certificate(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cert RECORD;
BEGIN
    SELECT 
        c.certificate_code,
        c.issued_at,
        p.name as student_name,
        d.code as department_code,
        d.name as department_name,
        e.title as event_title,
        e.start_time,
        e.end_time,
        s.name as speaker_name,
        s.designation as speaker_designation,
        s.company as speaker_company
    INTO v_cert
    FROM public.certificates c
    JOIN public.profiles p ON p.id = c.student_id
    LEFT JOIN public.departments d ON d.id = p.department_id
    JOIN public.events e ON e.id = c.event_id
    LEFT JOIN public.speakers s ON s.id = e.speaker_id
    WHERE c.certificate_code = TRIM(p_code);

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'valid', false,
            'message', 'No valid certificate found with this credential code.'
        );
    END IF;

    RETURN jsonb_build_object(
        'valid', true,
        'certificate_code', v_cert.certificate_code,
        'student_name', v_cert.student_name,
        'department', COALESCE(v_cert.department_code, 'Engineering'),
        'event_title', v_cert.event_title,
        'event_date', v_cert.start_time,
        'speaker_name', v_cert.speaker_name,
        'speaker_designation', v_cert.speaker_designation,
        'speaker_company', v_cert.speaker_company,
        'issued_at', v_cert.issued_at,
        'institution', 'Francis Xavier Engineering College (Autonomous)'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_certificate(TEXT) TO anon, authenticated, service_role;

-- 9. STRICT RLS POLICIES FOR POINTS & CERTIFICATES

-- POINTS LEDGER: STRICTLY APPEND-ONLY (No UPDATE or DELETE policies)
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "points_ledger_select_policy" ON public.points_ledger;
CREATE POLICY "points_ledger_select_policy" ON public.points_ledger
    FOR SELECT TO authenticated
    USING (
        student_id = auth.uid() OR
        public.is_admin() OR
        (event_id IS NOT NULL AND public.is_event_coordinator(event_id))
    );

-- CERTIFICATES RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "certificates_select_policy" ON public.certificates;
CREATE POLICY "certificates_select_policy" ON public.certificates
    FOR SELECT TO authenticated
    USING (
        student_id = auth.uid() OR
        public.is_admin() OR
        public.is_event_coordinator(event_id)
    );

-- APP SETTINGS RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_settings_read" ON public.app_settings;
CREATE POLICY "app_settings_read" ON public.app_settings
    FOR SELECT TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "app_settings_admin_manage" ON public.app_settings;
CREATE POLICY "app_settings_admin_manage" ON public.app_settings
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
