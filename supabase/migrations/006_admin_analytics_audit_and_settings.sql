-- ==============================================================================
-- CAMPUS CONNECT — FXEC Autonomous Event Management System
-- Architected & Patented by Krish & Ihsan. All Rights Reserved.
-- Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
-- ==============================================================================
-- Migration: 006_admin_analytics_audit_and_settings.sql
-- Description: Phase 6 Implementation:
--              1. Activity Logs Append-Only Policies & Logging Triggers
--              2. User Deactivation & Immediate RLS Session Invalidation
--              3. High-Performance Analytics Indexes
--              4. Admin Security Definer Analytics RPC (admin_get_analytics)
--              5. Anonymous Feedback Aggregation RPC (admin_get_feedback_report)
--              6. Activity Logs Query RPC with Filtering (admin_get_activity_logs)
--              7. Admin Allowlist & Settings Management RPCs
-- ==============================================================================

-- ==============================================================================
-- 0. SCHEMA PREREQUISITES (Self-healing & Idempotent Table Guarantees)
-- Ensures all referenced relations exist even if migrations are executed out-of-order
-- ==============================================================================
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

CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

INSERT INTO public.app_settings (key, value, description)
VALUES 
    ('points_per_event_cap', '100'::jsonb, 'Maximum bonus interaction points a coordinator can award to one student per event'),
    ('certificate_requires_feedback', 'true'::jsonb, 'Whether a student must submit event feedback before a certificate can be issued'),
    ('departments_list', '["CSE", "IT", "AIDS", "CSBS", "ECE", "EEE", "MECH", "CIVIL", "MBA", "MCA"]'::jsonb, 'List of active academic departments')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL DEFAULT 'system',
    entity_id UUID,
    event_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS entity_type TEXT NOT NULL DEFAULT 'system';
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS event_id UUID;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.feedback_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    submitted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT uq_event_student_feedback UNIQUE (event_id, student_id)
);

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

-- 1. HIGH-PERFORMANCE ANALYTICS & AUDIT INDEXES
CREATE INDEX IF NOT EXISTS idx_events_status_start_end ON public.events(status, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_events_coordinator ON public.events(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event_status ON public.registrations(event_id, status);
CREATE INDEX IF NOT EXISTS idx_attendance_event_verified ON public.attendance(event_id, verified_at);
CREATE INDEX IF NOT EXISTS idx_attendance_student_event ON public.attendance(student_id, event_id);
CREATE INDEX IF NOT EXISTS idx_feedback_sub_event_student ON public.feedback_submissions(event_id, student_id);
CREATE INDEX IF NOT EXISTS idx_feedback_resp_event_ratings ON public.feedback_responses(event_id, rating_content, rating_speaker, rating_organization);
CREATE INDEX IF NOT EXISTS idx_points_ledger_student_cat ON public.points_ledger(student_id, category);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_created ON public.activity_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor ON public.activity_logs(actor_id);

-- 2. USER DEACTIVATION & SESSION ENFORCEMENT
-- Ensure is_active column exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Update is_admin() and is_coordinator() to strictly check is_active = true
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT role = 'admin' AND is_active = true 
         FROM public.profiles 
         WHERE id = auth.uid() 
         LIMIT 1), 
        false
    );
$$;

CREATE OR REPLACE FUNCTION public.is_coordinator()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT role IN ('coordinator', 'admin') AND is_active = true 
         FROM public.profiles 
         WHERE id = auth.uid() 
         LIMIT 1), 
        false
    );
$$;

CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT role = 'student' AND is_active = true 
         FROM public.profiles 
         WHERE id = auth.uid() 
         LIMIT 1), 
        false
    );
$$;

-- Global helper to check if current authenticated user is active
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT is_active 
         FROM public.profiles 
         WHERE id = auth.uid() 
         LIMIT 1), 
        false
    );
$$;

-- Enforce active account requirement on core RLS policies
DROP POLICY IF EXISTS "events_insert_policy" ON public.events;
CREATE POLICY "events_insert_policy"
    ON public.events FOR INSERT
    TO authenticated
    WITH CHECK (public.is_coordinator() AND public.is_active_user());

DROP POLICY IF EXISTS "registrations_insert_policy" ON public.registrations;
CREATE POLICY "registrations_insert_policy"
    ON public.registrations FOR INSERT
    TO authenticated
    WITH CHECK (
        student_id = auth.uid() AND 
        public.is_active_user() AND
        (public.is_admin() OR public.is_student())
    );

