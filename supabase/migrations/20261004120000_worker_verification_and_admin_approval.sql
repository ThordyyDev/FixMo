-- ============================================================================
-- FixMo Phase 1: Worker Verification & Admin Approval Migration
-- 
-- Description:
-- 1. Precondition Assertions:
--    - Asserts core tables exist: profiles, worker_profiles, service_requests.
--    - Asserts required columns exist on each table.
--    - Asserts validate_service_request_target trigger on public.service_requests
--      calling private.validate_service_request_target() exists and is preserved.
--    - Asserts no name collisions exist for proposed functions or triggers.
-- 2. Creates public.is_admin() SECURITY DEFINER helper to verify administrator identity.
-- 3. Creates trg_enforce_profile_role_guard on public.profiles:
--    - Ordinary registrations (INSERT) only accept 'seeker' or 'worker' (defaults NULL to 'seeker').
--    - Blocks client API updates from altering profiles.role.
-- 4. Restricts worker verification modifications:
--    - Revokes table-level UPDATE on public.worker_profiles from authenticated/anon/public.
--    - Grants column-level UPDATE on worker-editable fields only:
--      (bio, experience_years, service_area, availability_status, updated_at) to authenticated.
--    - Creates trg_enforce_worker_verification_guard on public.worker_profiles to validate
--      status enum values and enforce consistent verified_at timestamp relationships.
--    - Preserves normal worker profile updates (bio, experience, area, availability).
-- 5. Creates public.admin_update_worker_verification(uuid, text) RPC for authorized admins:
--    - Uses row-level locking (FOR UPDATE) to prevent concurrency races.
--    - Validates target_worker_id and new_status (explicit NULL and enum checks).
--    - Guarantees consistent verified_at timestamp handling and updates updated_at.
--
-- Safety Guarantees:
-- - All functions specify explicit SET search_path = '' and qualified schema identifiers.
-- - Explicit ownership set to postgres.
-- - Public execution revoked; execute granted only to authenticated role where appropriate.
-- - Preserves private.validate_service_request_target() and existing RLS policies.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. Precondition Assertions
-- Fails fast if target schema assumptions or preconditions are not met.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    -- A. Verify required base tables exist
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        RAISE EXCEPTION 'Precondition failed: public.profiles table does not exist';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'worker_profiles') THEN
        RAISE EXCEPTION 'Precondition failed: public.worker_profiles table does not exist';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'service_requests') THEN
        RAISE EXCEPTION 'Precondition failed: public.service_requests table does not exist';
    END IF;

    -- B. Verify required columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
    ) THEN
        RAISE EXCEPTION 'Precondition failed: public.profiles.role column does not exist';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'worker_profiles' AND column_name = 'verification_status'
    ) THEN
        RAISE EXCEPTION 'Precondition failed: public.worker_profiles.verification_status column does not exist';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'worker_profiles' AND column_name = 'verified_at'
    ) THEN
        RAISE EXCEPTION 'Precondition failed: public.worker_profiles.verified_at column does not exist';
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

    -- D. Verify no colliding functions exist in public schema
    IF EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON n.oid = p.pronamespace 
        WHERE n.nspname = 'public' 
          AND p.proname IN (
              'is_admin', 
              'enforce_profile_role_guard', 
              'enforce_worker_verification_guard', 
              'admin_update_worker_verification'
          )
    ) THEN
        RAISE EXCEPTION 'Precondition failed: one or more proposed functions already exist in public schema';
    END IF;

    -- E. Verify no colliding triggers exist on target tables
    IF EXISTS (
        SELECT 1 FROM pg_trigger t 
        JOIN pg_class c ON c.oid = t.tgrelid 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE n.nspname = 'public' 
          AND t.tgname IN ('trg_enforce_profile_role_guard', 'trg_enforce_worker_verification_guard')
    ) THEN
        RAISE EXCEPTION 'Precondition failed: one or more proposed triggers already exist';
    END IF;
END $$;


-- ----------------------------------------------------------------------------
-- 1. Helper Function: public.is_admin()
-- Evaluates caller identity via SECURITY DEFINER owned by postgres.
-- ----------------------------------------------------------------------------
CREATE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (SELECT auth.uid())
          AND role = 'admin'
    );
END;
$$;

ALTER FUNCTION public.is_admin() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;


-- ----------------------------------------------------------------------------
-- 2. Trigger Function: public.enforce_profile_role_guard()
-- Guards profiles.role against invalid values and unauthorized client changes.
-- ----------------------------------------------------------------------------
CREATE FUNCTION public.enforce_profile_role_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    -- On INSERT: Restrict ordinary registrations to 'seeker' or 'worker' only
    IF TG_OP = 'INSERT' THEN
        -- Default omitted or NULL role to 'seeker'
        IF NEW.role IS NULL THEN
            NEW.role := 'seeker';
        END IF;

        IF NEW.role NOT IN ('seeker', 'worker') THEN
            RAISE EXCEPTION 'Invalid initial profile role: % (must be seeker or worker)', NEW.role
                USING ERRCODE = 'check_violation';
        END IF;
        RETURN NEW;
    END IF;

    -- On UPDATE: Disallow client-side modification of profiles.role
    IF TG_OP = 'UPDATE' THEN
        -- Validate target role against allowed system roles
        IF NEW.role IS NULL OR NEW.role NOT IN ('seeker', 'worker', 'admin') THEN
            RAISE EXCEPTION 'Invalid profile role value: % (must be seeker, worker, or admin)', NEW.role
                USING ERRCODE = 'check_violation';
        END IF;

        -- Forbid client updates to profiles.role
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'Modifying profile role is not permitted via client API'
                USING ERRCODE = 'insufficient_privilege';
        END IF;

        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$;

