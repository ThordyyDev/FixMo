import { supabase } from './supabase';
import { Profile, CreateProfileInput, UpdateProfileInput } from '@/types';

/**
 * Validates a proposed FixMo username.
 * Rules:
 * - Required
 * - 3 to 20 characters long
 * - Must start with an alphanumeric character
 * - Can only contain letters, numbers, and underscores
 * - No spaces or special characters
 */
export const validateUsername = (
  username: string
): { isValid: boolean; error?: string } => {
  const trimmed = username.trim();

  if (!trimmed) {
    return {
      isValid: false,
      error: 'Username is required.',
    };
  }

  if (trimmed.length < 3) {
    return {
      isValid: false,
      error: 'Username must be at least 3 characters long.',
    };
  }

  if (trimmed.length > 20) {
    return {
      isValid: false,
      error: 'Username cannot be longer than 20 characters.',
    };
  }

  if (!/^[a-zA-Z0-9]/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Username must start with a letter or number.',
    };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, and underscores.',
    };
  }

  return { isValid: true };
};

/**
 * Normalizes username to lowercase for consistent storage and comparisons.
 */
export const normalizeUsername = (username: string): string => {
  return username.trim().toLowerCase();
};

/**
 * Retrieves the current authenticated user's profile from public.profiles.
 * Uses maybeSingle() so missing rows return null without throwing PGRST116.
 */
export const getProfile = async (
  userId: string
): Promise<{ data: Profile | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return {
        data: null,
        error: new Error(sanitizeProfileError(error)),
      };
    }

    return {
      data: data as Profile | null,
      error: null,
    };
  } catch (err: any) {
    return {
      data: null,
      error: new Error(err?.message || 'Failed to retrieve user profile.'),
    };
  }
};

/**
 * Creates a new user profile record in public.profiles.
 * Enforces RLS (requires authenticated session where auth.uid() == input.id).
 * Gracefully handles unique constraint violations (code 23505).
 */
export const createProfile = async (
  input: CreateProfileInput
): Promise<{ data: Profile | null; error: Error | null }> => {
  const normalizedUser = normalizeUsername(input.username);

  // Validate format before attempting database insert
  const validation = validateUsername(normalizedUser);
  if (!validation.isValid) {
    return {
      data: null,
      error: new Error(validation.error || 'Invalid username format.'),
    };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          id: input.id,
          username: normalizedUser,
          full_name: input.full_name ?? null,
          phone: input.phone ?? null,
          avatar_url: input.avatar_url ?? null,
          role: input.role ?? 'seeker',
        },
      ])
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: new Error(sanitizeProfileError(error, normalizedUser)),
      };
    }

    return {
      data: data as Profile,
      error: null,
    };
  } catch (err: any) {
    return {
      data: null,
      error: new Error(sanitizeProfileError(err, normalizedUser)),
    };
  }
};

/**
 * Updates an existing user's profile in public.profiles.
 */
export const updateProfile = async (
  userId: string,
  input: UpdateProfileInput
): Promise<{ data: Profile | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: input.full_name !== undefined ? input.full_name : undefined,
        phone: input.phone !== undefined ? input.phone : undefined,
        avatar_url: input.avatar_url !== undefined ? input.avatar_url : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: new Error(sanitizeProfileError(error)),
      };
    }

    return {
      data: data as Profile,
      error: null,
    };
  } catch (err: any) {
    return {
      data: null,
      error: new Error(sanitizeProfileError(err)),
    };
  }
};

/**
 * Sanitizes technical PostgreSQL/PostgREST errors into clean, friendly user feedback.
 */
function sanitizeProfileError(error: any, username?: string): string {
  if (!error) return 'An unexpected error occurred.';

  const code = error.code || '';
  const message = (error.message || '').toLowerCase();

  // PostgreSQL Unique Constraint Violation (code 23505)
  if (
    code === '23505' ||
    message.includes('unique constraint') ||
    message.includes('profiles_username_key') ||
    message.includes('duplicate key')
  ) {
    return username
      ? `The username '@${username}' is already taken. Please choose another username.`
      : 'This username is already taken. Please choose another username.';
  }

  // Row Level Security rejection
  if (message.includes('violates row-level security') || message.includes('permission denied')) {
    return 'Permission denied. Please ensure your account is verified and signed in.';
  }

  return 'Unable to save profile information. Please try again.';
}
