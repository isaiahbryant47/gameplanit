import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Redirect once authenticated
  useEffect(() => {
    if (user) {
      navigate(user.role === 'partner_admin' ? '/partner' : '/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async () => {
    setError('');
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError('Please enter both your email and password.');
      return;
    }

    setLoading(true);
    const result = await login(normalizedEmail, password);
    setLoading(false);

    if (result.error) {
      if (result.error.toLowerCase().includes('invalid login credentials')) {
        setError('We could not sign you in. Double-check your email/password or reset your password if needed.');
      } else {
        setError(result.error);
      }
    }
    // Navigation happens via auth state change + redirect logic in pages
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="fixed bottom-4 right-4 z-10">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Login</span>
      </div>
      <div className="w-full max-w-md rounded-xl bg-card border border-border p-8 shadow-sm space-y-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-card-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your GameplanIT account</p>
        </div>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void handleLogin();
          }}
        >
          <input
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        {import.meta.env.DEV && (
          <button
            type="button"
            className="w-full rounded-lg border border-border bg-muted px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
            onClick={() => {
              setEmail('student@gameplanit.org');
              setPassword('student1234');
            }}
          >
            ⚡ Fill test credentials
          </button>
        )}
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/forgot-password" className="text-primary font-medium hover:underline">Forgot password?</Link>
        </p>
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/onboarding" className="text-primary font-medium hover:underline">Get started</Link>
        </p>
      </div>
    </div>
  );
}
