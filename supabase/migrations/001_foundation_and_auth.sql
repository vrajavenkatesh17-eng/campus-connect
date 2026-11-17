-- ==============================================================================
-- CAMPUS CONNECT — FXEC Autonomous Event Management System
-- Architected & Patented by Krish & Ihsan. All Rights Reserved.
-- Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
-- ==============================================================================
-- Migration: 001_foundation_and_auth.sql (Idempotent & Re-runnable)
-- Description: Core Schema, Departments, Admins Allowlist, Profiles,
--              Coordinator Requests, Domain Enforcement Triggers,
--              Role Immutability, Admin Decision RPC, and Server-Side RLS.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Ensure is_active column exists if table was previously created
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Seed Francis Xavier Engineering College Departments
INSERT INTO public.departments (code, name) VALUES
    ('CSE', 'Computer Science and Engineering'),
    ('IT', 'Information Technology'),
    ('AIDS', 'Artificial Intelligence and Data Science'),
    ('CSBS', 'Computer Science and Business Systems'),
    ('ECE', 'Electronics and Communication Engineering'),
    ('EEE', 'Electrical and Electronics Engineering'),
    ('MECH', 'Mechanical Engineering'),
    ('CIVIL', 'Civil Engineering'),
    ('MBA', 'Master of Business Administration'),
    ('MCA', 'Master of Computer Applications')
ON CONFLICT (code) DO NOTHING;

-- 3. ADMINS & COORDINATORS ALLOWLIST TABLES
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    added_by UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Seed Lead Administrator
INSERT INTO public.admins (email, notes) 
VALUES ('v.rajavenkatesh17@gmail.com', 'Lead Administrator') 
ON CONFLICT (email) DO NOTHING;

-- Coordinators Allowlist: pre-authorized faculty emails that automatically receive 'coordinator' role on login
CREATE TABLE IF NOT EXISTS public.coordinators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    department_code TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Seed Faculty Coordinator (Pre-authorized faculty allowlist)
INSERT INTO public.coordinators (email, department_code, notes)
VALUES ('4tman.36@gmail.com', 'CSE', 'Faculty Coordinator')
ON CONFLICT (email) DO NOTHING;

-- If 4tman.36@gmail.com profile already exists, promote to coordinator
DO $$
BEGIN
    PERFORM set_config('app.role_change_authorized', 'true', true);
    UPDATE public.profiles
    SET role = 'coordinator',
        is_profile_complete = true,
        updated_at = now()
    WHERE LOWER(TRIM(email)) = '4tman.36@gmail.com';
END $$;

-- 4. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    photo_url TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'coordinator', 'admin')),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    year INT CHECK (year BETWEEN 1 AND 5),
    register_number TEXT,
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_profile_complete BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Safe migration for existing profiles table columns if already present
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name'
    ) THEN
        ALTER TABLE public.profiles RENAME COLUMN full_name TO name;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.profiles RENAME COLUMN avatar_url TO photo_url;
    END IF;
END $$;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS year INT CHECK (year BETWEEN 1 AND 5);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_profile_complete BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department_id ON public.profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_register_number ON public.profiles(register_number);

-- 5. COORDINATOR REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.coordinator_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    designation TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    decided_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    decided_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_coord_req_user ON public.coordinator_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_coord_req_status ON public.coordinator_requests(status);

-- 6. SECURITY DEFINER HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = p_user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE((SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid() LIMIT 1), false);
$$;

CREATE OR REPLACE FUNCTION public.is_coordinator()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE((SELECT role IN ('coordinator', 'admin') FROM public.profiles WHERE id = auth.uid() LIMIT 1), false);
$$;

-- 7. DOMAIN ENFORCEMENT BEFORE INSERT TRIGGER ON auth.users
CREATE OR REPLACE FUNCTION public.check_user_domain()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_email TEXT := LOWER(TRIM(NEW.email));
    v_is_exempt BOOLEAN := false;
