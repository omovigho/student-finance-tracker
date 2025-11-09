import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api, { clearStoredTokens, setAuthLogoutHandler } from '../api/api.js';
import { useToast } from '../components/Toast.jsx';

export const AuthContext = createContext({
  user: null,
  isBootstrapping: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshUser: async () => {}
});

const hasTokens = () => {
  const access = localStorage.getItem('access_token');
  const refresh = localStorage.getItem('refresh_token');
  return Boolean(access && refresh);
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pushToast } = useToast();

  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const fetchProfile = useCallback(async () => {
    const { data } = await api.get('/api/users/me/');
    setUser(data);
    return data;
  }, []);

  const logout = useCallback(() => {
    clearStoredTokens();
    setUser(null);
    navigate('/auth/login', { replace: true });
  }, [navigate]);

  useEffect(() => {
    setAuthLogoutHandler(() => {
      pushToast('Your session expired. Please sign in again.', 'info');
      logout();
    });
  }, [logout, pushToast]);

  const refreshUser = useCallback(async () => {
    if (!hasTokens()) {
      setUser(null);
      return null;
    }

    try {
      return await fetchProfile();
    } catch (error) {
      if (error?.response?.status === 401) {
        clearStoredTokens();
        setUser(null);
      }
      throw error;
    }
  }, [fetchProfile]);

  useEffect(() => {
    const initialise = async () => {
      if (!hasTokens()) {
        setIsBootstrapping(false);
        return;
      }
      try {
        await refreshUser();
      } catch (error) {
        // Errors are handled inside refreshUser to keep the bootstrap flow resilient.
      } finally {
        setIsBootstrapping(false);
      }
    };

    initialise();
  }, [refreshUser]);

  const login = useCallback(
    async (credentials) => {
      setIsAuthenticating(true);
      try {
        const { data } = await api.post('/api/auth/token/', credentials, { skipAuthRefresh: true });
        localStorage.setItem('access_token', data?.access ?? '');
        localStorage.setItem('refresh_token', data?.refresh ?? '');
        const profile = await fetchProfile();
        pushToast(`Welcome back${profile?.first_name ? `, ${profile.first_name}` : ''}!`, 'success');
        const redirectTo = location.state?.from?.pathname ?? '/dashboard';
        navigate(redirectTo, { replace: true });
      } catch (error) {
        pushToast('Unable to sign in. Check your credentials and try again.', 'error');
        throw error;
      } finally {
        setIsAuthenticating(false);
      }
    },
    [fetchProfile, location.state, navigate, pushToast]
  );

  const register = useCallback(
    async (payload) => {
      try {
        await api.post('/api/auth/register/', payload, { skipAuthRefresh: true });
        pushToast('Account created successfully. Please sign in.', 'success');
        navigate('/auth/login');
      } catch (error) {
        pushToast('Unable to create account. Please review the form.', 'error');
        throw error;
      }
    },
    [navigate, pushToast]
  );

  const value = useMemo(
    () => ({
      user,
      isBootstrapping,
      isAuthenticating,
      login,
      register,
      logout,
      refreshUser
    }),
    [user, isBootstrapping, isAuthenticating, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
