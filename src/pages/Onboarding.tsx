import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { storage } from '@/lib/storage';
import { Profile, Transportation } from '@/lib/types';
import GoalBuilder from '@/components/GoalBuilder';
import { lovable } from '@/integrations/lovable/index';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const transportOptions: { value: Transportation; label: string }[] = [
  { value: 'walk', label: '🚶 Walking' },
  { value: 'public', label: '🚌 Public transit' },
  { value: 'car', label: '🚗 Car' },
  { value: 'mixed', label: '🔀 Mixed' },
];

const hoursOptions = [
  { value: 2, label: '1–2 hours' },
  { value: 4, label: '3–4 hours' },
  { value: 6, label: '5–6 hours' },
  { value: 8, label: '7+ hours' },
];

const budgetOptions = [
  { value: 0, label: 'No budget ($0)' },
  { value: 20, label: 'Up to $20/mo' },
  { value: 50, label: 'Up to $50/mo' },
  { value: 100, label: '$50+/mo' },
];

const responsibilityOptions = [
  { value: 'none', label: 'None' },
  { value: 'sibling_care', label: 'Sibling care' },
  { value: 'part_time_job', label: 'Part-time job' },
  { value: 'household_chores', label: 'Household chores' },
  { value: 'caregiving', label: 'Caregiving for a family member' },
  { value: 'other', label: 'Other' },
];

const interestOptions = [
  { value: 'internships', label: '💼 Internships' },
  { value: 'volunteering', label: '🤝 Volunteering' },
  { value: 'college_help', label: '🎓 College help' },
  { value: 'tutoring', label: '📚 Tutoring' },
  { value: 'technology', label: '💻 Technology' },
  { value: 'arts', label: '🎨 Arts & creativity' },
  { value: 'sports', label: '⚽ Sports & fitness' },
  { value: 'music', label: '🎵 Music' },
  { value: 'leadership', label: '🏅 Leadership' },
  { value: 'entrepreneurship', label: '🚀 Entrepreneurship' },
  { value: 'trades', label: '🔧 Skilled trades' },
  { value: 'mental_health', label: '🧠 Mental health & wellness' },
];

