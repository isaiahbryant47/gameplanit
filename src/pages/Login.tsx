import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

type Step = 'phone' | 'code';

function normalizePhone(raw: string): string {
  const trimmed = raw.trim().replace(/[\s\-().]/g, '');
  if (trimmed.startsWith('+')) return trimmed;
  // Default to US country code if user typed a 10-digit number
  if (/^\d{10}$/.test(trimmed)) return `+1${trimmed}`;
  return trimmed;
}

export default function Login() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<Step>('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  if (authLoading) return null;
  if (user) {
    navigate(user.role === 'partner_admin' ? '/partner' : '/dashboard', { replace: true });
    return null;
  }

  const handleSendCode = async () => {
    setError('');
    const normalized = normalizePhone(phone);
    if (!/^\+\d{8,15}$/.test(normalized)) {
      setError('Enter a valid phone number including country code (e.g. +15551234567).');
      return;
    }

    setLoading(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: normalized,
    });
    setLoading(false);

    if (otpError) {
      setError(otpError.message);
      return;
    }
    setPhone(normalized);
    setStep('code');
  };

  const handleVerify = async () => {
    setError('');
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the 6-digit code we sent you.');
      return;
    }

    setLoading(true);
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone,
      token: code.trim(),
      type: 'sms',
    });
    setLoading(false);

    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    if (data.session) {
      // Auth context listener will pick up the session; navigate to dashboard.
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="fixed bottom-4 right-4 z-10">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Login</span>
      </div>
      <div className="w-full max-w-md rounded-xl bg-card border border-border p-8 shadow-sm space-y-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-card-foreground">
            {step === 'phone' ? 'Sign in with your phone' : 'Enter your code'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {step === 'phone'
              ? "We'll text you a 6-digit code to sign in."
              : `Code sent to ${phone}`}
          </p>
        </div>

        {step === 'phone' ? (
          <form
            className="space-y-3"
            onSubmit={(e) => { e.preventDefault(); void handleSendCode(); }}
          >
            <input
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              type="tel"
              autoComplete="tel"
              placeholder="Phone number (e.g. +15551234567)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Sending code…' : 'Send code'}
            </button>
          </form>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(e) => { e.preventDefault(); void handleVerify(); }}
          >
            <input
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring tracking-widest text-center"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Verifying…' : 'Verify & sign in'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('phone'); setCode(''); setError(''); }}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              Use a different phone number
            </button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/onboarding" className="text-primary font-medium hover:underline">Get started</Link>
        </p>
      </div>
    </div>
  );
}