BEGIN
    -- Allow users present in admins OR coordinators allowlists
    SELECT EXISTS (
        SELECT 1 FROM public.admins WHERE LOWER(TRIM(email)) = v_email
        UNION
        SELECT 1 FROM public.coordinators WHERE LOWER(TRIM(email)) = v_email
    ) INTO v_is_exempt;

    IF NOT v_is_exempt AND NOT (v_email LIKE '%@francisxavier.ac.in') THEN
        RAISE EXCEPTION 'Access Denied: Only @francisxavier.ac.in accounts or authorized faculty and administrators are permitted.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_user_domain ON auth.users;
CREATE TRIGGER trg_check_user_domain
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.check_user_domain();

-- 8. AUTOMATIC PROFILE CREATION TRIGGER ON auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_email TEXT := LOWER(TRIM(NEW.email));
    v_name TEXT;
    v_photo TEXT;
    v_role TEXT := 'student';
    v_is_admin BOOLEAN := false;
    v_is_coord BOOLEAN := false;
BEGIN
    -- 1. Check if email is in admins table
    SELECT EXISTS (
        SELECT 1 FROM public.admins WHERE LOWER(TRIM(email)) = v_email
    ) INTO v_is_admin;

    IF v_is_admin THEN
        v_role := 'admin';
    ELSE
        -- 2. Check if email is in coordinators allowlist table
        SELECT EXISTS (
            SELECT 1 FROM public.coordinators WHERE LOWER(TRIM(email)) = v_email
        ) INTO v_is_coord;

        IF v_is_coord THEN
            v_role := 'coordinator';
        ELSE
            -- Default student (requires @francisxavier.ac.in)
            v_role := 'student';
        END IF;
    END IF;

    v_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        SPLIT_PART(v_email, '@', 1)
    );

    v_photo := COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture',
        ''
    );

    INSERT INTO public.profiles (
        id,
        email,
        name,
        photo_url,
        role,
        is_active,
        is_profile_complete,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        v_email,
        v_name,
        v_photo,
        v_role,
        true,
        (v_role IN ('admin', 'coordinator')),
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(NULLIF(EXCLUDED.name, ''), public.profiles.name),
        photo_url = COALESCE(NULLIF(EXCLUDED.photo_url, ''), public.profiles.photo_url),
        updated_at = now();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 9. IMMUTABILITY TRIGGER ON profiles (role & is_active)
CREATE OR REPLACE FUNCTION public.prevent_role_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF (OLD.role IS DISTINCT FROM NEW.role) OR (OLD.is_active IS DISTINCT FROM NEW.is_active) THEN
        IF CURRENT_SETTING('app.role_change_authorized', true) IS DISTINCT FROM 'true' THEN
            RAISE EXCEPTION 'Unauthorized: Modification of role or active status is strictly forbidden.';
        END IF;
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_tampering ON public.profiles;
CREATE TRIGGER trg_prevent_role_tampering
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_role_tampering();

-- 10. COORDINATOR REQUEST APPROVAL/REJECTION RPC (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.admin_decide_coordinator_request(
    p_request_id UUID,
    p_decision TEXT,
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_req RECORD;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Only administrators can approve coordinator requests.';
    END IF;

    IF p_decision NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid decision: Must be approved or rejected.';
    END IF;

    SELECT * INTO v_req FROM public.coordinator_requests WHERE id = p_request_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Coordinator request not found.';
    END IF;

    IF v_req.status <> 'pending' THEN
        RAISE EXCEPTION 'Coordinator request has already been processed.';
    END IF;

    IF p_decision = 'approved' THEN
        PERFORM set_config('app.role_change_authorized', 'true', true);

        UPDATE public.profiles
        SET role = 'coordinator',
            department_id = COALESCE(department_id, v_req.department_id),
            updated_at = now()
        WHERE id = v_req.user_id;

        UPDATE public.coordinator_requests
        SET status = 'approved',
            decided_by = auth.uid(),
            decided_at = now(),
            updated_at = now()
        WHERE id = p_request_id;
    ELSE
        UPDATE public.coordinator_requests
        SET status = 'rejected',
            rejection_reason = p_rejection_reason,
            decided_by = auth.uid(),
            decided_at = now(),
            updated_at = now()
        WHERE id = p_request_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'request_id', p_request_id,
        'decision', p_decision,
        'user_id', v_req.user_id
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_decide_coordinator_request FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_decide_coordinator_request TO authenticated;

-- 11. GENERAL ROLE MANAGEMENT RPC (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
    p_target_user_id UUID,
    p_new_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_count INT;
    v_old_role TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Only administrators can modify roles.';
    END IF;

    IF p_new_role NOT IN ('student', 'coordinator', 'admin') THEN
        RAISE EXCEPTION 'Invalid role: Must be student, coordinator, or admin.';
    END IF;

    SELECT role INTO v_old_role FROM public.profiles WHERE id = p_target_user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target user profile not found.';
    END IF;

    IF auth.uid() = p_target_user_id AND p_new_role <> 'admin' THEN
        SELECT COUNT(*) INTO v_admin_count FROM public.profiles WHERE role = 'admin';
        IF v_admin_count <= 1 THEN
            RAISE EXCEPTION 'Cannot demote the sole system administrator.';
        END IF;
    END IF;

    PERFORM set_config('app.role_change_authorized', 'true', true);

    UPDATE public.profiles
    SET role = p_new_role,
        updated_at = now()
    WHERE id = p_target_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', p_target_user_id,
        'previous_role', v_old_role,
        'new_role', p_new_role,
        'updated_at', now()
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_update_user_role FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_user_role TO authenticated;

-- 12. ROW LEVEL SECURITY (RLS) POLICIES (Idempotent: Drop then Create)

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coordinators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coordinator_requests ENABLE ROW LEVEL SECURITY;

-- DEPARTMENTS POLICIES
DROP POLICY IF EXISTS "departments_select_policy" ON public.departments;
CREATE POLICY "departments_select_policy"
    ON public.departments FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "departments_admin_all_policy" ON public.departments;
DROP POLICY IF EXISTS "departments_insert_policy" ON public.departments;
DROP POLICY IF EXISTS "departments_update_policy" ON public.departments;
DROP POLICY IF EXISTS "departments_delete_policy" ON public.departments;
CREATE POLICY "departments_admin_all_policy"
    ON public.departments FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ADMINS POLICIES
DROP POLICY IF EXISTS "admins_select_policy" ON public.admins;
DROP POLICY IF EXISTS "admins_insert_policy" ON public.admins;
DROP POLICY IF EXISTS "admins_update_policy" ON public.admins;
DROP POLICY IF EXISTS "admins_delete_policy" ON public.admins;
DROP POLICY IF EXISTS "admins_admin_only_policy" ON public.admins;
CREATE POLICY "admins_admin_only_policy"
    ON public.admins FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- COORDINATORS ALLOWLIST POLICIES
DROP POLICY IF EXISTS "coordinators_admin_only_policy" ON public.coordinators;
CREATE POLICY "coordinators_admin_only_policy"
    ON public.coordinators FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- PROFILES POLICIES
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "profiles_update_self_policy" ON public.profiles;
CREATE POLICY "profiles_update_self_policy"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id OR public.is_admin())
    WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_admin_delete_policy" ON public.profiles;
CREATE POLICY "profiles_admin_delete_policy"
    ON public.profiles FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- COORDINATOR REQUESTS POLICIES
DROP POLICY IF EXISTS "coord_req_select_policy" ON public.coordinator_requests;
CREATE POLICY "coord_req_select_policy"
    ON public.coordinator_requests FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "coord_req_insert_self_policy" ON public.coordinator_requests;
CREATE POLICY "coord_req_insert_self_policy"
    ON public.coordinator_requests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "coord_req_admin_manage_policy" ON public.coordinator_requests;
CREATE POLICY "coord_req_admin_manage_policy"
    ON public.coordinator_requests FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
