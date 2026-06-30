import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { tokenStorage, authApi } from '../services/api';
import { checkPermission } from '../utils/permissions';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // ── Bootstrap: verify token on mount ────────────────────────────────────────
  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) {
      setLoading(false);
      return;
    }

    authApi
      .getMe()
        .then((res) => {
          const freshUser = res.data.user;
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        })
        .catch(() => {
          // Token invalid / expired and refresh failed — clear everything
          tokenStorage.clear();
          setUser(null);
        })
        .finally(() => setLoading(false));
  }, []);

  // ── Listen for forced logout events from the API interceptor ─────────────────
  useEffect(() => {
    const handleForceLogout = () => {
      tokenStorage.clear();
      setUser(null);
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  // ── login: called after successful API login ───────────────────────────────
  const login = useCallback((accessToken, userData) => {
    tokenStorage.set(accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  // ── logout: calls API then clears local state ──────────────────────────────
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore errors — clear state regardless
    } finally {
      tokenStorage.clear();
      setUser(null);
    }
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Check if the current user has a specific role.
   * @param {...string} roles
   */
  const hasRole = useCallback(
    (...roles) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  /**
   * Check if the current user has a specific permission.
   * Permission format: 'resource:action' e.g. 'products:create'
   * Falls back to role-based check until M2 permission config is in place.
   * @param {string} permission
   */
  const hasPermission = useCallback(
    (permission) => {
      return checkPermission(user, permission);
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
