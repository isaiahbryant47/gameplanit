import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { storage } from '@/lib/storage';
import { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  register: (email: string, password: string, role: User['role']) => User | null;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => false,
  register: () => null,
  logout: () => {},
  loading: true
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storage.seed();
    const sessionId = storage.getSession();
    setUser(storage.allUsers().find((u) => u.id === sessionId) || null);
    setLoading(false);
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    login: (email: string, password: string) => {
      const found = storage.allUsers().find((u) => u.email === email && u.password === password) || null;
      setUser(found);
      storage.setSession(found?.id || null);
      return Boolean(found);
    },
    register: (email: string, password: string, role: User['role']) => {
      const users = storage.allUsers();
      if (users.some((u) => u.email === email)) return null;
      const created: User = { id: crypto.randomUUID(), email, password, role, createdAt: new Date().toISOString() };
      storage.saveUsers([...users, created]);
      storage.setSession(created.id);
      setUser(created);
      return created;
    },
    logout: () => { storage.setSession(null); setUser(null); }
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
