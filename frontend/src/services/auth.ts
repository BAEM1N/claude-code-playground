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

    // Store token
    if (data.session) {
      localStorage.setItem('access_token', data.session.access_token);
    }

    return {
      user: data.user,
      session: data.session,
    };
  },

  // Sign out
  signOut: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    // Clear token
    localStorage.removeItem('access_token');
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
    return supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (session) {
        localStorage.setItem('access_token', session.access_token);
      } else {
        localStorage.removeItem('access_token');
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
