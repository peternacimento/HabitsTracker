import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tenta carregar stats (se tem cookie válido, retorna dados)
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const result = await api.getMe();
      if (result?.user) {
        setUser(result.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const result = await api.login({ email, password });
    setUser(result.user);
    return result;
  }

  async function register(email, password, username) {
    const result = await api.register({ email, password, username });
    setUser(result.user);
    return result;
  }

  async function logout() {
    await api.logout();
    setUser(null);
  }

  async function refreshStats() {
    try {
      const stats = await api.getStats();
      if (stats) {
        setUser((prev) => (prev ? { ...prev, ...stats } : prev));
      }
      return stats;
    } catch {
      return null;
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshStats }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