-- 3. ACTIVITY LOGS APPEND-ONLY RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_logs_admin_select" ON public.activity_logs;
CREATE POLICY "activity_logs_admin_select"
    ON public.activity_logs FOR SELECT
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "activity_logs_insert_authenticated" ON public.activity_logs;
CREATE POLICY "activity_logs_insert_authenticated"
    ON public.activity_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Zero update or delete policies (strict append-only)
DROP POLICY IF EXISTS "activity_logs_update" ON public.activity_logs;
DROP POLICY IF EXISTS "activity_logs_delete" ON public.activity_logs;

-- 4. RPC: ADMIN TOGGLE USER ACTIVE STATUS (DEACTIVATE / REACTIVATE)
CREATE OR REPLACE FUNCTION public.admin_toggle_user_status(
    p_user_id UUID,
    p_is_active BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_target RECORD;
    v_admin_id UUID := auth.uid();
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Only administrators can modify user status.';
    END IF;

    IF p_user_id = v_admin_id AND p_is_active = false THEN
        RAISE EXCEPTION 'Safety Violation: You cannot deactivate your own administrator account.';
    END IF;

    SELECT * INTO v_target FROM public.profiles WHERE id = p_user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found.';
    END IF;

    PERFORM set_config('app.role_change_authorized', 'true', true);

    UPDATE public.profiles
    SET is_active = p_is_active,
        updated_at = now()
    WHERE id = p_user_id;

    -- Write to activity_logs
    INSERT INTO public.activity_logs (
        actor_id,
        action,
        entity_type,
        entity_id,
        user_id,
        metadata,
        created_at
    ) VALUES (
        v_admin_id,
        CASE WHEN p_is_active THEN 'USER_REACTIVATED' ELSE 'USER_DEACTIVATED' END,
        'profile',
        p_user_id,
        p_user_id,
        jsonb_build_object(
            'target_name', v_target.name,
            'target_email', v_target.email,
            'target_role', v_target.role,
            'new_status', CASE WHEN p_is_active THEN 'active' ELSE 'deactivated' END
        ),
        now()
    );

    RETURN jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'is_active', p_is_active
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_toggle_user_status(UUID, BOOLEAN) TO authenticated, service_role;

-- 5. RPC: ADMIN MANAGE ALLOWLIST (ADMINS & COORDINATORS)
CREATE OR REPLACE FUNCTION public.admin_manage_allowlist(
    p_type TEXT, -- 'admin' | 'coordinator'
    p_action TEXT, -- 'add' | 'remove'
    p_email TEXT,
    p_notes TEXT DEFAULT NULL,
    p_dept_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email TEXT := LOWER(TRIM(p_email));
    v_admin_id UUID := auth.uid();
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Administrator authorization required.';
    END IF;

    IF v_email = '' OR v_email NOT LIKE '%@%' THEN
        RAISE EXCEPTION 'A valid email address is required.';
    END IF;

    IF p_type = 'admin' THEN
        IF p_action = 'add' THEN
            INSERT INTO public.admins (email, notes)
            VALUES (v_email, COALESCE(p_notes, 'Added by Administrator'))
            ON CONFLICT (email) DO UPDATE SET notes = EXCLUDED.notes;

            -- If profile already exists, promote role
            PERFORM set_config('app.role_change_authorized', 'true', true);
            UPDATE public.profiles SET role = 'admin', is_active = true WHERE LOWER(TRIM(email)) = v_email;
        ELSIF p_action = 'remove' THEN
            IF v_email = LOWER(TRIM((SELECT email FROM public.profiles WHERE id = v_admin_id))) THEN
                RAISE EXCEPTION 'You cannot remove yourself from the admin allowlist.';
            END IF;
            DELETE FROM public.admins WHERE LOWER(TRIM(email)) = v_email;
        END IF;
    ELSIF p_type = 'coordinator' THEN
        IF p_action = 'add' THEN
            INSERT INTO public.coordinators (email, department_code, notes)
            VALUES (v_email, p_dept_code, COALESCE(p_notes, 'Pre-authorized faculty coordinator'))
            ON CONFLICT (email) DO UPDATE 
            SET department_code = COALESCE(EXCLUDED.department_code, public.coordinators.department_code),
                notes = EXCLUDED.notes;

            PERFORM set_config('app.role_change_authorized', 'true', true);
            UPDATE public.profiles SET role = 'coordinator', is_active = true WHERE LOWER(TRIM(email)) = v_email;
        ELSIF p_action = 'remove' THEN
            DELETE FROM public.coordinators WHERE LOWER(TRIM(email)) = v_email;
        END IF;
    ELSE
        RAISE EXCEPTION 'Invalid type: must be admin or coordinator.';
    END IF;

    INSERT INTO public.activity_logs (
        actor_id, action, entity_type, metadata, created_at
    ) VALUES (
        v_admin_id,
        UPPER(p_type || '_ALLOWLIST_' || p_action),
        'allowlist',
        jsonb_build_object('email', v_email, 'notes', p_notes),
        now()
    );

    RETURN jsonb_build_object('success', true, 'type', p_type, 'action', p_action, 'email', v_email);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_manage_allowlist(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- 6. RPC: ADMIN UPDATE SETTINGS
-- Initialize default departments_list setting
INSERT INTO public.app_settings (key, value, description, updated_at)
VALUES 
    ('departments_list', '["CSE", "IT", "AI&DS", "CSBS", "ECE", "EEE", "MECH", "CIVIL", "MBA", "MCA"]'::jsonb, 'Institutional Departments Allowlist', now())
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.admin_update_settings(
    p_points_cap INT,
    p_cert_requires_feedback BOOLEAN,
    p_departments_list JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Only administrators can update platform settings.';
    END IF;

    IF p_points_cap <= 0 THEN
        RAISE EXCEPTION 'Points cap must be greater than zero.';
    END IF;

    INSERT INTO public.app_settings (key, value, description, updated_at)
    VALUES 
        ('points_per_event_cap', to_jsonb(p_points_cap), 'Maximum bonus interaction points per event', now()),
        ('certificate_requires_feedback', to_jsonb(p_cert_requires_feedback), 'Whether feedback is mandatory for certificates', now())
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value, updated_at = now();

    IF p_departments_list IS NOT NULL THEN
        INSERT INTO public.app_settings (key, value, description, updated_at)
        VALUES ('departments_list', p_departments_list, 'Institutional Departments Allowlist', now())
        ON CONFLICT (key) DO UPDATE
        SET value = EXCLUDED.value, updated_at = now();
    END IF;

    INSERT INTO public.activity_logs (actor_id, action, entity_type, metadata, created_at)
    VALUES (
        auth.uid(),
        'SETTINGS_UPDATED',
        'app_settings',
        jsonb_build_object(
            'points_cap', p_points_cap, 
            'cert_requires_feedback', p_cert_requires_feedback,
            'departments_updated', p_departments_list IS NOT NULL
        ),
        now()
    );

    RETURN jsonb_build_object(
        'success', true, 
        'points_cap', p_points_cap, 
        'cert_requires_feedback', p_cert_requires_feedback,
        'departments_list', p_departments_list
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_settings(INT, BOOLEAN, JSONB) TO authenticated, service_role;

-- 7. RPC: GET DASHBOARD ANALYTICS (SECURITY DEFINER, ADMIN ONLY)
CREATE OR REPLACE FUNCTION public.admin_get_analytics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_now TIMESTAMPTZ := now();
    v_summary JSONB;
    v_dept_participation JSONB;
    v_event_rates JSONB;
    v_monthly_trend JSONB;
    v_feedback_summary JSONB;
    v_top_students JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Administrator role required to view analytics.';
    END IF;

    -- 1. Summary Cards
    SELECT jsonb_build_object(
        'total_students', (SELECT COUNT(*) FROM public.profiles WHERE role = 'student'),
        'total_coordinators', (SELECT COUNT(*) FROM public.profiles WHERE role = 'coordinator'),
        'total_admins', (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin'),
        'total_events', (SELECT COUNT(*) FROM public.events),
        'ongoing_events', (SELECT COUNT(*) FROM public.events WHERE status = 'approved' AND v_now BETWEEN start_time AND end_time),
        'upcoming_events', (SELECT COUNT(*) FROM public.events WHERE status = 'approved' AND start_time > v_now),
        'completed_events', (SELECT COUNT(*) FROM public.events WHERE status = 'completed' OR (status = 'approved' AND end_time <= v_now)),
        'total_attendance', (SELECT COUNT(*) FROM public.attendance),
        'total_feedback_reviews', (SELECT COUNT(*) FROM public.feedback_submissions),
        'total_points_distributed', (SELECT COALESCE(SUM(points), 0) FROM public.points_ledger)
    ) INTO v_summary;

    -- 2. Department-wise Participation
    SELECT COALESCE(jsonb_agg(dept_data), '[]'::jsonb)
    INTO v_dept_participation
    FROM (
        SELECT 
            d.code as department_code,
            d.name as department_name,
            COUNT(DISTINCT p.id) as student_count,
            COUNT(DISTINCT r.id) as registration_count,
            COUNT(DISTINCT a.id) as attendance_count,
            COALESCE(SUM(l.points), 0) as points_earned
        FROM public.departments d
        LEFT JOIN public.profiles p ON p.department_id = d.id AND p.role = 'student'
        LEFT JOIN public.registrations r ON r.student_id = p.id
        LEFT JOIN public.attendance a ON a.student_id = p.id
        LEFT JOIN public.points_ledger l ON l.student_id = p.id
        GROUP BY d.id, d.code, d.name
        ORDER BY attendance_count DESC, student_count DESC
    ) dept_data;

    -- 3. Event-wise Attendance Percentage
    SELECT COALESCE(jsonb_agg(evt_data), '[]'::jsonb)
    INTO v_event_rates
    FROM (
        SELECT 
            e.id,
            e.title,
            to_char(e.start_time AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY') as event_date,
            e.seat_capacity,
            e.registered_count,
            COUNT(a.id) as attended_count,
            ROUND(
                (COUNT(a.id)::numeric / GREATEST(e.registered_count, 1)::numeric) * 100, 
                1
            ) as attendance_pct
        FROM public.events e
        LEFT JOIN public.attendance a ON a.event_id = e.id
        WHERE e.status IN ('approved', 'completed')
        GROUP BY e.id, e.title, e.start_time, e.seat_capacity, e.registered_count
        ORDER BY e.start_time DESC
        LIMIT 15
    ) evt_data;

    -- 4. Monthly Events Trend (Last 6 Months)
    SELECT COALESCE(jsonb_agg(month_data), '[]'::jsonb)
    INTO v_monthly_trend
    FROM (
        SELECT 
            to_char(date_trunc('month', e.start_time), 'Mon YYYY') as month_label,
            date_trunc('month', e.start_time) as month_sort,
            COUNT(DISTINCT e.id) as events_count,
            COUNT(DISTINCT a.id) as attendance_count
        FROM public.events e
        LEFT JOIN public.attendance a ON a.event_id = e.id
        WHERE e.start_time >= (v_now - INTERVAL '6 months')
          AND e.status IN ('approved', 'completed')
        GROUP BY date_trunc('month', e.start_time), to_char(date_trunc('month', e.start_time), 'Mon YYYY')
        ORDER BY month_sort ASC
    ) month_data;

    -- 5. Feedback Ratings Summary (Average across Content, Speaker & Organization)
    SELECT jsonb_build_object(
        'average_rating', COALESCE((
            SELECT ROUND(AVG((rating_content + rating_speaker + rating_organization)::numeric / 3.0), 2)
            FROM public.feedback_responses
        ), 0),
        'total_responses', (SELECT COUNT(*) FROM public.feedback_responses),
        'distribution', COALESCE((
            SELECT jsonb_agg(jsonb_build_object('rating', star_val, 'count', COALESCE(counts.cnt, 0)))
            FROM generate_series(1, 5) AS star_val
            LEFT JOIN (
                SELECT ROUND((rating_content + rating_speaker + rating_organization)::numeric / 3.0) as rounded_star, COUNT(*) as cnt 
                FROM public.feedback_responses 
                GROUP BY ROUND((rating_content + rating_speaker + rating_organization)::numeric / 3.0)
            ) counts ON counts.rounded_star = star_val
        ), '[]'::jsonb)
    ) INTO v_feedback_summary;

    -- 6. Most Active Students (Top 10)
    SELECT COALESCE(jsonb_agg(top_stu), '[]'::jsonb)
    INTO v_top_students
    FROM (
        SELECT 
            p.name as student_name,
            d.code as department_code,
            COUNT(DISTINCT a.id) as events_attended,
            COALESCE(SUM(l.points), 0) as total_points
        FROM public.profiles p
        JOIN public.departments d ON d.id = p.department_id
        LEFT JOIN public.attendance a ON a.student_id = p.id
        LEFT JOIN public.points_ledger l ON l.student_id = p.id
        WHERE p.role = 'student'
        GROUP BY p.id, p.name, d.code
        ORDER BY total_points DESC, events_attended DESC
        LIMIT 10
    ) top_stu;

    RETURN jsonb_build_object(
        'success', true,
        'summary', v_summary,
        'department_participation', v_dept_participation,
        'event_attendance_rates', v_event_rates,
        'monthly_trend', v_monthly_trend,
        'feedback_summary', v_feedback_summary,
        'top_active_students', v_top_students,
        'generated_at', v_now
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_analytics() TO authenticated, service_role;

-- 8. RPC: ANONYMOUS FEEDBACK REPORT (ADMIN ONLY)
-- Returns aggregated ratings and anonymous comments per event or overall.
-- Never reveals student names, emails, or student IDs.
CREATE OR REPLACE FUNCTION public.admin_get_feedback_report(p_event_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_avg_rating NUMERIC;
    v_total_submissions INT;
    v_criteria_breakdown JSONB;
    v_anonymous_comments JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Administrator role required.';
    END IF;

    -- Average Rating across Content, Speaker, and Organization
    SELECT 
        COALESCE(ROUND(AVG((fr.rating_content + fr.rating_speaker + fr.rating_organization)::numeric / 3.0), 2), 0),
        COUNT(DISTINCT fr.id)
    INTO v_avg_rating, v_total_submissions
    FROM public.feedback_responses fr
    WHERE (p_event_id IS NULL OR fr.event_id = p_event_id);

    -- Question Criteria Breakdown (Content Quality, Keynote Speaker, Event Organization)
    SELECT jsonb_build_array(
        jsonb_build_object(
            'question_key', 'content_quality',
            'avg_score', COALESCE((SELECT ROUND(AVG(rating_content)::numeric, 2) FROM public.feedback_responses WHERE p_event_id IS NULL OR event_id = p_event_id), 0),
            'total_responses', (SELECT COUNT(*) FROM public.feedback_responses WHERE p_event_id IS NULL OR event_id = p_event_id)
        ),
        jsonb_build_object(
            'question_key', 'speaker_delivery',
            'avg_score', COALESCE((SELECT ROUND(AVG(rating_speaker)::numeric, 2) FROM public.feedback_responses WHERE p_event_id IS NULL OR event_id = p_event_id), 0),
            'total_responses', (SELECT COUNT(*) FROM public.feedback_responses WHERE p_event_id IS NULL OR event_id = p_event_id)
        ),
        jsonb_build_object(
            'question_key', 'event_organization',
            'avg_score', COALESCE((SELECT ROUND(AVG(rating_organization)::numeric, 2) FROM public.feedback_responses WHERE p_event_id IS NULL OR event_id = p_event_id), 0),
            'total_responses', (SELECT COUNT(*) FROM public.feedback_responses WHERE p_event_id IS NULL OR event_id = p_event_id)
        )
    ) INTO v_criteria_breakdown;

    -- Anonymous Comments (strictly NO student IDs or names)
    SELECT COALESCE(jsonb_agg(comm_data), '[]'::jsonb)
    INTO v_anonymous_comments
    FROM (
        SELECT 
            e.title as event_title,
            fr.comments as comment,
            ROUND((fr.rating_content + fr.rating_speaker + fr.rating_organization)::numeric / 3.0, 1) as rating,
            fr.created_at
        FROM public.feedback_responses fr
        JOIN public.events e ON e.id = fr.event_id
        WHERE (p_event_id IS NULL OR fr.event_id = p_event_id)
          AND fr.comments IS NOT NULL 
          AND TRIM(fr.comments) <> ''
        ORDER BY fr.created_at DESC
        LIMIT 50
    ) comm_data;

    RETURN jsonb_build_object(
        'success', true,
        'event_id', p_event_id,
        'average_rating', v_avg_rating,
        'total_submissions', v_total_submissions,
        'criteria_breakdown', v_criteria_breakdown,
        'anonymous_comments', v_anonymous_comments
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_feedback_report(UUID) TO authenticated, service_role;

-- 9. RPC: GET FILTERED ACTIVITY LOGS (ADMIN ONLY)
-- Filterable by action, actor, and date range
CREATE OR REPLACE FUNCTION public.admin_get_activity_logs(
    p_limit INT DEFAULT 100,
    p_action TEXT DEFAULT NULL,
    p_actor TEXT DEFAULT NULL,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    action TEXT,
    entity_type TEXT,
    entity_id UUID,
    event_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ,
    actor_name TEXT,
    actor_email TEXT,
    actor_role TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        l.id,
        l.action,
        l.entity_type,
        l.entity_id,
        l.event_id,
        COALESCE(l.metadata, '{}'::jsonb) as metadata,
        l.created_at,
        COALESCE(p.name, 'System') as actor_name,
        COALESCE(p.email, 'system@fxec.ac.in') as actor_email,
        COALESCE(p.role, 'system') as actor_role
    FROM public.activity_logs l
    LEFT JOIN public.profiles p ON p.id = l.actor_id
    WHERE public.is_admin()
      AND (p_action IS NULL OR l.action ILIKE '%' || p_action || '%')
      AND (p_actor IS NULL OR p.name ILIKE '%' || p_actor || '%' OR p.email ILIKE '%' || p_actor || '%')
      AND (p_start_date IS NULL OR l.created_at >= p_start_date)
      AND (p_end_date IS NULL OR l.created_at <= p_end_date)
    ORDER BY l.created_at DESC
    LIMIT LEAST(p_limit, 500);
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_activity_logs(INT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated, service_role;

-- 10. AUTOMATIC ACTIVITY LOGGING TRIGGERS (ROLE APPROVAL & POINTS AWARDS)
-- A. Trigger for Coordinator Role Request Approval / Rejection
CREATE OR REPLACE FUNCTION public.handle_coordinator_request_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF (OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected')) THEN
        INSERT INTO public.activity_logs (
            actor_id,
            user_id,
            action,
            entity_type,
            entity_id,
            metadata,
            created_at
        ) VALUES (
            COALESCE(NEW.decided_by, auth.uid()),
            NEW.user_id,
            CASE WHEN NEW.status = 'approved' THEN 'ROLE_APPROVED' ELSE 'ROLE_REJECTED' END,
            'coordinator_requests',
            NEW.id,
            jsonb_build_object(
                'applicant_user_id', NEW.user_id,
                'decision', NEW.status,
                'rejection_reason', NEW.rejection_reason
            ),
            now()
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_coordinator_request_audit ON public.coordinator_requests;
CREATE TRIGGER trg_coordinator_request_audit
    AFTER UPDATE OF status ON public.coordinator_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_coordinator_request_audit();

-- B. Trigger for Append-Only Points Ledger Awards & Corrections
CREATE OR REPLACE FUNCTION public.handle_points_ledger_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.activity_logs (
        actor_id,
        user_id,
        action,
        entity_type,
        entity_id,
        event_id,
        metadata,
        created_at
    ) VALUES (
        NEW.awarded_by,
        NEW.student_id,
        CASE WHEN NEW.points >= 0 THEN 'POINTS_AWARDED' ELSE 'POINTS_CORRECTED' END,
        'points_ledger',
        NEW.id,
        NEW.event_id,
        jsonb_build_object(
            'student_id', NEW.student_id,
            'points', NEW.points,
            'category', NEW.category,
            'reason', NEW.reason
        ),
        now()
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_points_ledger_audit ON public.points_ledger;
CREATE TRIGGER trg_points_ledger_audit
    AFTER INSERT ON public.points_ledger
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_points_ledger_audit();

-- 11. DEACTIVATED USER IMMEDIATE RLS ACCESS REVOCATION
-- Ensure deactivated students cannot query their points, certificates, or registrations
DROP POLICY IF EXISTS "points_ledger_student_read" ON public.points_ledger;
CREATE POLICY "points_ledger_student_read"
    ON public.points_ledger FOR SELECT
    TO authenticated
    USING (
        public.is_active_user() AND (
            student_id = auth.uid() OR 
            public.is_admin() OR 
            public.is_coordinator()
        )
    );

DROP POLICY IF EXISTS "certificates_select_policy" ON public.certificates;
CREATE POLICY "certificates_select_policy"
    ON public.certificates FOR SELECT
    TO authenticated
    USING (
        public.is_active_user() AND (
            student_id = auth.uid() OR
            public.is_admin() OR
            public.is_coordinator()
        )
    );

-- 12. FREE-TIER STORAGE SAFETY & FILE SIZE LIMITS
-- Enforces 25MB maximum upload limit per file for academic slide decks and notes
UPDATE storage.buckets
SET file_size_limit = 26214400,
    allowed_mime_types = ARRAY[
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/png',
        'image/jpeg',
        'text/plain'
    ]
WHERE id = 'learning-materials';
