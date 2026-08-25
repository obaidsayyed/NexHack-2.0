import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '../types/clinical';
import { getCurrentUserSession, loginWithSupabase, logoutFromSupabase, LoginCredentials } from '../api/auth';
import { checkApiHealth } from '../api/client';

import { supabase, isSupabaseConfigured } from '../api/supabase';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  apiConnected: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshApiStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiConnected, setApiConnected] = useState<boolean>(false);

  const refreshApiStatus = async (): Promise<boolean> => {
    const isHealthy = await checkApiHealth();
    setApiConnected(isHealthy);
    return isHealthy;
  };

  useEffect(() => {
    async function initAuth() {
      try {
        const currentUser = await getCurrentUserSession();
        setUser(currentUser);
      } catch (err) {
        console.error('Failed to restore user session:', err);
      } finally {
        setIsLoading(false);
      }
      refreshApiStatus();
    }
    initAuth();

    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const u = session.user;
          const profile: UserProfile = {
            id: u.id,
            email: u.email || '',
            full_name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Dr. Clinical User',
            role: u.user_metadata?.role || 'Attending Cardiologist',
            hospital_name: 'St. Jude Heart & Vascular Institute',
            department: 'Cardiology Decision Support',
          };
          localStorage.setItem('hf_demo_access_token', session.access_token);
          localStorage.setItem('hf_user_profile', JSON.stringify(profile));
          setUser(profile);

          if (window.location.hash.includes('access_token')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('hf_demo_access_token');
          localStorage.removeItem('hf_user_profile');
        }
        setIsLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const { user: loggedInUser } = await loginWithSupabase(credentials);
      setUser(loggedInUser);
      await refreshApiStatus();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutFromSupabase();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        apiConnected,
        login,
        logout,
        refreshApiStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
