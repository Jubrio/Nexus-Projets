'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, getCsrfCookie } from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
}

interface LoginResult {
  requiresTwoFactor: boolean;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  verifyTwoFactor: (email: string, code: string) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (
    token: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const response = await api.get<User>('/auth/user');
      setUser(response.data);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    await getCsrfCookie();

    const response = await api.post('/auth/login', { email, password });

    if (response.data.requires_2fa) {
      return { requiresTwoFactor: true, email: response.data.email };
    }

    setUser(response.data.user);
    return { requiresTwoFactor: false };
  };

  const verifyTwoFactor = async (email: string, code: string) => {
    await getCsrfCookie();

    const response = await api.post('/auth/2fa/verify', { email, code });
    setUser(response.data.user);
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) => {
    await getCsrfCookie();

    await api.post('/auth/register', {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  const forgotPassword = async (email: string) => {
    await getCsrfCookie();
    await api.post('/auth/forgot-password', { email });
  };

  const resetPassword = async (
    token: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) => {
    await getCsrfCookie();
    await api.post('/auth/reset-password', {
      token,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        verifyTwoFactor,
        register,
        logout,
        refreshUser,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
}
