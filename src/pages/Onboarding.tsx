import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { storage } from '@/lib/storage';
import { Profile, Transportation, CareerDomain, CareerPath } from '@/lib/types';
import { generateLLMPlan } from '@/lib/llmPlanService';
import type { Plan } from '@/lib/types';
import GoalBuilder from '@/components/GoalBuilder';
import CareerSelector from '@/components/CareerSelector';
import { createUserPathway } from '@/lib/pathwayService';

import { toast } from 'sonner';
import { Sparkles, Loader2 } from 'lucide-react';

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

const targetDateOptions = [
  { value: '3_months', label: '~3 months' },
  { value: '6_months', label: '~6 months' },
  { value: '1_year', label: '~1 year' },
  { value: 'not_sure', label: 'Not sure yet' },
];

export default function Onboarding() {
  const { register, user } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(user ? 2 : 1);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [f, setF] = useState({
    email: '', password: '', type: 'student' as 'student' | 'caregiver',
    gradeLevel: '9', schoolName: '', zipCode: '', interests: [] as string[],
    timePerWeekHours: 4, budgetPerMonth: 20, transportation: 'public' as Transportation,
    responsibilities: [] as string[], goals: 'career exposure', gpa: '', attendance: '',
    // Career-first fields
    selectedDomain: null as CareerDomain | null,
    selectedCareerPath: null as CareerPath | null,
    outcomeStatement: '',
    targetDate: '',
    domainBaseline: {} as Record<string, string>,
  });

  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    let currentUserId = user?.id;
    if (!currentUserId) {
      const valid = schema.safeParse({ email: f.email, password: f.password });
      if (!valid.success) return setError(valid.error.issues[0].message);
    }
    const finalZip = f.zipCode.trim() || '00000';
    if (!/^\d{5}$/.test(finalZip)) {
      setError('Please enter a valid 5-digit ZIP code');
      return;
    }

    setSubmitting(true);
    setError('');

    if (!currentUserId) {
      const result = await register(f.email, f.password);
      if (result.error) {
        setSubmitting(false);
        return setError(result.error);
      }
      if (result.user) {
        currentUserId = result.user.id;
      } else {
        setSubmitting(false);
        return setError('Check your email to confirm your account, then sign in.');
      }
    }

    if (!currentUserId) {
      setSubmitting(false);
      return setError('Unable to create account. Please try again.');
    }

    // Save profile to Supabase
    const constraintsJson = {
      timePerWeekHours: Number(f.timePerWeekHours),
      budgetPerMonth: Number(f.budgetPerMonth),
      transportation: f.transportation,
      responsibilities: f.responsibilities.filter(r => r !== 'none').join(', '),
    };
    const baselineJson = {
      gpa: f.gpa ? Number(f.gpa) : undefined,
      attendance: f.attendance ? Number(f.attendance) : undefined,
    };

    await supabase.from('profiles').upsert({
      user_id: currentUserId,
      type: f.type,
      grade_level: f.gradeLevel,
      school_name: f.schoolName || null,
      zip_code: finalZip,
      interests: f.interests,
      constraints_json: constraintsJson,
      goals: f.goals.split(',').map(s => s.trim()).filter(Boolean),
      baseline_json: baselineJson,
      career_path_id: f.selectedCareerPath?.id || null,
      outcome_statement: f.outcomeStatement || null,
      target_date: f.targetDate || null,
      domain_baseline: Object.keys(f.domainBaseline).length > 0 ? f.domainBaseline : {},
    }, { onConflict: 'user_id' });

    // Also save to localStorage for backward compat
    const profile: Profile = {
      id: crypto.randomUUID(), userId: currentUserId, type: f.type, gradeLevel: f.gradeLevel,
      schoolName: f.schoolName || undefined, zipCode: finalZip,
      interests: f.interests,
      constraints: constraintsJson,
      goals: f.goals.split(',').map(s => s.trim()).filter(Boolean),
      baseline: { gpa: f.gpa ? Number(f.gpa) : undefined, attendance: f.attendance ? Number(f.attendance) : undefined },
      careerPathId: f.selectedCareerPath?.id,
      careerDomainName: f.selectedDomain?.name,
      careerPathName: f.selectedCareerPath?.name,
      outcomeStatement: f.outcomeStatement || undefined,
      targetDate: f.targetDate || undefined,
      domainBaseline: Object.keys(f.domainBaseline).length > 0 ? f.domainBaseline : undefined,
    };
    storage.saveProfiles([...storage.allProfiles().filter(p => p.userId !== currentUserId), profile]);

    // Generate plan
    toast.info('Building your personalized plan with AI...');
    try {
      const result = await generateLLMPlan(profile, currentUserId);
      const localWeeks = result.weeks.map((w) => ({
        id: crypto.randomUUID(),
        planId: result.planId,
        weekNumber: w.week,
        focus: w.focus,
        actions: w.actions.map(a => a.task),
        resources: w.actions.map(a => a.resource),
        milestones: [w.milestone],
      }));
      const planObj: Plan = {
        id: result.planId,
        userId: currentUserId,
        profileId: profile.id,
        title: `12-Week Plan: ${profile.careerPathName || profile.goals.join(' & ')}`,
        createdAt: new Date().toISOString(),
        weeks: localWeeks,
        careerPathId: profile.careerPathId,
        cycleNumber: 1,
        outcomeStatement: profile.outcomeStatement,
        targetDate: profile.targetDate,
      };
      storage.savePlans([...storage.allPlans().filter(p => p.userId !== currentUserId), planObj]);
      localStorage.setItem(`gp_structured_weeks_${currentUserId}`, JSON.stringify(result.weeks));
      toast.success('Your personalized plan is ready!');
    } catch (err) {
      console.error('Plan generation failed:', err);
      toast.error('Plan generation had an issue — you can regenerate from your dashboard.');
    }

    setSubmitting(false);
    nav('/dashboard');
  };

  const handleGoalsChange = useCallback((goals: string) => {
    setF(prev => ({ ...prev, goals }));
  }, []);

  const handleCareerSelect = useCallback((domain: CareerDomain, path: CareerPath) => {
    setF(prev => ({ ...prev, selectedDomain: domain, selectedCareerPath: path }));
  }, []);

  const stepTitles = ['Get Started', 'Your World', 'Your Career Path', 'Your Real Life'];

  const canProceedStep3 = f.selectedCareerPath !== null;

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
          {step === 3 && 'Choose your career direction'}
          {step === 4 && 'What does your week look like?'}
        </h1>
        <p className="text-sm text-muted-foreground -mt-2">
          {step === 1 && 'Set up your login so we can save your plan and keep it just for you.'}
          {step === 2 && 'Tell us a little about where you are right now — it helps us find the right opportunities near you.'}
          {step === 3 && 'Select a career domain and specific career path. The more specific you are, the stronger your pathway plan becomes.'}
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
            </>
          )}
          {step === 3 && (
            <>
              {/* Career Selector */}
              <CareerSelector
                onSelect={handleCareerSelect}
                selectedPathId={f.selectedCareerPath?.id}
                selectedDomainId={f.selectedDomain?.id}
              />

              {/* Step C: Define Outcome */}
              {f.selectedCareerPath && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <p className="text-[11px] text-muted-foreground/70">The more specific you are, the stronger your pathway plan becomes.</p>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      What specific outcome are you aiming for?
                    </label>
                    <textarea
                      className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      rows={2}
                      placeholder={`e.g., "Complete a ${f.selectedCareerPath.name}-related project or get shadowing experience by the end of this cycle"`}
                      value={f.outcomeStatement}
                      onChange={e => setF({ ...f, outcomeStatement: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">When do you want to reach this?</label>
                    <div className="grid grid-cols-2 gap-2">
                      {targetDateOptions.map(o => (
                        <button
                          key={o.value}
                          onClick={() => setF({ ...f, targetDate: o.value })}
                          className={`rounded-lg border px-3 py-2.5 text-sm transition-colors ${f.targetDate === o.value ? 'border-primary bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:bg-secondary'}`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Baseline info (optional) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Experience level (optional)</label>
                      <input className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="e.g., Beginner" value={f.domainBaseline.experienceLevel || ''} onChange={e => setF({ ...f, domainBaseline: { ...f.domainBaseline, experienceLevel: e.target.value } })} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Current GPA (optional)</label>
                      <input className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="e.g., 3.2" value={f.domainBaseline.gpa || ''} onChange={e => setF({ ...f, domainBaseline: { ...f.domainBaseline, gpa: e.target.value } })} />
                    </div>
                  </div>
                </div>
              )}

              {/* Goal Builder (still available) */}
              <div className="pt-2 border-t border-border">
                <GoalBuilder
                  interests={f.interests}
                  gradeLevel={f.gradeLevel}
                  initialGoals={f.goals}
                  onGoalsChange={handleGoalsChange}
                />
              </div>
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
              disabled={step === 3 && !canProceedStep3}
              onClick={() => { setError(''); setStep(step + 1); }}
            >
              Next
            </button>
          ) : (
            <button disabled={submitting} className="rounded-lg bg-success px-5 py-2.5 text-sm font-medium text-success-foreground hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-2" onClick={submit}>
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating Your Plan...</> : <><Sparkles className="w-4 h-4" /> Generate My Plan</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
