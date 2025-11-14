/**
 * Authentication Context
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth';
import { authAPI } from '../services/api';
import { User, UserProfile, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check for existing session
    const initAuth = async (): Promise<void> => {
      try {
        const session = await authService.getSession();
        if (session) {
          setUser(session.user as User);
          // Fetch user profile
          const { data } = await authAPI.getMe();
          setProfile(data as UserProfile);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen to auth state changes
    const { data: authListener } = authService.onAuthStateChange(async (_event: any, session: any) => {
      setUser((session?.user as User) || null);

      if (session?.user) {
        try {
          const { data } = await authAPI.getMe();
          setProfile(data as UserProfile);
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

  const signIn = async (email: string, password: string): Promise<any> => {
    const data = await authService.signIn(email, password);
    setUser(data.user as User);
    return data;
  };

  const signUp = async (email: string, password: string, metadata?: any): Promise<any> => {
    const data = await authService.signUp(email, password, metadata);
    return data;
  };

  const signOut = async (): Promise<void> => {
    await authService.signOut();
    setUser(null);
    setProfile(null);
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
