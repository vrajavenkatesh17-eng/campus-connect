-- ==============================================================================
-- CAMPUS CONNECT — FXEC Autonomous Event Management System
-- Architected & Patented by Krish & Ihsan. All Rights Reserved.
-- Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
-- ==============================================================================
-- Migration: 007_admin_dashboard_stats.sql
-- Description: Phase 6B (redo): Fast Single-RPC Admin Analytics (admin_dashboard_stats)
--              Strictly restricted to verified administrators in public.admins.
--              Returns aggregated JSON for MagicBento tiles with zero raw row leak.
-- ==============================================================================

-- 0. SCHEMA PREREQUISITES (Self-healing & Idempotent Table Guarantees)
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

CREATE TABLE IF NOT EXISTS public.coordinator_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
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

-- 1. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_events_start_status ON public.events(start_time, status);
CREATE INDEX IF NOT EXISTS idx_events_coordinator_status ON public.events(coordinator_id, status);
CREATE INDEX IF NOT EXISTS idx_registrations_event_status ON public.registrations(event_id, status);
CREATE INDEX IF NOT EXISTS idx_registrations_reg_at ON public.registrations(registered_at);
CREATE INDEX IF NOT EXISTS idx_feedback_resp_created ON public.feedback_responses(created_at);

-- 2. SECURITY DEFINER RPC: admin_dashboard_stats
CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_caller_email TEXT := '';
    v_is_authorized BOOLEAN := false;

    v_registrations_trend JSONB;
    v_event_registrations JSONB;
    v_seat_occupancy JSONB;
    v_sessions_by_status JSONB;
    v_dept_participation JSONB;
    v_users_by_role JSONB;
    v_active_coordinators JSONB;
    v_feedback_rating JSONB;
    
    v_total_seats INT := 0;
    v_filled_seats INT := 0;
    v_occupancy_pct NUMERIC := 0.0;
