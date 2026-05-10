import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export type AppRole = 'student' | 'caregiver' | 'partner_admin';

export interface AuthUser {
  id: string;
  email: string;
  role: AppRole;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string; user?: AuthUser }>;
  register: (email: string, password: string) => Promise<{ error?: string; user?: AuthUser }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ error: 'Not initialized' }),
  register: async () => ({ error: 'Not initialized' }),
  logout: async () => {},
});

async function fetchRole(userId: string): Promise<AppRole> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error('fetchRole query error:', error);
      return 'student';
    }
    return (data?.role as AppRole) || 'student';
  } catch (e) {
    console.error('fetchRole exception:', e);
    return 'student';
  }
}

async function buildAuthUser(supaUser: SupabaseUser): Promise<AuthUser> {
  const role = await fetchRole(supaUser.id);
  return {
    id: supaUser.id,
    email: supaUser.email || '',
    role,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let sessionRequestId = 0;

    const applySession = async (sessionUser: SupabaseUser | null) => {
      const requestId = ++sessionRequestId;
      try {
        if (!sessionUser) {
          if (!cancelled && requestId === sessionRequestId) setUser(null);
          return;
        }

        const authUser = await buildAuthUser(sessionUser);
        if (!cancelled && requestId === sessionRequestId) setUser(authUser);
      } catch (e) {
        console.error('applySession error:', e);
        if (!cancelled && requestId === sessionRequestId) setUser(null);
      } finally {
        if (!cancelled && requestId === sessionRequestId) setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Defer role/profile lookups so the auth client can finish persisting the session first.
        setTimeout(() => {
          if (!cancelled) void applySession(session?.user ?? null);
        }, 0);
      }
    );

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        await applySession(session?.user ?? null);
      } catch (e) {
        console.error('initSession error:', e);
        if (!cancelled) setLoading(false);
      }
    };

    void initSession();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    if (data.user) {
      const authUser = await buildAuthUser(data.user);
      setUser(authUser);
      return { user: authUser };
    }
    return { error: 'Login succeeded but no user was returned.' };
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) return { error: error.message };

    if (data.user) {
      const authUser = await buildAuthUser(data.user);
      setUser(authUser);
      return { user: authUser };
    }
    return {};
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
  }), [user, loading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
