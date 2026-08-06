import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

// /admin and /staff share the privileged session; everything else is the
// customer app. Without /staff here the staff panel would restore whatever
// customer token happened to be in storage and act as that customer.
const isStaffOrAdminPath = () =>
  window.location.pathname.startsWith('/admin') ||
  window.location.pathname.startsWith('/staff');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('tsl_token') || null);
  const [loading, setLoading] = useState(true);

  // Validate existing token on mount (Route-Aware: Customer vs Admin)
  useEffect(() => {
    const validateSession = async () => {
      const isPathAdmin = isStaffOrAdminPath();

      let storedToken = localStorage.getItem('tsl_token');
      const customerToken = localStorage.getItem('tsl_customer_token');
      const adminToken = localStorage.getItem('tsl_admin_token');

      // Select target token based on current route type
      let targetToken = storedToken;
      if (isPathAdmin && adminToken) {
        targetToken = adminToken;
      } else if (!isPathAdmin && customerToken) {
        targetToken = customerToken;
      }

      if (!targetToken) {
        setLoading(false);
        return;
      }

      // Sync active token for axios apiClient
      localStorage.setItem('tsl_token', targetToken);

      try {
        const data = await authService.getMe();
        if (data.success) {
          setUser(data.user);
          setToken(targetToken);

          // Keep the shared key pointing at the identity actually in use here,
          // so consumers still reading `tsl_user` don't see a stale role.
          localStorage.setItem('tsl_user', JSON.stringify(data.user));

          // Store scoped session backup
          if (data.user.role === 'admin' || data.user.role === 'staff') {
            localStorage.setItem('tsl_admin_token', targetToken);
            localStorage.setItem('tsl_admin_user', JSON.stringify(data.user));
          } else {
            localStorage.setItem('tsl_customer_token', targetToken);
            localStorage.setItem('tsl_customer_user', JSON.stringify(data.user));
          }
        } else {
          clearAuth();
        }
      } catch (err) {
        // Only clear authentication if explicitly invalid/expired (401/403)
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          clearAuth();
        } else {
          try {
            const cachedKey = (!isPathAdmin && localStorage.getItem('tsl_customer_user'))
              ? 'tsl_customer_user'
              : (isPathAdmin && localStorage.getItem('tsl_admin_user') ? 'tsl_admin_user' : 'tsl_user');
            const cached = localStorage.getItem(cachedKey);
            if (cached) {
              const u = JSON.parse(cached);
              setUser(u);
              setToken(targetToken);
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

    const isPathAdmin = isStaffOrAdminPath();
    const scopedTokenKey = isPathAdmin ? 'tsl_admin_token' : 'tsl_customer_token';
    const scopedToken = localStorage.getItem(scopedTokenKey);

    if (isPathAdmin) {
      localStorage.removeItem('tsl_admin_token');
      localStorage.removeItem('tsl_admin_user');
    } else {
      localStorage.removeItem('tsl_customer_token');
      localStorage.removeItem('tsl_customer_user');
    }

    // Only drop the shared keys if they belong to the session being cleared.
    // A failed customer session used to sign the admin out of its own tab.
    const sharedToken = localStorage.getItem('tsl_token');
    if (!sharedToken || !scopedToken || sharedToken === scopedToken) {
      localStorage.removeItem('tsl_token');
      localStorage.removeItem('tsl_user');
    }
  };

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password);
    if (data.success) {
      localStorage.setItem('tsl_token', data.token);
      localStorage.setItem('tsl_user', JSON.stringify(data.user));

      if (data.user?.role === 'admin' || data.user?.role === 'staff') {
        localStorage.setItem('tsl_admin_token', data.token);
        localStorage.setItem('tsl_admin_user', JSON.stringify(data.user));
      } else {
        localStorage.setItem('tsl_customer_token', data.token);
        localStorage.setItem('tsl_customer_user', JSON.stringify(data.user));
      }

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
      localStorage.setItem('tsl_customer_token', data.token);
      localStorage.setItem('tsl_customer_user', JSON.stringify(data.user));
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
    isCustomer: !!user && !!token && user.role !== 'staff' && user.role !== 'admin',
    isStaff: !!user && !!token && user.role === 'staff',
    isAdmin: !!user && !!token && user.role === 'admin',
    role: user?.role || null,
    permissions: user?.permissions || [],
    login,
    register,
    logout,
    clearAuth,
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
