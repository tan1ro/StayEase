import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, setToken, getToken } from '../api/api';
import { canAccessHostPortal, isHostRole, isTouristRole, normalizeRole } from '../utils/roles';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const { data } = await authApi.me();
      setUser({ ...data, role: normalizeRole(data.role) });
      return data;
    } catch {
      setToken(null);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    const handler = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('stayease:unauthorized', handler);
    return () => window.removeEventListener('stayease:unauthorized', handler);
  }, []);

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password });
    setToken(data.access_token);
    const normalizedUser = { ...data.user, role: normalizeRole(data.user.role) };
    setUser(normalizedUser);
    return normalizedUser;
  };

  const register = async (payload) => {
    const { data } = await authApi.register(payload);
    setToken(data.access_token);
    const normalizedUser = { ...data.user, role: normalizeRole(data.user.role) };
    setUser(normalizedUser);
    return normalizedUser;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    setLoading(true);
    return fetchUser();
  };

  const role = normalizeRole(user?.role);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      role,
      isTourist: isTouristRole(role),
      isHost: isHostRole(role),
      canAccessHostPortal: canAccessHostPortal(role),
      login,
      register,
      logout,
      refreshUser,
      setUser,
    }),
    [user, loading, role, fetchUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
