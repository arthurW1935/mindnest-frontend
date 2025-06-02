'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  email: string;
  role: 'user' | 'psychiatrist' | 'admin';
  isActive: boolean;
  createdAt: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ user: User; redirectPath: string }>;
  register: (email: string, password: string, role: 'user' | 'psychiatrist') => Promise<{ user: User; redirectPath: string }>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  getRedirectPath: (role: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastTokenCheck, setLastTokenCheck] = useState<number>(0);

  const API_BASE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:3001';

  const isAuthenticated = !!user && !!tokens;

  // Helper function to get redirect path based on role
  const getRedirectPath = (role: string): string => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'psychiatrist':
        return '/dashboard/therapist'; // Keep existing folder structure
      case 'user':
        return '/dashboard/user';
      default:
        console.error('Unknown role:', role);
        return '/dashboard/user'; // Default fallback
    }
  };

  // Load stored tokens on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedTokens = localStorage.getItem('mindnest_tokens');
        const storedUser = localStorage.getItem('mindnest_user');
        
        if (storedTokens && storedUser) {
          const parsedTokens = JSON.parse(storedTokens);
          const parsedUser = JSON.parse(storedUser);
          
          // Set tokens and user immediately
          setTokens(parsedTokens);
          setUser(parsedUser);
          
          // Only verify token if it hasn't been checked in the last 5 minutes
          const now = Date.now();
          if (now - lastTokenCheck > 5 * 60 * 1000) {
            try {
              await verifyToken(parsedTokens.accessToken);
              setLastTokenCheck(now);
            } catch (error) {
              console.error('Token verification failed during init:', error);
              clearAuthData();
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const clearAuthData = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('mindnest_tokens');
    localStorage.removeItem('mindnest_user');
    
    // Clear cookies too
    document.cookie = 'mindnest_tokens=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'mindnest_user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  };

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-token`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Token verification failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Token verification failed:', error);
      clearAuthData();
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<{ user: User; redirectPath: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.success && data.data) {
        const { user: userData, tokens: tokenData } = data.data;
        
        // Set state immediately
        setUser(userData);
        setTokens(tokenData);
        setLastTokenCheck(Date.now());
        
        // Store in localStorage and cookies
        localStorage.setItem('mindnest_tokens', JSON.stringify(tokenData));
        localStorage.setItem('mindnest_user', JSON.stringify(userData));
        
        // Also store in cookies for middleware
        document.cookie = `mindnest_tokens=${JSON.stringify(tokenData)}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days
        document.cookie = `mindnest_user=${JSON.stringify(userData)}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days

        // Return user data and redirect path
        const redirectPath = getRedirectPath(userData.role);
        return { user: userData, redirectPath };
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, role: 'user' | 'psychiatrist'): Promise<{ user: User; redirectPath: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      if (data.success && data.data) {
        const { user: userData, tokens: tokenData } = data.data;
        
        // Set state immediately
        setUser(userData);
        setTokens(tokenData);
        setLastTokenCheck(Date.now());
        
        // Store in localStorage and cookies
        localStorage.setItem('mindnest_tokens', JSON.stringify(tokenData));
        localStorage.setItem('mindnest_user', JSON.stringify(userData));
        
        // Also store in cookies for middleware
        document.cookie = `mindnest_tokens=${JSON.stringify(tokenData)}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days
        document.cookie = `mindnest_user=${JSON.stringify(userData)}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days

        // Return user data and redirect path
        const redirectPath = getRedirectPath(userData.role);
        return { user: userData, redirectPath };
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (tokens?.accessToken) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      if (!tokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Token refresh failed');
      }

      if (data.success && data.data) {
        const newTokens = data.data.tokens;
        setTokens(newTokens);
        setLastTokenCheck(Date.now());
        localStorage.setItem('mindnest_tokens', JSON.stringify(newTokens));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      clearAuthData();
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    tokens,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshToken,
    getRedirectPath,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};