import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

import API from '../services/api';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  // =========================================================
  // USER STATE
  // =========================================================

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      localStorage.removeItem('user');
      return null;
    }
  });

  // =========================================================
  // PROFILE STATE
  // =========================================================

  const [profile, setProfile] = useState(null);

  // =========================================================
  // TOKEN STATE
  // =========================================================

  const [token, setToken] = useState(
    () => localStorage.getItem('token') || ''
  );

  // =========================================================
  // LOADING STATE
  // =========================================================

  const [loading, setLoading] = useState(true);

  // =========================================================
  // LOGOUT ACTION
  // =========================================================

  const logout = useCallback(
    (showMessage = true) => {
      setToken('');
      setUser(null);
      setProfile(null);
      setLoading(false);

      localStorage.removeItem('token');
      localStorage.removeItem('user');

      if (showMessage) {
        toast.info('Logged out successfully');
      }
    },
    []
  );

  // =========================================================
  // FETCH CURRENT USER (/auth/me)
  // =========================================================

  const fetchMe = useCallback(async () => {
    try {
      setLoading(true);

      const res = await API.get('/auth/me');

      const currentUser = res.data?.user || null;
      const currentProfile = res.data?.profile || null;

      if (!currentUser) {
        throw new Error('User information not found');
      }

      setUser(currentUser);
      setProfile(currentProfile);

      localStorage.setItem(
        'user',
        JSON.stringify(currentUser)
      );

      return currentUser;

    } catch (error) {
      console.error('Fetch user session error:', error);
      logout(false);
      return null;

    } finally {
      setLoading(false);
    }
  }, [logout]);

  // =========================================================
  // CHECK AUTHENTICATION ON INITIAL LOAD / TOKEN CHANGE
  // =========================================================

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetchMe();
  }, [token, fetchMe]);

  // =========================================================
  // LOGIN ACTION
  // =========================================================

  const login = async (email, password) => {
    try {
      const res = await API.post('/auth/login', {
        email,
        password,
      });

      const jwtToken = res.data?.token;
      const userData = res.data?.user;

      if (!jwtToken || !userData) {
        throw new Error('Invalid login response from server');
      }

      setToken(jwtToken);
      setUser(userData);

      localStorage.setItem('token', jwtToken);
      localStorage.setItem(
        'user',
        JSON.stringify(userData)
      );

      toast.success(
        `Welcome back, ${userData.name || 'User'}!`
      );

      return userData;

    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Login failed';

      toast.error(message);
      throw new Error(message);
    }
  };

  // =========================================================
  // REGISTER ACTION
  // =========================================================

  const register = async (formData) => {
    try {
      const res = await API.post(
        '/auth/register',
        formData
      );

      const jwtToken = res.data?.token;
      const userData = res.data?.user;

      if (!jwtToken || !userData) {
        throw new Error(
          'Invalid registration response from server'
        );
      }

      setToken(jwtToken);
      setUser(userData);

      localStorage.setItem('token', jwtToken);
      localStorage.setItem(
        'user',
        JSON.stringify(userData)
      );

      toast.success(
        'Registration successful! Welcome aboard.'
      );

      return userData;

    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Registration failed';

      toast.error(message);
      throw new Error(message);
    }
  };

  // =========================================================
  // DERIVED VALUES (Memoized for performance optimization)
  // =========================================================

  const role = useMemo(() => user?.role || null, [user]);

  const isAuthenticated = useMemo(
    () => Boolean(token && user),
    [token, user]
  );

  // =========================================================
  // CONTEXT VALUE
  // =========================================================

  const value = useMemo(
    () => ({
      user,
      profile,
      token,
      role,
      loading,
      isAuthenticated,

      login,
      register,
      logout,
      fetchMe,
    }),
    [user, profile, token, role, loading, isAuthenticated, fetchMe]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};