ALTER FUNCTION public.enforce_profile_role_guard() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.enforce_profile_role_guard() FROM PUBLIC;

CREATE TRIGGER trg_enforce_profile_role_guard
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_profile_role_guard();


-- ----------------------------------------------------------------------------
-- 3. Trigger Function: public.enforce_worker_verification_guard()
-- Protects worker_profiles verification fields from unauthorized modification
-- and enforces consistent verified_at timestamp relationships.
-- ----------------------------------------------------------------------------
CREATE FUNCTION public.enforce_worker_verification_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF (NEW.verification_status IS DISTINCT FROM OLD.verification_status)
       OR (NEW.verified_at IS DISTINCT FROM OLD.verified_at) THEN
        -- Must have admin privileges
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Only administrators can modify worker verification status'
                USING ERRCODE = 'insufficient_privilege';
        END IF;

        -- Validate enum values strictly
        IF NEW.verification_status IS NULL OR NEW.verification_status NOT IN ('pending', 'verified', 'rejected', 'suspended') THEN
            RAISE EXCEPTION 'Invalid verification status: % (must be pending, verified, rejected, or suspended)', NEW.verification_status
                USING ERRCODE = 'check_violation';
        END IF;

        -- Enforce timestamp consistency
        IF NEW.verification_status = 'verified' THEN
            IF NEW.verified_at IS NULL THEN
                NEW.verified_at := COALESCE(OLD.verified_at, now());
            END IF;
        ELSE
            NEW.verified_at := NULL;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

ALTER FUNCTION public.enforce_worker_verification_guard() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.enforce_worker_verification_guard() FROM PUBLIC;

CREATE TRIGGER trg_enforce_worker_verification_guard
    BEFORE UPDATE ON public.worker_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_worker_verification_guard();

-- Privilege Hardening on public.worker_profiles:
-- Revoke broad table-level UPDATE so it does not override column-level restrictions
REVOKE UPDATE ON public.worker_profiles FROM authenticated, anon, PUBLIC;

-- Grant column-level UPDATE on worker-managed profile fields only
GRANT UPDATE (bio, experience_years, service_area, availability_status, updated_at) 
    ON public.worker_profiles TO authenticated;


-- ----------------------------------------------------------------------------
-- 4. Admin RPC: public.admin_update_worker_verification()
-- Authorized entry point for administrators to approve/reject/suspend workers.
-- Uses row-level locking (FOR UPDATE) to prevent concurrency races.
-- Runs with owner (postgres) privileges, bypassing client column UPDATE restrictions.
-- ----------------------------------------------------------------------------
CREATE FUNCTION public.admin_update_worker_verification(
    target_worker_id uuid,
    new_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_existing_worker public.worker_profiles%ROWTYPE;
    v_updated_record public.worker_profiles%ROWTYPE;
    v_new_verified_at timestamptz;
BEGIN
    -- 1. Authorization check: caller must be an admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: caller is not an administrator'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- 2. Input validation: target_worker_id cannot be null
    IF target_worker_id IS NULL THEN
        RAISE EXCEPTION 'Target worker ID cannot be null'
            USING ERRCODE = 'null_value_not_allowed';
    END IF;

    -- 3. Input validation: new_status cannot be null
    IF new_status IS NULL THEN
        RAISE EXCEPTION 'Verification status cannot be null'
            USING ERRCODE = 'null_value_not_allowed';
    END IF;

    -- 4. Input validation: reject invalid enum values
    IF new_status NOT IN ('pending', 'verified', 'rejected', 'suspended') THEN
        RAISE EXCEPTION 'Invalid verification status: % (must be pending, verified, rejected, or suspended)', new_status
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    -- 5. Acquire exclusive row-level lock and verify worker exists (concurrency safety)
    SELECT * INTO v_existing_worker
    FROM public.worker_profiles
    WHERE id = target_worker_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Worker profile with ID % not found', target_worker_id
            USING ERRCODE = 'no_data_found';
    END IF;

    -- 6. Consistent timestamp management
    IF new_status = 'verified' THEN
        v_new_verified_at := COALESCE(v_existing_worker.verified_at, now());
    ELSE
        v_new_verified_at := NULL;
    END IF;

    -- 7. Atomic update (runs under SECURITY DEFINER postgres privileges)
    UPDATE public.worker_profiles
    SET 
        verification_status = new_status,
        verified_at = v_new_verified_at,
        updated_at = now()
    WHERE id = target_worker_id
    RETURNING * INTO v_updated_record;

    -- 8. Return sanitized summary (no private seeker or worker contact details)
    RETURN jsonb_build_object(
        'worker_id', v_updated_record.id,
        'verification_status', v_updated_record.verification_status,
        'verified_at', v_updated_record.verified_at,
        'updated_at', v_updated_record.updated_at
    );
END;
$$;

ALTER FUNCTION public.admin_update_worker_verification(uuid, text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.admin_update_worker_verification(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_worker_verification(uuid, text) TO authenticated;

COMMIT;
