import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('tsl_token') || null);
  const [loading, setLoading] = useState(true);

  // Validate existing token on mount
  useEffect(() => {
    const validateSession = async () => {
      const storedToken = localStorage.getItem('tsl_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await authService.getMe();
        if (data.success) {
          setUser(data.user);
          setToken(storedToken);
        } else {
          clearAuth();
        }
      } catch (err) {
        // Only clear authentication if it is explicitly invalid/expired (401/403)
        // If the server is restarting, offline, or returns 500, preserve the cached session
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          clearAuth();
        } else {
          try {
            const cached = localStorage.getItem('tsl_user');
            if (cached) {
              const u = JSON.parse(cached);
              setUser(u);
              setToken(storedToken);
            } else {
              clearAuth();
            }
          } catch {
            clearAuth();
          }
        }
      } finally {
        setLoading(false);
      }
    };

    validateSession();
  }, []);

  const clearAuth = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('tsl_token');
    localStorage.removeItem('tsl_user');
  };

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password);
    if (data.success) {
      localStorage.setItem('tsl_token', data.token);
      localStorage.setItem('tsl_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  }, []);

  const register = useCallback(async (registerData) => {
    const data = await authService.register(registerData);
    if (data.success) {
      localStorage.setItem('tsl_token', data.token);
      localStorage.setItem('tsl_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    clearAuth();
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('tsl_user', JSON.stringify(updatedUser));
  }, []);

  const hasPermission = useCallback(
    (permissionName) => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      return user.permissions && user.permissions.includes(permissionName);
    },
    [user]
  );

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    role: user?.role || null,
    permissions: user?.permissions || [],
    login,
    register,
    logout,
    updateUser,
    hasPermission
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
