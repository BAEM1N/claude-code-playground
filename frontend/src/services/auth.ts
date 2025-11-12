/**
 * Supabase authentication service
 */
import { createClient, SupabaseClient, Session, User, AuthChangeEvent } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL as string;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY as string;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export interface SignUpMetadata {
  full_name?: string;
  [key: string]: any;
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
}

export interface AuthStateChangeCallback {
  (event: AuthChangeEvent, session: Session | null): void;
}

// Auth helpers
export const authService = {
  // Sign up with email and password
  signUp: async (email: string, password: string, metadata: SignUpMetadata = {}): Promise<AuthResponse> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) throw error;
    return {
      user: data.user,
      session: data.session,
    };
  },

  // Sign in with email and password
  signIn: async (email: string, password: string): Promise<AuthResponse> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Send token to backend to set secure HTTP-only cookies
    if (data.session) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/auth/login`, {
          method: 'POST',
          credentials: 'include',  // Important: send cookies
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: data.session.access_token
          })
        });

        if (!response.ok) {
          throw new Error('Failed to set authentication cookies');
        }

        const { csrf_token } = await response.json();

        // Store CSRF token in sessionStorage (not localStorage for better security)
        sessionStorage.setItem('csrf_token', csrf_token);

        // Remove old localStorage token if it exists
        localStorage.removeItem('access_token');
      } catch (err) {
        console.error('Failed to set auth cookies:', err);
        // Fallback: keep using localStorage for backward compatibility
        localStorage.setItem('access_token', data.session.access_token);
      }
    }

    return {
      user: data.user,
      session: data.session,
    };
  },

  // Sign out
  signOut: async (): Promise<void> => {
    // Clear backend cookies first
    try {
      const csrfToken = sessionStorage.getItem('csrf_token');
      await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfToken || '',
        },
      });
    } catch (err) {
      console.error('Failed to clear auth cookies:', err);
    }

    // Clear Supabase session
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Clear stored tokens
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('csrf_token');
  },

  // Get current user
  getCurrentUser: async (): Promise<User | null> => {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) throw error;
    return user;
  },

  // Get current session
  getSession: async (): Promise<Session | null> => {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) throw error;
    return session;
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: AuthStateChangeCallback) => {
    return supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        // Update cookies when token is refreshed
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/auth/login`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              access_token: session.access_token
            })
          });

          if (response.ok) {
            const { csrf_token } = await response.json();
            sessionStorage.setItem('csrf_token', csrf_token);
            localStorage.removeItem('access_token');
          } else {
            // Fallback
            localStorage.setItem('access_token', session.access_token);
          }
        } catch (err) {
          console.error('Failed to update auth cookies:', err);
          localStorage.setItem('access_token', session.access_token);
        }
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('access_token');
        sessionStorage.removeItem('csrf_token');
      }

      callback(event, session);
    });
  },

  // Reset password
  resetPassword: async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) throw error;
  },

  // Update user
  updateUser: async (updates: { email?: string; password?: string; data?: any }): Promise<User> => {
    const { data, error } = await supabase.auth.updateUser(updates);

    if (error) throw error;
    if (!data.user) throw new Error('No user returned from update');
    return data.user;
  },
};

export default authService;
