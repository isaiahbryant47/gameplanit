import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl bg-card border border-border p-8 shadow-sm space-y-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-card-foreground">Forgot password?</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              If an account exists for <span className="font-medium text-foreground">{email}</span>,
              you'll receive a password reset email shortly.
            </p>
            <Link to="/login" className="text-sm text-primary font-medium hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }}
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
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary font-medium hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