export default function Onboarding() {
  const { register, user } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [f, setF] = useState({
    email: '', password: '', type: 'student' as 'student' | 'caregiver',
    gradeLevel: '9', schoolName: '', zipCode: '', interests: [] as string[],
    timePerWeekHours: 4, budgetPerMonth: 20, transportation: 'public' as Transportation,
    responsibilities: [] as string[], goals: 'career exposure', gpa: '', attendance: ''
  });

  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const valid = schema.safeParse({ email: f.email, password: f.password });
    if (!valid.success) return setError(valid.error.issues[0].message);
    const finalZip = f.zipCode.trim() || '191';
    const current = user || register(f.email, f.password, f.type);
    if (!current) return setError('Email already exists. Login instead.');

    setSubmitting(true);
    const profile: Profile = {
      id: crypto.randomUUID(), userId: current.id, type: f.type, gradeLevel: f.gradeLevel,
      schoolName: f.schoolName || undefined, zipCode: finalZip,
      interests: f.interests,
      constraints: { timePerWeekHours: Number(f.timePerWeekHours), budgetPerMonth: Number(f.budgetPerMonth), transportation: f.transportation, responsibilities: f.responsibilities.filter(r => r !== 'none').join(', ') },
      goals: f.goals.split(',').map(s => s.trim()).filter(Boolean),
      baseline: { gpa: f.gpa ? Number(f.gpa) : undefined, attendance: f.attendance ? Number(f.attendance) : undefined }
    };

    storage.saveProfiles([...storage.allProfiles().filter(p => p.userId !== current.id), profile]);
    setSubmitting(false);
    nav('/recommendations');
  };

  const handleGoalsChange = useCallback((goals: string) => {
    setF(prev => ({ ...prev, goals }));
  }, []);

  const stepTitles = ['Get Started', 'Your World', 'Where You\'re Headed', 'Your Real Life'];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="fixed bottom-4 right-4 z-10">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Onboarding</span>
      </div>
      <div className="w-full max-w-lg rounded-xl bg-card border border-border p-8 shadow-sm space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            {stepTitles.map((t, i) => (
              <span key={t} className={i + 1 <= step ? 'text-primary font-medium' : ''}>{t}</span>
            ))}
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-card-foreground">
          {step === 1 && 'Let\'s get you set up'}
          {step === 2 && 'Tell us about your world'}
          {step === 3 && 'What are you working toward?'}
          {step === 4 && 'What does your week look like?'}
        </h1>
        <p className="text-sm text-muted-foreground -mt-2">
          {step === 1 && 'Set up your login so we can save your plan and keep it just for you.'}
          {step === 2 && 'Tell us a little about where you are right now — it helps us find the right opportunities near you.'}
          {step === 3 && 'What do you want to explore or accomplish? Even a rough idea helps us build something real.'}
          {step === 4 && 'We all juggle different things. Sharing what your schedule and resources look like helps us make a plan that actually fits.'}
        </p>

        <div className="space-y-3">
          {step === 1 && (
            <>
              <div className="flex gap-2">
                {(['student', 'caregiver'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setF({ ...f, type: r })}
                    className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${f.type === r ? 'border-primary bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:bg-secondary'}`}
                  >
                    {r === 'student' ? '🎓 Student' : '👨‍👩‍👧 Caregiver'}
                  </button>
                ))}
              </div>
              <input className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
              <div className="relative">
                <input className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring pr-16" type={showPassword ? 'text' : 'password'} placeholder="Password (min 6 chars)" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <button
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors flex items-center justify-center gap-2"
                onClick={async () => {
                  const { error: err } = await lovable.auth.signInWithOAuth('google', {
                    redirect_uri: window.location.origin,
                  });
                  if (err) setError(err.message || 'Google sign-in failed');
                }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <input className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Grade level" value={f.gradeLevel} onChange={e => setF({ ...f, gradeLevel: e.target.value })} />
                <input className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="ZIP code" value={f.zipCode} onChange={e => setF({ ...f, zipCode: e.target.value })} />
              </div>
              <input className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="School name (optional)" value={f.schoolName} onChange={e => setF({ ...f, schoolName: e.target.value })} />
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">What are you interested in? (select all that apply)</label>
                <div className="grid grid-cols-2 gap-2">
                  {interestOptions.map(o => {
                    const selected = f.interests.includes(o.value);
                    return (
                      <button
                        key={o.value}
                        onClick={() => {
                          const next = selected
                            ? f.interests.filter(i => i !== o.value)
                            : [...f.interests, o.value];
                          setF({ ...f, interests: next });
                        }}
                        className={`rounded-lg border px-3 py-2.5 text-sm text-left transition-colors ${selected ? 'border-primary bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:bg-secondary'}`}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <GoalBuilder
                interests={f.interests}
                gradeLevel={f.gradeLevel}
                initialGoals={f.goals}
                onGoalsChange={handleGoalsChange}
              />
            </>
          )}
          {step === 4 && (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">How many hours per week can you dedicate?</label>
                <div className="grid grid-cols-2 gap-2">
                  {hoursOptions.map(o => (
                    <button
                      key={o.value}
                      onClick={() => setF({ ...f, timePerWeekHours: o.value })}
                      className={`rounded-lg border px-3 py-2.5 text-sm transition-colors ${f.timePerWeekHours === o.value ? 'border-primary bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:bg-secondary'}`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">What's your monthly budget for activities?</label>
                <div className="grid grid-cols-2 gap-2">
                  {budgetOptions.map(o => (
                    <button
                      key={o.value}
                      onClick={() => setF({ ...f, budgetPerMonth: o.value })}
                      className={`rounded-lg border px-3 py-2.5 text-sm transition-colors ${f.budgetPerMonth === o.value ? 'border-primary bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:bg-secondary'}`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">How will you get around?</label>
                <div className="grid grid-cols-2 gap-2">
                  {transportOptions.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setF({ ...f, transportation: t.value })}
                      className={`rounded-lg border px-3 py-2.5 text-sm transition-colors ${f.transportation === t.value ? 'border-primary bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:bg-secondary'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Do you have any responsibilities outside of school? (select all that apply)</label>
                <div className="grid grid-cols-2 gap-2">
                  {responsibilityOptions.map(o => {
                    const selected = f.responsibilities.includes(o.value);
                    return (
                      <button
                        key={o.value}
                        onClick={() => {
                          const next = selected
                            ? f.responsibilities.filter(r => r !== o.value)
                            : [...f.responsibilities.filter(r => o.value === 'none' ? false : r !== 'none'), o.value];
                          setF({ ...f, responsibilities: next });
                        }}
                        className={`rounded-lg border px-3 py-2.5 text-sm transition-colors ${selected ? 'border-primary bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:bg-secondary'}`}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          {step > 1 && (
            <button className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors" onClick={() => { setError(''); setStep(step - 1); }}>
              Back
            </button>
          )}
          {step < 4 ? (
            <button
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
              disabled={step === 3 && !f.goals.trim()}
              onClick={() => { setError(''); setStep(step + 1); }}
            >
              Next
            </button>
          ) : (
            <button disabled={submitting} className="rounded-lg bg-success px-5 py-2.5 text-sm font-medium text-success-foreground hover:opacity-90 transition-opacity disabled:opacity-50" onClick={submit}>
              {submitting ? 'Generating...' : 'Generate My Plan'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