BEGIN
    -- Extract caller email from JWT or profiles
    SELECT LOWER(TRIM(COALESCE(
        auth.jwt() ->> 'email',
        (SELECT email FROM public.profiles WHERE id = v_caller_id),
        ''
    ))) INTO v_caller_email;

    -- SECURITY GATE: Strict check that caller is in public.admins
    IF v_caller_email <> '' THEN
        SELECT EXISTS (
            SELECT 1 FROM public.admins WHERE LOWER(TRIM(email)) = v_caller_email
        ) INTO v_is_authorized;
    END IF;

    -- Fallback: check profile role = 'admin' if email matches admins list
    IF NOT v_is_authorized AND v_caller_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.admins a
            JOIN public.profiles p ON LOWER(TRIM(p.email)) = LOWER(TRIM(a.email))
            WHERE p.id = v_caller_id AND p.role = 'admin' AND p.is_active = true
        ) INTO v_is_authorized;
    END IF;

    IF NOT v_is_authorized THEN
        RAISE EXCEPTION 'Access Denied: Caller is not an authorized administrator in public.admins.';
    END IF;

    -- TILE 1: Registrations Trend (Monthly registrations)
    SELECT COALESCE(jsonb_agg(m_data), '[]'::jsonb)
    INTO v_registrations_trend
    FROM (
        SELECT 
            to_char(date_trunc('month', r.registered_at), 'Mon YYYY') as month,
            date_trunc('month', r.registered_at) as sort_key,
            COUNT(*)::int as count
        FROM public.registrations r
        WHERE r.status = 'registered'
        GROUP BY date_trunc('month', r.registered_at)
        ORDER BY sort_key ASC
    ) m_data;

    -- Fallback per-event registration data if fewer than 3 months of data
    SELECT COALESCE(jsonb_agg(e_data), '[]'::jsonb)
    INTO v_event_registrations
    FROM (
        SELECT 
            e.title,
            COUNT(r.id)::int as count
        FROM public.events e
        LEFT JOIN public.registrations r ON r.event_id = e.id AND r.status = 'registered'
        GROUP BY e.id, e.title, e.start_time
        ORDER BY e.start_time DESC
        LIMIT 6
    ) e_data;

    -- TILE 2: Seat Occupancy (Filled / Total seats, percentage rounded to 1 decimal place)
    SELECT 
        COALESCE(SUM(seat_capacity), 0)::int,
        COALESCE((
            SELECT COUNT(*)::int 
            FROM public.registrations r
            JOIN public.events ev ON ev.id = r.event_id
            WHERE r.status = 'registered' AND ev.status NOT IN ('rejected', 'cancelled')
        ), 0)::int
    INTO v_total_seats, v_filled_seats
    FROM public.events
    WHERE status NOT IN ('rejected', 'cancelled');

    IF v_total_seats > 0 THEN
        v_occupancy_pct := ROUND((v_filled_seats::numeric / v_total_seats::numeric) * 100.0, 1);
    ELSE
        v_occupancy_pct := 0.0;
    END IF;

    v_seat_occupancy := jsonb_build_object(
        'filled_seats', v_filled_seats,
        'total_seats', v_total_seats,
        'percentage', v_occupancy_pct
    );

    -- TILE 3: Sessions by Status (Strict vocabulary: pending, approved, rejected, cancelled, completed)
    SELECT jsonb_build_object(
        'pending', COUNT(*) FILTER (WHERE status = 'pending'),
        'approved', COUNT(*) FILTER (WHERE status = 'approved'),
        'rejected', COUNT(*) FILTER (WHERE status = 'rejected'),
        'cancelled', COUNT(*) FILTER (WHERE status = 'cancelled'),
        'completed', COUNT(*) FILTER (WHERE status = 'completed'),
        'total', COUNT(*)
    )
    INTO v_sessions_by_status
    FROM public.events;

    -- TILE 4: Department Participation (One bar per department, dynamic count)
    SELECT COALESCE(jsonb_agg(d_data), '[]'::jsonb)
    INTO v_dept_participation
    FROM (
        SELECT 
            d.code,
            d.name,
            COUNT(DISTINCT r.id)::int as count
        FROM public.departments d
        LEFT JOIN public.profiles p ON p.department_id = d.id AND p.role = 'student'
        LEFT JOIN public.registrations r ON r.student_id = p.id AND r.status = 'registered'
        WHERE d.is_active = true
        GROUP BY d.id, d.code, d.name
        ORDER BY count DESC, d.code ASC
    ) d_data;

    -- TILE 5: Users by Role (Admins / Coordinators / Students)
    SELECT jsonb_build_object(
        'admins', COUNT(*) FILTER (WHERE role = 'admin'),
        'coordinators', COUNT(*) FILTER (WHERE role = 'coordinator'),
        'students', COUNT(*) FILTER (WHERE role = 'student'),
        'total', COUNT(*)
    )
    INTO v_users_by_role
    FROM public.profiles;

    -- TILE 6: Active Coordinators (Count + Coordinator with most events)
    SELECT jsonb_build_object(
        'total_coordinators', (SELECT COUNT(*)::int FROM public.profiles WHERE role = 'coordinator'),
        'active_coordinators', (SELECT COUNT(DISTINCT coordinator_id)::int FROM public.events WHERE status IN ('approved', 'completed')),
        'top_coordinator', (
            SELECT jsonb_build_object(
                'name', p.name,
                'events_count', COUNT(e.id)::int
            )
            FROM public.profiles p
            JOIN public.events e ON e.coordinator_id = p.id
            WHERE e.status IN ('approved', 'completed')
            GROUP BY p.id, p.name
            ORDER BY COUNT(e.id) DESC
            LIMIT 1
        )
    )
    INTO v_active_coordinators;

    -- TILE 7: Feedback Rating (Average + 1-5 distribution if feedback exists)
    SELECT jsonb_build_object(
        'has_feedback', (EXISTS (SELECT 1 FROM public.feedback_responses LIMIT 1)),
        'total', COALESCE((SELECT COUNT(*) FROM public.feedback_responses), 0),
        'average', COALESCE((
            SELECT ROUND(AVG((rating_content + rating_speaker + rating_organization)::numeric / 3.0), 1)
            FROM public.feedback_responses
        ), 0.0),
        'distribution', COALESCE((
            SELECT jsonb_agg(jsonb_build_object('star', s.star_val, 'count', COALESCE(dist.cnt, 0)))
            FROM generate_series(1, 5) AS s(star_val)
            LEFT JOIN (
                SELECT 
                    ROUND((rating_content + rating_speaker + rating_organization)::numeric / 3.0) as rating_star,
                    COUNT(*)::int as cnt
                FROM public.feedback_responses
                GROUP BY rating_star
            ) dist ON dist.rating_star = s.star_val
        ), '[]'::jsonb)
    )
    INTO v_feedback_rating;

    -- RETURN SINGLE AGGREGATED JSON OBJECT
    RETURN jsonb_build_object(
        'registrations_trend', v_registrations_trend,
        'event_registrations', v_event_registrations,
        'seat_occupancy', v_seat_occupancy,
        'sessions_by_status', v_sessions_by_status,
        'department_participation', v_dept_participation,
        'users_by_role', v_users_by_role,
        'active_coordinators', v_active_coordinators,
        'feedback_rating', v_feedback_rating,
        'generated_at', now()
    );
END;
$$;

-- Secure execution grants
REVOKE EXECUTE ON FUNCTION public.admin_dashboard_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_stats() TO authenticated, service_role;
