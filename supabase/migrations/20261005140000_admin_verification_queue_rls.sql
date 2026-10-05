-- ============================================================================
-- FixMo Phase 1: Admin Verification Queue Row-Level Security (RLS) Migration
-- 
-- Description:
-- 1. Precondition Assertions:
--    - Asserts core tables exist: profiles, worker_profiles, service_requests.
--    - Asserts public.is_admin() helper function exists.
--    - Asserts validate_service_request_target trigger on public.service_requests
--      is intact and preserved.
-- 2. Grants SELECT to administrators (public.is_admin()) on:
--    - public.worker_profiles: Allows administrators to inspect worker applications
--      in the verification queue.
--    - public.profiles: Allows administrators to view the applicant's profile
--      (username, full_name, avatar_url) joined in the verification queue.
-- 3. Security Guarantees:
--    - For non-administrators, public.is_admin() evaluates to FALSE.
--    - Ordinary seekers and workers retain strict, existing self-access policies
--      (auth.uid() = id). Their access is NOT modified or weakened.
--    - Table-level and column-level UPDATE restrictions are fully preserved.
--    - Trigger trg_enforce_profile_role_guard and trg_enforce_worker_verification_guard
--      remain active and unchanged.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. Precondition Assertions
-- Fails fast if target schema assumptions or preconditions are not met.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    -- A. Verify required tables exist
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        RAISE EXCEPTION 'Precondition failed: public.profiles table does not exist';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'worker_profiles') THEN
        RAISE EXCEPTION 'Precondition failed: public.worker_profiles table does not exist';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'service_requests') THEN
        RAISE EXCEPTION 'Precondition failed: public.service_requests table does not exist';
    END IF;

    -- B. Verify public.is_admin() function exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON n.oid = p.pronamespace 
        WHERE n.nspname = 'public' AND p.proname = 'is_admin'
    ) THEN
        RAISE EXCEPTION 'Precondition failed: public.is_admin() function does not exist. Apply previous migration first.';
    END IF;

    -- C. Verify private.validate_service_request_target trigger and function relationship
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n_tbl ON n_tbl.oid = c.relnamespace
        JOIN pg_proc p ON p.oid = t.tgfoid
        JOIN pg_namespace n_proc ON n_proc.oid = p.pronamespace
        WHERE n_tbl.nspname = 'public'
          AND c.relname = 'service_requests'
          AND t.tgname = 'validate_service_request_target'
          AND n_proc.nspname = 'private'
          AND p.proname = 'validate_service_request_target'
          AND NOT t.tgisinternal
    ) THEN
        RAISE EXCEPTION 'Precondition failed: trigger validate_service_request_target on public.service_requests calling private.validate_service_request_target() not found or modified';
    END IF;
END $$;


-- ----------------------------------------------------------------------------
-- 1. Ensure SELECT Privileges for authenticated role
-- ----------------------------------------------------------------------------
GRANT SELECT ON public.worker_profiles TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;


-- ----------------------------------------------------------------------------
-- 2. RLS Policy: Administrators can SELECT worker profiles
-- Enables authorized admins to view worker profiles in the verification queue.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin_select_worker_profiles" ON public.worker_profiles;

CREATE POLICY "admin_select_worker_profiles"
    ON public.worker_profiles
    FOR SELECT
    TO authenticated
    USING (public.is_admin());


-- ----------------------------------------------------------------------------
-- 3. RLS Policy: Administrators can SELECT user profiles
-- Enables authorized admins to view applicant user metadata (username, full_name, avatar).
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin_select_profiles" ON public.profiles;

CREATE POLICY "admin_select_profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

COMMIT;
