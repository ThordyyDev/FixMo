import { supabase } from './supabase';
import {
  WorkerProfile,
  CreateWorkerProfileInput,
  UpdateWorkerProfileInput,
} from '@/types';

/**
 * Validates experience years.
 * Rules:
 * - Optional
 * - If provided, must be a non-negative whole number (integer >= 0)
 */
export const validateExperienceYears = (
  value?: number | string | null
): { isValid: boolean; error?: string; value: number | null } => {
  if (value === undefined || value === null || value === '') {
    return { isValid: true, value: null };
  }

  const num = typeof value === 'string' ? Number(value.trim()) : value;

  if (isNaN(num)) {
    return {
      isValid: false,
      error: 'Years of experience must be a valid number.',
      value: null,
    };
  }

  if (!Number.isInteger(num)) {
    return {
      isValid: false,
      error: 'Years of experience must be a whole number.',
      value: null,
    };
  }

  if (num < 0) {
    return {
      isValid: false,
      error: 'Years of experience cannot be negative.',
      value: null,
    };
  }

  if (num > 70) {
    return {
      isValid: false,
      error: 'Please enter a realistic number of experience years (up to 70).',
      value: null,
    };
  }

  return { isValid: true, value: num };
};

/**
 * Retrieves the authenticated worker's profile record from public.worker_profiles.
 * Returns null if no record exists yet.
 */
export const getWorkerProfile = async (
  userId: string
): Promise<{ data: WorkerProfile | null; error: Error | null }> => {
  if (!userId) {
    return {
      data: null,
      error: new Error('User ID is required to fetch worker profile.'),
    };
  }

  try {
    const { data, error } = await supabase
      .from('worker_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      if (__DEV__) {
        console.warn('[FixMo Worker Profile] Fetch error:', error.message);
      }
      return {
        data: null,
        error: new Error(sanitizeWorkerProfileError(error)),
      };
    }

    return {
      data: data as WorkerProfile | null,
      error: null,
    };
  } catch (err: any) {
    if (__DEV__) {
      console.warn('[FixMo Worker Profile] Unexpected fetch error:', err);
    }
    return {
      data: null,
      error: new Error(sanitizeWorkerProfileError(err)),
    };
  }
};

/**
 * Creates an initial worker profile record in public.worker_profiles for the authenticated user.
 */
export const createWorkerProfile = async (
  userId: string,
  input: CreateWorkerProfileInput
): Promise<{ data: WorkerProfile | null; error: Error | null }> => {
  if (!userId) {
    return {
      data: null,
      error: new Error('Authentication session missing. Please sign in again.'),
    };
  }

  const expValidation = validateExperienceYears(input.experience_years);
  if (!expValidation.isValid) {
    return {
      data: null,
      error: new Error(expValidation.error),
    };
  }

  const sanitizedBio = input.bio?.trim() || null;
  const sanitizedServiceArea = input.service_area?.trim() || null;
  const availabilityStatus = input.availability_status || 'available';

  try {
    const { data, error } = await supabase
      .from('worker_profiles')
      .insert({
        id: userId,
        bio: sanitizedBio,
        experience_years: expValidation.value,
        service_area: sanitizedServiceArea,
        availability_status: availabilityStatus,
      })
      .select()
      .single();

    if (error) {
      if (__DEV__) {
        console.warn('[FixMo Worker Profile] Create error:', error.message);
      }
      return {
        data: null,
        error: new Error(sanitizeWorkerProfileError(error)),
      };
    }

    return {
      data: data as WorkerProfile,
      error: null,
    };
  } catch (err: any) {
    if (__DEV__) {
      console.warn('[FixMo Worker Profile] Unexpected create error:', err);
    }
    return {
      data: null,
      error: new Error(sanitizeWorkerProfileError(err)),
    };
  }
};

/**
 * Updates an existing worker profile record in public.worker_profiles.
 * Does not allow updating verification_status or verified_at (reserved for admin flow).
 */
export const updateWorkerProfile = async (
  userId: string,
  input: UpdateWorkerProfileInput
): Promise<{ data: WorkerProfile | null; error: Error | null }> => {
  if (!userId) {
    return {
      data: null,
      error: new Error('Authentication session missing. Please sign in again.'),
    };
  }

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (input.experience_years !== undefined) {
    const expValidation = validateExperienceYears(input.experience_years);
    if (!expValidation.isValid) {
      return {
        data: null,
        error: new Error(expValidation.error),
      };
    }
    updates.experience_years = expValidation.value;
  }

  if (input.bio !== undefined) {
    updates.bio = input.bio?.trim() || null;
  }

  if (input.service_area !== undefined) {
    updates.service_area = input.service_area?.trim() || null;
  }

  if (input.availability_status !== undefined) {
    updates.availability_status = input.availability_status;
  }

  try {
    const { data, error } = await supabase
      .from('worker_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      if (__DEV__) {
        console.warn('[FixMo Worker Profile] Update error:', error.message);
      }
      return {
        data: null,
        error: new Error(sanitizeWorkerProfileError(error)),
      };
    }

    return {
      data: data as WorkerProfile,
      error: null,
    };
  } catch (err: any) {
    if (__DEV__) {
      console.warn('[FixMo Worker Profile] Unexpected update error:', err);
    }
    return {
      data: null,
      error: new Error(sanitizeWorkerProfileError(err)),
    };
  }
};

/**
 * Sanitizes technical Supabase/PostgreSQL errors into clear user feedback.
 */
function sanitizeWorkerProfileError(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const code = error.code || '';
  const message = (error.message || '').toLowerCase();

  if (code === '23505' || message.includes('duplicate key') || message.includes('unique constraint')) {
    return 'A worker profile already exists for this account.';
  }

  if (message.includes('row-level security') || message.includes('permission denied')) {
    return 'Permission denied. Please ensure you are logged into your account.';
  }

  return 'Unable to save worker profile details. Please check your connection and try again.';
}
