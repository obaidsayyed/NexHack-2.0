import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '../types/clinical';
import { getCurrentUserSession, loginWithSupabase, logoutFromSupabase, LoginCredentials } from '../api/auth';
import { checkApiHealth } from '../api/client';

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
