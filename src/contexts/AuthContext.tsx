import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: Error | null;
  requiresEmailConfirmation?: boolean;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    // Fetch initial session from AsyncStorage via Supabase client
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          if (__DEV__) {
            console.warn('[FixMo Auth] Error restoring session:', error.message);
          }
        }
        if (isMounted) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
          setLoading(false);
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
      (_event, currentSession) => {
        if (isMounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

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

      return {
        user: data.user,
        session: data.session,
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

  const signUp = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signUp({
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

      // If Supabase has email confirmation enabled, user is created but session is null until confirmed
      const requiresEmailConfirmation = !!data.user && !data.session;

      return {
        user: data.user,
        session: data.session,
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
      loading,
      signIn,
      signUp,
      signOut,
      refreshSession,
    }),
    [user, session, loading]
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
