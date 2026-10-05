import { supabase } from './supabase';
import {
  WorkerVerificationStatus,
  AdminUpdateWorkerVerificationResult,
  PendingWorkerItem,
} from '@/types';

/**
 * Sanitizes errors returned by Supabase RPC for administrative operations.
 */
export const sanitizeAdminError = (error: any): string => {
  if (!error) return 'An unexpected administrative error occurred.';

  const message = error.message || error.details || '';
  const code = error.code || '';

  if (code === '42501' || message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('only administrators')) {
    return 'Permission denied: Administrator privileges required.';
  }

  if (code === '22004' || message.toLowerCase().includes('cannot be null')) {
    return 'Verification status cannot be null.';
  }

  if (code === '22023' || message.toLowerCase().includes('invalid verification status')) {
    return 'Invalid verification status provided.';
  }

  if (code === 'P0002' || message.toLowerCase().includes('not found')) {
    return 'Worker profile not found.';
  }

  return message || 'Administrative operation failed.';
};

/**
 * Checks whether the currently authenticated user has the 'admin' role in the database.
 * Calls the secure public.is_admin() RPC.
 */
export const checkIsAdmin = async (): Promise<{ isAdmin: boolean; error: Error | null }> => {
  try {
    const { data, error } = await supabase.rpc('is_admin');

    if (error) {
      return {
        isAdmin: false,
        error: new Error(sanitizeAdminError(error)),
      };
    }

    return {
      isAdmin: !!data,
      error: null,
    };
  } catch (err: any) {
    return {
      isAdmin: false,
      error: new Error(err?.message || 'Failed to verify administrator status.'),
    };
  }
};

/**
 * Updates a worker's verification status via the secure database RPC.
 *
 * Security guarantees:
 * - Requires caller to have role = 'admin' (enforced server-side in the RPC).
 * - Target worker must exist in public.worker_profiles.
 * - newStatus must be one of: 'pending' | 'verified' | 'rejected' | 'suspended'.
 * - Sets verified_at automatically when verified; clears verified_at when not verified.
 *
 * @param targetWorkerId - UUID of the worker profile to update.
 * @param newStatus - The new verification status.
 */
export const adminUpdateWorkerVerification = async (
  targetWorkerId: string,
  newStatus: WorkerVerificationStatus
): Promise<{
  data: AdminUpdateWorkerVerificationResult | null;
  error: Error | null;
}> => {
  if (!targetWorkerId || !targetWorkerId.trim()) {
    return {
      data: null,
      error: new Error('Worker ID is required.'),
    };
  }

  const validStatuses: WorkerVerificationStatus[] = [
    'pending',
    'verified',
    'rejected',
    'suspended',
  ];

  if (!validStatuses.includes(newStatus)) {
    return {
      data: null,
      error: new Error(`Invalid status "${newStatus}". Must be pending, verified, rejected, or suspended.`),
    };
  }

  try {
    const { data, error } = await supabase.rpc('admin_update_worker_verification', {
      target_worker_id: targetWorkerId.trim(),
      new_status: newStatus,
    });

    if (error) {
      return {
        data: null,
        error: new Error(sanitizeAdminError(error)),
      };
    }

    return {
      data: data as AdminUpdateWorkerVerificationResult,
      error: null,
    };
  } catch (err: any) {
    return {
      data: null,
      error: new Error(sanitizeAdminError(err)),
    };
  }
};

/**
 * Retrieves all pending worker profiles along with their user profile info.
 * Enforces client-side type mapping and sanitizes errors.
 */
export const getPendingWorkers = async (): Promise<{
  data: PendingWorkerItem[];
  error: Error | null;
}> => {
  try {
    const { data, error } = await supabase
      .from('worker_profiles')
      .select(`
        id,
        bio,
        experience_years,
        service_area,
        availability_status,
        verification_status,
        created_at,
        profile:profiles (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      if (__DEV__) {
        console.warn('[FixMo Admin] Pending workers query error:', error.message);
      }
      return {
        data: [],
        error: new Error(sanitizeAdminError(error)),
      };
    }

    const items: PendingWorkerItem[] = (data || []).map((row: any) => ({
      id: row.id,
      bio: row.bio,
      experience_years: row.experience_years,
      service_area: row.service_area,
      availability_status: row.availability_status,
      verification_status: row.verification_status,
      created_at: row.created_at,
      profile: Array.isArray(row.profile) ? row.profile[0] : row.profile || null,
    }));

    if (__DEV__) {
      console.log(`[FixMo Admin] Loaded ${items.length} pending worker application(s).`);
    }

    return {
      data: items,
      error: null,
    };
  } catch (err: any) {
    if (__DEV__) {
      console.warn('[FixMo Admin] Unexpected getPendingWorkers error:', err);
    }
    return {
      data: [],
      error: new Error(sanitizeAdminError(err)),
    };
  }
};

