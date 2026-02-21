import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
  login: (email: string, password: string) => Promise<{ error?: string }>;
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
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    return (data?.role as AppRole) || 'student';
  } catch (e) {
    console.error('fetchRole error:', e);
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
  const initialSessionHandled = useRef(false);

  useEffect(() => {
    // Set up listener BEFORE getSession per Supabase best practices
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Skip the INITIAL_SESSION event — handled by getSession below
        if (!initialSessionHandled.current && event === 'INITIAL_SESSION') return;

        if (session?.user) {
          try {
            const authUser = await buildAuthUser(session.user);
            setUser(authUser);
          } catch (e) {
            console.error('buildAuthUser error:', e);
            setUser({ id: session.user.id, email: session.user.email || '', role: 'student' });
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Then check current session (single source for initial load)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        try {
          const authUser = await buildAuthUser(session.user);
          setUser(authUser);
        } catch (e) {
          console.error('buildAuthUser error:', e);
          setUser({ id: session.user.id, email: session.user.email || '', role: 'student' });
        }
      }
      initialSessionHandled.current = true;
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
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
