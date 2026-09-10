import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '../types/clinical';
import {
  getCurrentUserSession,
  loginWithSupabase,
  logoutFromSupabase,
  completeHospitalSetup,
  LoginCredentials,
} from '../api/auth';
import { checkApiHealth } from '../api/client';
import { supabase } from '../api/supabase';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  apiConnected: boolean;
  needsHospitalSetup: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  completeHospitalSetup: (hospitalName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshApiStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);

  const needsHospitalSetup = !!user && !user.hospital_name?.trim();

  const refreshApiStatus = async () => {
    const connected = await checkApiHealth();
    setApiConnected(connected);
    return connected;
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const currentUser = await getCurrentUserSession();
        if (mounted) setUser(currentUser);
      } catch (err) {
        console.error('Failed to restore Supabase session:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }

      refreshApiStatus();
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        const nextUser = await getCurrentUserSession();
        setUser(nextUser);
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
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

  const saveHospitalName = async (hospitalName: string) => {
    setIsLoading(true);
    try {
      const updatedUser = await completeHospitalSetup(hospitalName);
      setUser(updatedUser);
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
        needsHospitalSetup,
        login,
        completeHospitalSetup: saveHospitalName,
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
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
