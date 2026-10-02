import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export interface SupabaseConfigValidation {
  isValid: boolean;
  error?: string;
  missingKeys?: string[];
}

/**
 * Validates the presence and format of required Supabase environment variables.
 */
export const validateSupabaseConfig = (): SupabaseConfigValidation => {
  const missing: string[] = [];

  if (!supabaseUrl) {
    missing.push('EXPO_PUBLIC_SUPABASE_URL');
  }

  if (!supabasePublishableKey) {
    missing.push('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  }

  if (missing.length > 0) {
    return {
      isValid: false,
      missingKeys: missing,
      error: `Missing required Supabase environment variable(s): ${missing.join(', ')}. Please define them in .env.local.`,
    };
  }

  if (
    !supabaseUrl!.startsWith('http://') &&
    !supabaseUrl!.startsWith('https://')
  ) {
    return {
      isValid: false,
      error: 'EXPO_PUBLIC_SUPABASE_URL must be a valid URL starting with https:// or http://.',
    };
  }

  if (
    supabaseUrl!.includes('your-project-id') ||
    supabasePublishableKey!.includes('your-publishable-key') ||
    supabasePublishableKey!.includes('your-anon-key')
  ) {
    return {
      isValid: false,
      error: 'Supabase environment variables contain placeholder values. Please set your real project credentials in .env.local.',
    };
  }

  return { isValid: true };
};

/**
 * Checks whether Supabase is properly configured with valid URL and publishable key.
 */
export const isSupabaseConfigured = (): boolean => {
  return validateSupabaseConfig().isValid;
};

// Surface helpful development warning when running locally without credentials
if (__DEV__) {
  const check = validateSupabaseConfig();
  if (!check.isValid) {
    console.warn(`[FixMo Supabase] Configuration note: ${check.error}`);
  }
}

/**
 * Creates the Supabase client with AsyncStorage session persistence.
 * Safe fallback client is initialized even if credentials are not yet set
 * to prevent runtime crashes during initial development.
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder-fixmo.supabase.co',
  supabasePublishableKey || 'placeholder-publishable-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  url?: string;
  latencyMs?: number;
}

/**
 * Tests the connection to the configured Supabase project.
 * Performs a lightweight health check against the Supabase API to verify reachability and publishable key validity.
 */
export const testSupabaseConnection = async (): Promise<ConnectionTestResult> => {
  const validation = validateSupabaseConfig();
  if (!validation.isValid) {
    return {
      success: false,
      message: validation.error || 'Supabase configuration is invalid.',
      url: supabaseUrl || 'Not set',
    };
  }

  const startTime = Date.now();

  try {
    // Ping the Supabase Auth Health endpoint with the publishable key
    // This verifies both URL connectivity and API key authorization without requiring secret keys.
    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      method: 'GET',
      headers: {
        apikey: supabasePublishableKey as string,
      },
    });

    const latencyMs = Date.now() - startTime;

    if (response.ok || response.status === 200) {
      return {
        success: true,
        message: 'Successfully connected to Supabase!',
        url: supabaseUrl,
        latencyMs,
      };
    }

    if (response.status === 401) {
      return {
        success: false,
        message: 'Supabase reached, but the Publishable Key is invalid or unauthorized.',
        url: supabaseUrl,
        latencyMs,
      };
    }

    return {
      success: false,
      message: `Supabase server responded with status: ${response.status} (${response.statusText})`,
      url: supabaseUrl,
      latencyMs,
    };
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      message: error?.message || 'Failed to connect to Supabase. Check your network connection and Supabase URL.',
      url: supabaseUrl,
      latencyMs,
    };
  }
};
