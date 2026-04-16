/* eslint-disable react-refresh/only-export-components */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ApiError,
  getAdminSettings,
  login as loginRequest,
  logout as logoutRequest,
  type AdminProfile,
} from '@/lib/api';

interface AuthContextValue {
  admin: AdminProfile | null;
  isChecking: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setAdmin: (admin: AdminProfile | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // 应用启动时尝试拉取当前登录态（若 Cookie 仍有效则自动回填 admin）
  const refresh = useCallback(async () => {
    try {
      const data = await getAdminSettings();
      setAdmin(data.admin ?? null);
    } catch (error) {
      if (error instanceof ApiError && error.code === 401) {
        setAdmin(null);
        return;
      }
      setAdmin(null);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (username: string, password: string) => {
    const result = await loginRequest(username, password);
    setAdmin(result.admin);
    // 登录成功后补全 apiKeyPrefix 等仅在 settings 接口返回的字段
    try {
      const settings = await getAdminSettings();
      if (settings.admin) {
        setAdmin(settings.admin);
      }
    } catch {
      // ignore: 登录已成功，settings 拉取失败不阻塞
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setAdmin(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      admin,
      isChecking,
      isAuthenticated: Boolean(admin),
      login,
      logout,
      refresh,
      setAdmin,
    }),
    [admin, isChecking, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth 必须在 AuthProvider 内使用');
  }
  return ctx;
}
