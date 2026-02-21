import { useState, useEffect, useMemo } from 'react';
import { storage, type ProgressData } from '@/lib/storage';
import {
  predictAdherence,
  getWeekCompletionRate,
  getCompletionStreak,
  type AdherenceResult,
} from '@/lib/predict/adherence';
import { submitCheckin, submitPrediction } from '@/lib/predict/analyticsService';
import {
  buildAdaptedActions,
  countBlockers,
  getEffectiveTimePerWeek,
  type WeeklyCheckin,
} from '@/lib/predict/adaptation';
import type { Plan, Profile } from '@/lib/types';
import { BrainCircuit, AlertTriangle, TrendingUp, Sparkles, Zap } from 'lucide-react';

interface Props {
  plan: Plan;
  profile: Profile;
  userId: string;
  progress: ProgressData;
  onPlanAdapted: () => void;
}

const emptyCheckin: WeeklyCheckin = {
  lowTime: false,
  transportationIssue: false,
  unexpectedResponsibilities: false,
  motivationLow: false,
};

export default function AdherencePrediction({ plan, profile, userId, progress, onPlanAdapted }: Props) {
  const [prediction, setPrediction] = useState<AdherenceResult | null>(null);
  const [adapted, setAdapted] = useState(false);
  const [synced, setSynced] = useState(false);

  // Determine current week
  const daysSinceStart = Math.floor((Date.now() - new Date(plan.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const currentWeekNum = Math.min(12, Math.max(1, Math.ceil(daysSinceStart / 7)));
  const currentWeek = plan.weeks.find(w => w.weekNumber === currentWeekNum);
  const previousWeeks = plan.weeks.filter(w => w.weekNumber < currentWeekNum);

  const persistedCheckin = progress.weeklyCheckins?.[currentWeekNum] || {
    ...emptyCheckin,
    updatedAt: '',
  };
  const [localCheckin, setLocalCheckin] = useState(persistedCheckin);

  useEffect(() => {
    setLocalCheckin(persistedCheckin);
  }, [persistedCheckin.updatedAt, currentWeekNum]);

  const blockerFlags: WeeklyCheckin = {
    lowTime: localCheckin.lowTime,
    transportationIssue: localCheckin.transportationIssue,
    unexpectedResponsibilities: localCheckin.unexpectedResponsibilities,
    motivationLow: localCheckin.motivationLow,
  };

  const effectiveTimePerWeek = getEffectiveTimePerWeek(profile.constraints.timePerWeekHours, blockerFlags);

  // Compute prediction
  const result = useMemo(() => {
    const lastWeek = previousWeeks.length > 0 ? previousWeeks[previousWeeks.length - 1] : null;
    const lastRate = lastWeek
      ? getWeekCompletionRate(lastWeek.id, lastWeek.actions.length, progress.completedActions)
      : null;
    const streak = getCompletionStreak(previousWeeks, progress.completedActions);
    const complexity = currentWeek ? currentWeek.actions.length : 4;

    return predictAdherence({
      lastWeekCompletionRate: lastRate,
      completionStreakWeeks: streak,
      planComplexity: complexity,
      timePerWeekHours: effectiveTimePerWeek,
    });
  }, [previousWeeks, currentWeek, progress.completedActions, effectiveTimePerWeek]);

  useEffect(() => {
    setPrediction(result);
  }, [result]);

  // Sync to Supabase (once per session)
  useEffect(() => {
    if (synced || !prediction) return;
    setSynced(true);

    // Submit checkin for last completed week
    if (previousWeeks.length > 0) {
      const lastWeek = previousWeeks[previousWeeks.length - 1];
      const completedCount = lastWeek.actions.reduce((sum, _, i) =>
        sum + (progress.completedActions[`${lastWeek.id}-${i}`] ? 1 : 0), 0);
      submitCheckin({
        userId,
        planId: plan.id,
        weekNumber: lastWeek.weekNumber,
        completedActionsCount: completedCount,
        totalActionsCount: lastWeek.actions.length,
        gradeLevel: profile.gradeLevel,
        timePerWeekHours: profile.constraints.timePerWeekHours,
        transportation: profile.constraints.transportation,
      });
    }

    // Submit prediction
    submitPrediction({
      userId,
      planId: plan.id,
      weekNumber: currentWeekNum,
      adherenceProbability: prediction.probability,
      riskFlag: prediction.riskFlag,
      topDrivers: prediction.drivers,
      gradeLevel: profile.gradeLevel,
      timePerWeekHours: effectiveTimePerWeek,
      transportation: profile.constraints.transportation,
    });
  }, [prediction, synced, previousWeeks, progress.completedActions, userId, plan.id, profile.gradeLevel, profile.constraints.transportation, currentWeekNum, effectiveTimePerWeek]);

  const saveCheckin = (field: keyof WeeklyCheckin, value: boolean) => {
    const updated: ProgressData = {
      ...progress,
      weeklyCheckins: {
        ...(progress.weeklyCheckins || {}),
        [currentWeekNum]: {
          ...localCheckin,
          [field]: value,
          updatedAt: new Date().toISOString(),
        },
      },
    };
    storage.saveProgress(userId, updated);
    setLocalCheckin(updated.weeklyCheckins?.[currentWeekNum] || persistedCheckin);
  };

  const adaptThisWeek = () => {
    if (!currentWeek || !prediction) return;

    const goal = profile.goals[0] || 'your goal';
    const interest = profile.interests[0] || 'your interest';
    const adaptedActions = buildAdaptedActions({
      currentActions: currentWeek.actions,
      goal,
      interest,
      checkin: blockerFlags,
      riskFlag: prediction.riskFlag,
    });

    const updatedWeeks = plan.weeks.map(w =>
      w.weekNumber === currentWeekNum ? { ...w, actions: adaptedActions } : w
    );
    const updatedPlan = { ...plan, weeks: updatedWeeks };
    storage.savePlans([...storage.allPlans().filter(p => p.id !== plan.id), updatedPlan]);
    setAdapted(true);
    onPlanAdapted();
  };

  if (!prediction) return null;

  const pct = Math.round(prediction.probability * 100);
  const isRisk = prediction.riskFlag;
  const blockersCount = countBlockers(blockerFlags);

  return (
    <div className={`rounded-xl border shadow-sm overflow-hidden ${isRisk ? 'border-destructive/50 bg-destructive/5' : 'border-border bg-card'}`}>
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className={`w-4 h-4 ${isRisk ? 'text-destructive' : 'text-primary'}`} />
            <h3 className="text-sm font-semibold text-card-foreground">Predictive Insights</h3>
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground bg-secondary rounded-full px-2 py-0.5">Week {currentWeekNum}</span>
          </div>
          {isRisk && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-destructive bg-destructive/10 rounded-full px-2.5 py-0.5">
              <AlertTriangle className="w-3 h-3" /> At Risk
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16">
            <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke={isRisk ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
                strokeWidth="3"
                strokeDasharray={`${pct} ${100 - pct}`}
                strokeLinecap="round"
              />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${isRisk ? 'text-destructive' : 'text-primary'}`}>
              {pct}%
            </span>
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-card-foreground">
              Next Week Adherence: <span className={isRisk ? 'text-destructive' : 'text-primary'}>{pct}%</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {isRisk
                ? 'We predict you may struggle next week. Use the check-in toggles and adapt your plan.'
                : 'You\'re on track! Keep up the momentum.'}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-3 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Weekly Check-in</p>
          <p className="text-xs text-muted-foreground">Mark what got harder this week. We’ll adjust your adherence estimate and your action list.</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              ['lowTime', 'I had less time than expected'],
              ['transportationIssue', 'Transportation got harder'],
              ['unexpectedResponsibilities', 'Unexpected responsibilities came up'],
              ['motivationLow', 'My motivation was lower this week'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-xs text-card-foreground">
                <input
                  type="checkbox"
                  checked={Boolean(blockerFlags[key as keyof WeeklyCheckin])}
                  onChange={(e) => saveCheckin(key as keyof WeeklyCheckin, e.target.checked)}
                />
                {label}
              </label>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Effective weekly time used in prediction: <span className="font-medium text-card-foreground">{effectiveTimePerWeek}h/week</span>
            {blockersCount > 0 ? ` (${blockersCount} blocker${blockersCount > 1 ? 's' : ''} active)` : ''}
          </p>
        </div>

        <div>
          <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Key Factors</h4>
          <div className="space-y-1">
            {prediction.drivers.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-card-foreground">
                <Sparkles className="w-3 h-3 text-primary shrink-0" />
                {d}
              </div>
            ))}
          </div>
        </div>

        {(isRisk || blockersCount > 0) && !adapted && (
          <button
            onClick={adaptThisWeek}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Zap className="w-4 h-4" /> Apply Weekly Adaptation
          </button>
        )}
        {adapted && (
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2.5 text-sm text-primary font-medium">
            <TrendingUp className="w-4 h-4" />
            Plan adapted using your check-in + current risk level.
          </div>
        )}
      </div>
    </div>
  );
}
