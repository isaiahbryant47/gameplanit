import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/** Wraps a protected page – waits for session restore before redirecting. */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return null; // session still restoring
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
