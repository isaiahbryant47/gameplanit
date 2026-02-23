import { useAuth } from '@/hooks/useAuth';
import { loadProfile, loadPlan, loadProgress } from '@/lib/services';
import DashboardLayout from '@/components/DashboardLayout';
import { Trophy, Lock, TrendingUp, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchUserUnlocks } from '@/lib/unlockService';
import { recalculateReadiness, type ReadinessExplanation, getDifficultyTier } from '@/lib/readinessEngine';
import CareerUnlockedOpportunities from '@/components/CareerUnlockedOpportunities';
import UnlockedOpportunities from '@/components/UnlockedOpportunities';
import type { Profile, Plan } from '@/lib/types';
import type { ProgressData } from '@/lib/services/progressService';

export default function OpportunitiesPage() {
  const { user } = useAuth();
  const [unlockCount, setUnlockCount] = useState(0);
  const [readinessData, setReadinessData] = useState<ReadinessExplanation | null>(null);
  const [profile, setProfile] = useState<Profile | undefined>();
  const [plan, setPlan] = useState<Plan | undefined>();
  const [progress, setProgress] = useState<ProgressData>({ completedActions: {}, resourcesEngaged: [], academicLog: [], completedGoals: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([loadProfile(user.id), loadPlan(user.id)]).then(async ([prof, planData]) => {
      if (cancelled) return;
      setProfile(prof);
      setPlan(planData.plan);
      const prog = await loadProgress(user.id, planData.plan?.id);
      if (!cancelled) {
        setProgress(prog);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  const careerPathId = profile?.careerPathId || (plan as any)?.careerPathId;
  const totalActions = plan?.weeks.reduce((sum, w) => sum + w.actions.length, 0) || 0;
  const completedCount = plan?.weeks.reduce((sum, w) =>
    sum + w.actions.filter((_, i) => progress.completedActions[`${w.id}-${i}`]).length, 0
  ) || 0;
  const completionRate = totalActions > 0 ? completedCount / totalActions : 0;
  const cycleNumber = plan?.cycleNumber || 1;
  const readinessScore = readinessData?.overallScore ?? 0;
  const tier = getDifficultyTier(readinessScore);

  useEffect(() => {
    if (user?.id) {
      fetchUserUnlocks(user.id).then(u => setUnlockCount(u.length));
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user || !careerPathId) return;
    recalculateReadiness({
      userId: user.id,
      careerPathId,
      cycleNumber,
      pillarMilestoneRates: {},
      overallMilestoneRate: Math.round(completionRate * 100),
      acceptedOpportunityPillars: [],
    }).then(setReadinessData);
  }, [user?.id, careerPathId, cycleNumber, completionRate]);

  if (loading) {
    return (
      <DashboardLayout title="Opportunities">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Opportunities">
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold text-card-foreground">Your Opportunities</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Opportunities unlock as you progress through your 12-week cycle. Complete actions, build readiness, and real doors open.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-center">
            <p className="text-lg font-bold text-primary">{unlockCount}</p>
            <p className="text-[11px] text-muted-foreground">Unlocked</p>
          </div>
          <div className="rounded-lg bg-secondary/50 border border-border p-3 text-center">
            <p className="text-lg font-bold text-card-foreground">{Math.round(completionRate * 100)}%</p>
            <p className="text-[11px] text-muted-foreground">Completion</p>
          </div>
          <div className="rounded-lg bg-secondary/50 border border-border p-3 text-center">
            <p className="text-lg font-bold text-card-foreground">Tier {tier}</p>
            <p className="text-[11px] text-muted-foreground">Readiness</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-card-foreground">How Opportunities Unlock</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { t: 1, range: '0–33%', label: 'Starter', desc: 'Introductory events & workshops' },
            { t: 2, range: '34–66%', label: 'Builder', desc: 'Programs, certifications & competitions' },
            { t: 3, range: '67%+', label: 'Ready', desc: 'Internships, scholarships & advanced roles' },
          ].map(t => (
            <div
              key={t.t}
              className={`rounded-lg border p-3 space-y-1 ${tier === t.t ? 'border-primary/40 bg-primary/5' : 'border-border'}`}
            >
              <div className="flex items-center gap-1.5">
                {tier >= t.t ? <Sparkles className="w-3 h-3 text-primary" /> : <Lock className="w-3 h-3 text-muted-foreground" />}
                <p className="text-xs font-semibold text-card-foreground">Tier {t.t}: {t.label}</p>
              </div>
              <p className="text-[10px] text-muted-foreground">{t.range} readiness</p>
              <p className="text-[11px] text-muted-foreground">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {careerPathId && user && (
        <CareerUnlockedOpportunities
          userId={user.id}
          careerPathId={careerPathId}
          completionRate={completionRate}
          cycleNumber={cycleNumber}
          overallReadinessScore={readinessScore}
        />
      )}

      {plan?.pathwayId && (
        <UnlockedOpportunities
          pathwayId={plan.pathwayId}
          completionRate={completionRate}
          cycleNumber={cycleNumber}
        />
      )}

      {unlockCount === 0 && (
        <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3">
          <Lock className="w-8 h-8 text-muted-foreground mx-auto" />
          <h3 className="text-sm font-semibold text-card-foreground">Keep Going!</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            You're at {Math.round(completionRate * 100)}% completion. Complete more weekly actions to unlock real opportunities.
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}
