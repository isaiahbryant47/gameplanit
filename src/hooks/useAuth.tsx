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

  // On mount: check existing session
  useEffect(() => {
    let cancelled = false;

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;

        if (session?.user) {
          const authUser = await buildAuthUser(session.user);
          if (!cancelled) setUser(authUser);
        }
      } catch (e) {
        console.error('initSession error:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void initSession();

    // Listen for sign-out and token refresh events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return;

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Re-fetch role on token refresh in case it changed
          try {
            const authUser = await buildAuthUser(session.user);
            if (!cancelled) setUser(authUser);
          } catch {
            // keep existing user state
          }
        }
      }
    );

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
