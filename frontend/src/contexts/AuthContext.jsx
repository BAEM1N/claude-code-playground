/**
 * Authentication Context
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const initAuth = async () => {
      try {
        const session = await authService.getSession();
        if (session) {
          setUser(session.user);
          // Fetch user profile
          const { data } = await authAPI.getMe();
          setProfile(data);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen to auth state changes
    const { data: authListener } = authService.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);

      if (session?.user) {
        try {
          const { data } = await authAPI.getMe();
          setProfile(data);
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    const data = await authService.signIn(email, password);
    setUser(data.user);
    return data;
  };

  const signUp = async (email, password, metadata) => {
    const data = await authService.signUp(email, password, metadata);
    return data;
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
