import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.auth.getMe();
      setUser(data.user);
    } catch {
      localStorage.removeItem('intervai_token');
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('intervai_token');
    if (!token) {
      setLoading(false);
      return;
    }
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  async function login(email, password) {
    const data = await api.auth.login({ email, password });
    localStorage.setItem('intervai_token', data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(payload) {
    const data = await api.auth.register(payload);
    localStorage.setItem('intervai_token', data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('intervai_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
