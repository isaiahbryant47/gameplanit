import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    if (login(email, password)) {
      const users = JSON.parse(localStorage.getItem('gp_users') || '[]');
      const u = users.find((u: { email: string }) => u.email === email);
      if (u?.role === 'partner_admin') navigate('/partner');
      else navigate('/dashboard');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl bg-card border border-border p-8 shadow-sm space-y-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-card-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your GameplanIT account</p>
        </div>
        <div className="space-y-3">
          <input
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          onClick={handleLogin}
        >
          Sign in
        </button>
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/onboarding" className="text-primary font-medium hover:underline">Get started</Link>
        </p>
      </div>
    </div>
  );
}
