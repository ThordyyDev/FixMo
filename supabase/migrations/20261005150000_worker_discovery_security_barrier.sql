-- ============================================================================
-- FixMo: Worker Discovery Security Barrier Migration (Least-Privilege Hardened)
-- 
-- Description:
-- 1. Precondition Assertions:
--    - Asserts core tables exist: profiles, worker_profiles, worker_services, service_requests.
--    - Asserts validate_service_request_target trigger on public.service_requests
--      is intact and preserved.
-- 2. Helper Function: private.is_worker_verified(uuid)
--    - Defined in the "private" schema so PostgREST NEVER exposes it as an RPC endpoint.
--      This prevents arbitrary UUID verification-status enumeration via client API.
--    - Uses SECURITY DEFINER (owned by postgres) so RLS on worker_profiles
--      does not block subquery evaluation during worker_services RLS checks.
-- 3. View: public.worker_discovery
--    - Uses security_barrier = true to guarantee the verified-status filter runs
--      strictly before any client-supplied search or filter predicates.
--    - Uses security_invoker = false: runs under view owner (postgres),
--      ensuring base table public.profiles remains 100% sealed (auth.uid() = id)
--      so phone numbers and private user profile data are NEVER exposed.
--    - Strictly projects public worker and profile columns only (no phone, no email).
--    - Strictly filters WHERE wp.verification_status = 'verified'.
-- 4. RLS Policy: public.worker_services
--    - Allows authenticated seekers to SELECT category offerings and descriptions
--      for verified workers via private.is_worker_verified(worker_id).
--    - Preserves workers' existing self-access and write (INSERT/UPDATE/DELETE) policies.
--    - Prevents unverified workers' services from being exposed to seekers.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. Precondition Assertions
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        RAISE EXCEPTION 'Precondition failed: public.profiles table does not exist';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'worker_profiles') THEN
        RAISE EXCEPTION 'Precondition failed: public.worker_profiles table does not exist';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'worker_services') THEN
        RAISE EXCEPTION 'Precondition failed: public.worker_services table does not exist';
    END IF;

    -- Verify validate_service_request_target trigger is intact and preserved
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
        RAISE EXCEPTION 'Precondition failed: trigger validate_service_request_target on public.service_requests not found or modified';
    END IF;
END $$;


-- ----------------------------------------------------------------------------
-- 1. Helper Function: private.is_worker_verified(uuid)
-- Placed in 'private' schema to prevent PostgREST RPC exposure.
-- ----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.is_worker_verified(target_worker_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF target_worker_id IS NULL THEN
        RETURN false;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.worker_profiles
        WHERE id = target_worker_id
          AND verification_status = 'verified'
    );
END;
$$;

ALTER FUNCTION private.is_worker_verified(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION private.is_worker_verified(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_worker_verified(uuid) TO authenticated;


-- ----------------------------------------------------------------------------
-- 2. Secure Worker Discovery View
-- - security_barrier = true: Guarantees verified filter runs before user predicates.
-- - security_invoker = false: Runs under view owner (postgres), keeping base
--   table public.profiles strictly isolated so phone numbers are NEVER exposed.
-- - Strictly filters for verification_status = 'verified'.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.worker_discovery
WITH (security_barrier = true, security_invoker = false)
AS
SELECT
    wp.id AS worker_id,
    p.username,
    p.full_name,
    p.avatar_url,
    wp.bio,
    wp.experience_years,
    wp.service_area,
    wp.availability_status,
    wp.verification_status,
    wp.verified_at
FROM public.worker_profiles wp
JOIN public.profiles p ON p.id = wp.id
WHERE wp.verification_status = 'verified';

ALTER VIEW public.worker_discovery OWNER TO postgres;
GRANT SELECT ON public.worker_discovery TO authenticated;


-- ----------------------------------------------------------------------------
-- 3. Worker Services Read Access for Verified Workers
-- Enables seekers to view category offerings and descriptions for verified workers.
-- Preserves existing worker self-access and write policies.
-- ----------------------------------------------------------------------------
GRANT SELECT ON public.worker_services TO authenticated;

DROP POLICY IF EXISTS "authenticated_select_verified_worker_services" ON public.worker_services;

CREATE POLICY "authenticated_select_verified_worker_services"
    ON public.worker_services
    FOR SELECT
    TO authenticated
    USING (private.is_worker_verified(worker_id));

COMMIT;
