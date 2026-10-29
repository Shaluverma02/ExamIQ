import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import API, { SESSION_EXPIRED_EVENT } from '../services/api';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

const readJsonStorage = (key, fallback = null) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    localStorage.removeItem(key);
    return fallback;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => sessionStorage.getItem('token') || localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => (
    sessionStorage.getItem('token') || localStorage.getItem('token')
      ? readJsonStorage('user', null)
      : null
  ));
  const [profile, setProfile] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [activeCollege, setActiveCollege] = useState(() => readJsonStorage('activeCollege', null));
  const [loading, setLoading] = useState(true);

  const persistCollege = (college) => {
    setActiveCollege(college || null);
    if (college) localStorage.setItem('activeCollege', JSON.stringify(college));
    else localStorage.removeItem('activeCollege');
  };

  const applyAuthPayload = (data, rememberMe = true) => {
    const jwtToken = data?.token;
    const userData = data?.user;
    const nextMemberships = data?.memberships || [];
    const nextCollege = data?.activeCollege || nextMemberships[0]?.collegeId || null;

    if (!userData) throw new Error('Invalid response from server');

    if (jwtToken) {
      setToken(jwtToken);
      if (rememberMe) {
        localStorage.setItem('token', jwtToken);
        sessionStorage.removeItem('token');
      } else {
        sessionStorage.setItem('token', jwtToken);
        localStorage.removeItem('token');
      }
    }

    setUser(userData);
    setMemberships(nextMemberships);
    persistCollege(nextCollege);
    localStorage.setItem('user', JSON.stringify(userData));

    return userData;
  };

  const logout = useCallback((showMessage = true) => {
    setToken('');
    setUser(null);
    setProfile(null);
    setMemberships([]);
    setActiveCollege(null);
    setLoading(false);

    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeCollege');

    if (showMessage) toast.info('Logged out successfully');
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get('/auth/me');
      const currentUser = applyAuthPayload({
        user: res.data?.user,
        memberships: res.data?.memberships || [],
        activeCollege: res.data?.activeCollege || null,
      });
      setProfile(res.data?.profile || null);
      return currentUser;
    } catch (error) {
      console.error('Fetch user session error:', error);
      if ([401, 403].includes(error.response?.status)) {
        logout(false);
        return null;
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    const handleSessionExpired = () => logout(false);
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, [logout]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetchMe();
  }, [token, fetchMe]);

  const login = async (email, password, rememberMe = true) => {
    try {
      const res = await API.post('/auth/login', { email, password });
      const userData = applyAuthPayload(res.data, rememberMe);
      toast.success(`Welcome back, ${userData.name || 'User'}!`);
      return userData;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      toast.error(message);
      throw new Error(message);
    }
  };

  const register = async (formData) => {
    try {
      const res = await API.post('/auth/register', formData);
      const userData = res.data?.user;
      if (!userData) throw new Error('Invalid registration response from server');

      if (!res.data?.token) {
        if (res.data?.activeCollege) persistCollege(res.data.activeCollege);
        setMemberships(res.data?.memberships || []);
        toast.success(res.data?.message || 'Registration successful. Please verify your email address.');
        return {
          ...userData,
          pendingVerification: true,
          phoneVerificationRequired: Boolean(res.data?.phoneVerificationRequired),
        };
      }

      const appliedUser = applyAuthPayload(res.data);
      toast.success('Registration successful! Welcome aboard.');
      return appliedUser;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      toast.error(message);
      throw new Error(message);
    }
  };

  const changePassword = async (formData) => {
    const rememberMe = !sessionStorage.getItem('token');
    const response = await API.put('/auth/change-password', formData);
    applyAuthPayload(response.data, rememberMe);
    return response.data.message;
  };

  const switchCollege = async (collegeId) => {
    const res = await API.post('/colleges/switch', { collegeId });
    const nextCollege = res.data?.activeCollege;
    if (nextCollege) {
      persistCollege(nextCollege);
      await fetchMe();
      toast.success(`Switched to ${nextCollege.name}`);
    }
    return nextCollege;
  };

  const role = useMemo(() => user?.role || null, [user]);
  const isAuthenticated = useMemo(() => Boolean(token && user), [token, user]);

  const value = useMemo(() => ({
    user,
    profile,
    memberships,
    activeCollege,
    token,
    role,
    loading,
    isAuthenticated,
    login,
    register,
    changePassword,
    logout,
    fetchMe,
    switchCollege,
    setUser,
  }), [user, profile, memberships, activeCollege, token, role, loading, isAuthenticated, fetchMe, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
