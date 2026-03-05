
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../types';
import { getCurrentUserFromStorage, getGoogleLoginUrl as fetchGoogleLoginUrl, loginWithBackend, loginWithGoogleCallback, logoutFromBackend, registerWithBackend, updateProfileApi } from '../services/authApi';
import { getStoredAuthUser, setStoredAuthUser } from '../services/apiClient';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (code: string) => Promise<void>;
  getGoogleLoginUrl: () => Promise<string>;
  register: (payload: {
    username: string;
    email: string;
    phone: string;
    address: string;
    gender: 'male' | 'female';
    password: string;
    confirmPassword: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getCurrentUserFromStorage());
  }, []);

  const login = async (email: string, password: string) => {
    const userData = await loginWithBackend(email, password);
    setUser(userData);
  };

  const loginWithGoogle = async (code: string) => {
    const userData = await loginWithGoogleCallback(code);
    setUser(userData);
  };

  const getGoogleLoginUrl = () => fetchGoogleLoginUrl();

  const register = async (payload: {
    username: string;
    email: string;
    phone: string;
    address: string;
    gender: 'male' | 'female';
    password: string;
    confirmPassword: string;
  }) => {
    await registerWithBackend(payload);
  };

  const logout = async () => {
    await logoutFromBackend();
    setUser(null);
  };

  const updateUser = async (data: Partial<User> & { avatarKey?: string }) => {
    if (!user?.id) return;
    const updated = await updateProfileApi({
      name: data.name,
      phone: data.phone,
      address: data.address,
      avatarUrl: data.avatarKey ?? (data.avatar && !data.avatar.startsWith('data:') ? data.avatar : undefined),
    });
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      loginWithGoogle,
      getGoogleLoginUrl,
      register,
      logout, 
      updateUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
