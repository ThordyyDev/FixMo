-- ============================================================================
-- FixMo: Service Categories Read Access Migration
-- Migration: 20261005160000_service_categories_and_worker_leads_access.sql
-- 
-- Description:
-- 1. Precondition Assertions:
--    - Asserts core tables exist: service_categories, profiles, service_requests.
--    - Asserts validate_service_request_target trigger on public.service_requests
--      calling private.validate_service_request_target() is intact and preserved.
-- 2. Service Categories Read Access:
--    - Fixes "permission denied for table service_categories" error (code 42501).
--    - Enables RLS on public.service_categories.
--    - Grants minimal SELECT privilege to authenticated and anon roles for active categories.
--    - Revokes INSERT, UPDATE, DELETE from authenticated, anon, and PUBLIC.
--    - Creates SELECT RLS policy strictly restricted to active categories (is_active = true).
-- 3. Profile Privacy Preservation:
--    - Leaves public.profiles completely sealed (auth.uid() = id for self, is_admin() for admin).
--    - Does NOT grant row-level access on public.profiles to workers, preventing exposure
--      of residents' private phone numbers and personal metadata.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. Precondition Assertions
-- Fails fast if target schema assumptions or preconditions are not met.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    -- A. Verify required tables exist
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'service_categories') THEN
        RAISE EXCEPTION 'Precondition failed: public.service_categories table does not exist';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        RAISE EXCEPTION 'Precondition failed: public.profiles table does not exist';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'service_requests') THEN
        RAISE EXCEPTION 'Precondition failed: public.service_requests table does not exist';
    END IF;

    -- B. Verify validate_service_request_target trigger and function are intact
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
-- 1. Service Categories Permissions & Row-Level Security
-- ----------------------------------------------------------------------------

-- Enable Row-Level Security on public.service_categories
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- Grant minimal SELECT privileges to authenticated users and anonymous visitors
GRANT SELECT ON public.service_categories TO authenticated, anon;

-- Revoke mutation privileges to ensure ordinary users cannot alter reference categories
REVOKE INSERT, UPDATE, DELETE ON public.service_categories FROM authenticated, anon, PUBLIC;

-- Drop only the specific policy being defined to ensure migration idempotency
DROP POLICY IF EXISTS "allow_read_active_categories" ON public.service_categories;

-- Policy: Allow reading active service categories
CREATE POLICY "allow_read_active_categories"
    ON public.service_categories
    FOR SELECT
    TO authenticated, anon
    USING (is_active = true);

COMMIT;
