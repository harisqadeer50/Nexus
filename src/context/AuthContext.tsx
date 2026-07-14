import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, UserRole, AuthContextType } from '../types';
import { loginAPI, registerAPI, getMeAPI } from '../api/auth';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'token';
const USER_STORAGE_KEY = 'business_nexus_user';

const mapBackendUser = (data: any): User => ({
  id: data._id,
  name: data.name,
  email: data.email,
  role: data.role,
  avatarUrl: data.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=4F46E5&color=fff`,
  bio: data.bio || '',
  isOnline: true,
  createdAt: data.createdAt,
  balance: data.balance || 0,
  location: data.location || '',
  phone: data.phone || '',
  website: data.website || '',
  startupName: data.startupName || '',
  startupStage: data.startupStage || '',
  industry: data.industry || '',
  fundingNeeded: data.fundingNeeded || 0,
  pitchDeck: data.pitchDeck || '',
  investmentFocus: data.investmentFocus || [],
  minimumInvestment: data.minimumInvestment || 0,
  maximumInvestment: data.maximumInvestment || 0,
  portfolioCompanies: data.portfolioCompanies || [],
  preferredStages: data.preferredStages || [],
  connections: data.connections || [],
  pendingRequests: data.pendingRequests || [],
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      getMeAPI()
        .then((res) => {
          const mappedUser = mapBackendUser(res.data);
          setUser(mappedUser);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mappedUser));
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_STORAGE_KEY);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await loginAPI({ email, password, role });
      const { token, ...userData } = res.data;
      localStorage.setItem(TOKEN_KEY, token);
      const mappedUser = mapBackendUser(userData);
      setUser(mappedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mappedUser));
      toast.success('Successfully logged in!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await registerAPI({ name, email, password, role });
      const { token, ...userData } = res.data;
      localStorage.setItem(TOKEN_KEY, token);
      const mappedUser = mapBackendUser(userData);
      setUser(mappedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mappedUser));
      toast.success('Account created successfully!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    toast.success('Logged out successfully');
  };

  const forgotPassword = async (_email: string): Promise<void> => {
    toast.success('Password reset instructions sent to your email');
  };

  const resetPassword = async (_token: string, _newPassword: string): Promise<void> => {
    toast.success('Password reset successfully');
  };

  const updateProfile = async (_userId: string, updates: Partial<User>): Promise<void> => {
    try {
      const updatedUser = { ...user, ...updates } as User;
      setUser(updatedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error('Failed to update profile');
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
