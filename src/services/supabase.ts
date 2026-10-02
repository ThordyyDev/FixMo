import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return (
    !!supabaseUrl &&
    !!supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseAnonKey.includes('your-anon-key')
  );
};

/**
 * Creates the Supabase client with AsyncStorage session persistence.
 * Safe fallback client is initialized even if credentials are not yet set
 * to prevent runtime crashes during initial development.
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder-fixmo.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
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
 * Performs a lightweight health check to verify URL reachability and API key validity.
 */
export const testSupabaseConnection = async (): Promise<ConnectionTestResult> => {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase credentials are not configured. Please add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.',
      url: supabaseUrl || 'Not set',
    };
  }

  const startTime = Date.now();

  try {
    // Ping the Supabase REST health endpoint with the public anon key
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: supabaseAnonKey as string,
        Authorization: `Bearer ${supabaseAnonKey}`,
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
        message: 'Supabase reached, but the API Key (EXPO_PUBLIC_SUPABASE_ANON_KEY) is invalid or unauthorized.',
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
