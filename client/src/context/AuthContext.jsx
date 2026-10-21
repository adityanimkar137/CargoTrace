import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    user: null,
    organization: null,
    role: null,
    permissions: [],
    organizations: [],
    loading: true,
    error: null,
    dbUnavailable: false
  });

  const checkAuth = useCallback(async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null, dbUnavailable: false }));
    try {
      const response = await apiClient.get('/auth/me');
      setAuthState({
        user: response.user,
        organization: response.organization,
        role: response.role,
        permissions: response.permissions || [],
        organizations: response.organizations || [],
        loading: false,
        error: null,
        dbUnavailable: false
      });
    } catch (err) {
      if (err.status === 401) {
        setAuthState({
          user: null,
          organization: null,
          role: null,
          permissions: [],
          organizations: [],
          loading: false,
          error: null,
          dbUnavailable: false
        });
      } else if (err.status === 503 || err.code === 'DATABASE_UNAVAILABLE') {
        setAuthState({
          user: null,
          organization: null,
          role: null,
          permissions: [],
          organizations: [],
          loading: false,
          error: err.message || 'Database is not connected',
          dbUnavailable: true
        });
      } else {
        setAuthState({
          user: null,
          organization: null,
          role: null,
          permissions: [],
          organizations: [],
          loading: false,
          error: err.message,
          dbUnavailable: false
        });
      }
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const hasPermission = (permission) => {
    return Boolean(authState.permissions && authState.permissions.includes(permission));
  };

  const login = async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    if (response.token) {
      apiClient.setToken(response.token);
    }
    setAuthState({
      user: response.user,
      organization: response.organization,
      role: response.role,
      permissions: response.permissions || [],
      organizations: [response.organization],
      loading: false,
      error: null,
      dbUnavailable: false
    });
    return response;
  };

  const register = async ({ email, password, displayName, organizationName }) => {
    const response = await apiClient.post('/auth/register', {
      email,
      password,
      displayName,
      organizationName
    });
    if (response.token) {
      apiClient.setToken(response.token);
    }
    setAuthState({
      user: response.user,
      organization: response.organization,
      role: response.role,
      permissions: response.permissions || [],
      organizations: [response.organization],
      loading: false,
      error: null,
      dbUnavailable: false
    });
    return response;
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // Ignore logout errors
    } finally {
      apiClient.clearToken();
      setAuthState({
        user: null,
        organization: null,
        role: null,
        permissions: [],
        organizations: [],
        loading: false,
        error: null,
        dbUnavailable: false
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        role: authState.role || 'viewer',
        actualRole: authState.role,
        permissions: authState.permissions || [],
        hasPermission,
        isRoleSimulated: false,
        isAuthenticated: Boolean(authState.user && authState.organization),
        login,
        register,
        logout,
        refreshAuth: checkAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
