import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { getProfile, createProfile, normalizeUsername } from '@/services/profile';
import { Profile } from '@/types';

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  profile?: Profile | null;
  error: Error | null;
  requiresEmailConfirmation?: boolean;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string, username: string) => Promise<AuthResponse>;
  signOut: () => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);

  /**
   * Ensures the user's profile row exists in public.profiles.
   * If the profile exists, returns it.
   * If it does not exist (e.g. newly confirmed account), creates it from user metadata.
   */
  const loadOrCreateProfile = useCallback(async (currentUser: User): Promise<Profile | null> => {
    setProfileLoading(true);
    try {
      // 1. Check if profile already exists
      const { data: existingProfile, error: fetchError } = await getProfile(currentUser.id);

      if (existingProfile) {
        setProfile(existingProfile);
        setProfileLoading(false);
        return existingProfile;
      }

      if (fetchError && __DEV__) {
        console.warn('[FixMo Profile] Note while checking profile:', fetchError.message);
      }

      // 2. Profile does not exist yet. Check if username was stored in user metadata
      const rawUsername =
        currentUser.user_metadata?.username ||
        currentUser.email?.split('@')[0] ||
        `user_${currentUser.id.slice(0, 6)}`;

      const targetUsername = normalizeUsername(rawUsername);

      const { data: newProfile, error: createError } = await createProfile({
        id: currentUser.id,
        username: targetUsername,
        role: 'seeker',
      });

      if (createError) {
        if (__DEV__) {
          console.warn('[FixMo Profile] Profile creation note:', createError.message);
        }
        setProfile(null);
        setProfileLoading(false);
        return null;
      }

      setProfile(newProfile);
      setProfileLoading(false);
      return newProfile;
    } catch (err: any) {
      if (__DEV__) {
        console.warn('[FixMo Profile] Error in loadOrCreateProfile:', err);
      }
      setProfile(null);
      setProfileLoading(false);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!user) {
      setProfile(null);
      return;
    }
    await loadOrCreateProfile(user);
  }, [user, loadOrCreateProfile]);

  useEffect(() => {
    let isMounted = true;

    // Fetch initial session from AsyncStorage via Supabase client
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error && __DEV__) {
          console.warn('[FixMo Auth] Error restoring session:', error.message);
        }

        if (isMounted) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
          setLoading(false);

          if (data.session?.user) {
            loadOrCreateProfile(data.session.user);
          }
        }
      } catch (err) {
        if (__DEV__) {
          console.warn('[FixMo Auth] Unexpected error initializing session:', err);
        }
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen to real-time authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);

        if (currentSession?.user) {
          await loadOrCreateProfile(currentSession.user);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadOrCreateProfile]);

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return {
          user: null,
          session: null,
          error: new Error(formatAuthError(error)),
        };
      }

      let loadedProfile: Profile | null = null;
      if (data.user) {
        loadedProfile = await loadOrCreateProfile(data.user);
      }

      return {
        user: data.user,
        session: data.session,
        profile: loadedProfile,
        error: null,
      };
    } catch (err: any) {
      return {
        user: null,
        session: null,
        error: new Error(err?.message || 'An unexpected error occurred during sign in.'),
      };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    username: string
  ): Promise<AuthResponse> => {
    const cleanUsername = normalizeUsername(username);

    try {
      // Create Supabase Auth user and store username in user_metadata
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            username: cleanUsername,
          },
        },
      });

      if (error) {
        return {
          user: null,
          session: null,
          error: new Error(formatAuthError(error)),
        };
      }

      const requiresEmailConfirmation = !!data.user && !data.session;
      let createdUserProfile: Profile | null = null;

      // If an authenticated session is available immediately, create profile immediately
      if (data.session && data.user) {
        const { data: newProfile, error: profileErr } = await createProfile({
          id: data.user.id,
          username: cleanUsername,
          role: 'seeker',
        });

        if (profileErr) {
          // If username was already taken, report friendly error
          return {
            user: data.user,
            session: data.session,
            error: profileErr,
          };
        }

        createdUserProfile = newProfile;
        setProfile(newProfile);
      }

      // If email confirmation is required and session is null:
      // We do NOT attempt profile insert as anonymous. Username is safely preserved in user_metadata.

      return {
        user: data.user,
        session: data.session,
        profile: createdUserProfile,
        error: null,
        requiresEmailConfirmation,
      };
    } catch (err: any) {
      return {
        user: null,
        session: null,
        error: new Error(err?.message || 'An unexpected error occurred during registration.'),
      };
    }
  };

  const signOut = async (): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { error: new Error(error.message) };
      }
      setSession(null);
      setUser(null);
      setProfile(null);
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err?.message || 'An unexpected error occurred during sign out.') };
    }
  };

  const refreshSession = async (): Promise<void> => {
    try {
      const { data } = await supabase.auth.refreshSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        await loadOrCreateProfile(data.session.user);
      }
    } catch (err) {
      if (__DEV__) {
        console.warn('[FixMo Auth] Failed to refresh session:', err);
      }
    }
  };

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      loading,
      profileLoading,
      signIn,
      signUp,
      signOut,
      refreshSession,
      refreshProfile,
    }),
    [user, session, profile, loading, profileLoading, refreshProfile, loadOrCreateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Sanitizes technical Supabase auth errors into friendly user messages.
 */
function formatAuthError(error: AuthError): string {
  const message = error.message.toLowerCase();

  if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (message.includes('user already registered') || message.includes('already exists')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  if (message.includes('email not confirmed')) {
    return 'Please verify your email address before signing in.';
  }
  if (message.includes('password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }
  if (message.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment before trying again.';
  }

  return error.message;
}
