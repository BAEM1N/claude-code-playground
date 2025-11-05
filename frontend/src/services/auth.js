/**
 * Supabase authentication service
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helpers
export const authService = {
  // Sign up with email and password
  signUp: async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) throw error;
    return data;
  },

  // Sign in with email and password
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Store token
    if (data.session) {
      localStorage.setItem('access_token', data.session.access_token);
    }

    return data;
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    // Clear token
    localStorage.removeItem('access_token');
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) throw error;
    return user;
  },

  // Get current session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) throw error;
    return session;
  },

  // Listen to auth state changes
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        localStorage.setItem('access_token', session.access_token);
      } else {
        localStorage.removeItem('access_token');
      }

      callback(event, session);
    });
  },

  // Reset password
  resetPassword: async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) throw error;
    return data;
  },

  // Update user
  updateUser: async (updates) => {
    const { data, error } = await supabase.auth.updateUser(updates);

    if (error) throw error;
    return data;
  },
};

export default authService;
