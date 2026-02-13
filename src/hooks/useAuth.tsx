import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
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
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .limit(1)
    .single();
  return (data?.role as AppRole) || 'student';
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
    // Set up listener BEFORE getSession per Supabase best practices
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const authUser = await buildAuthUser(session.user);
          setUser(authUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Then check current session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const authUser = await buildAuthUser(session.user);
        setUser(authUser);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    login: async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return {};
    },
    register: async (email: string, password: string) => {
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
    },
    logout: async () => {
      await supabase.auth.signOut();
      setUser(null);
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
