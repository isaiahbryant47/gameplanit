import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { loadProfile, loadPlan, loadProgress, saveProgress, type ProgressData } from '@/lib/services';
import { emitCycleStarted } from '@/lib/services/activityService';
import { recomputeReadinessServer } from '@/lib/services/readinessService';
import { generateLLMPlan, fetchUserPlan, type StructuredWeek, type StructuredAction } from '@/lib/llmPlanService';
import { generatePlanWeeksWithResources } from '@/lib/planGenerator';
import {
  RefreshCw, Printer, LogOut, UserCircle, Sparkles, ArrowRight,
  GraduationCap, Wrench, Users, FolderOpen, Compass,
} from 'lucide-react';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardPathHeader from '@/components/DashboardPathHeader';
import ThisWeekModule from '@/components/ThisWeekModule';
import RecommendedMoves from '@/components/RecommendedMoves';
import ReadinessSnapshot from '@/components/ReadinessSnapshot';
import DoorsOpening from '@/components/DoorsOpening';
import BalancingBadge from '@/components/BalancingBadge';
import StudentProfile from '@/components/StudentProfile';
import KpiSection from '@/components/KpiSection';
import AdherencePrediction from '@/components/AdherencePrediction';
import { fetchCareerPillars } from '@/lib/careerService';
import { fetchUserUnlocks } from '@/lib/unlockService';
import type { ReadinessExplanation } from '@/lib/readinessEngine';
import type { CareerPillar, Profile, Plan } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [pillars, setPillars] = useState<CareerPillar[]>([]);
  const [readinessData, setReadinessData] = useState<ReadinessExplanation | null>(null);
  const [hasUnlocks, setHasUnlocks] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [profile, setProfile] = useState<Profile | undefined>(undefined);
  const [plan, setPlan] = useState<Plan | undefined>(undefined);
  const [structuredWeeks, setStructuredWeeks] = useState<StructuredWeek[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressData>({ completedActions: {}, resourcesEngaged: [], academicLog: [], completedGoals: {} });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setDataLoading(true);

    Promise.all([loadProfile(user.id), loadPlan(user.id)]).then(async ([prof, planData]) => {
      if (cancelled) return;
      setProfile(prof);
      setPlan(planData.plan);
      setStructuredWeeks(planData.structuredWeeks);

      // Load progress from Supabase
      const prog = await loadProgress(user.id, planData.plan?.id);
      if (!cancelled) {
        if (!prog.completedGoals) prog.completedGoals = {};
        setProgress(prog);
        setDataLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [user?.id, refreshKey]);

  const totalActions = plan?.weeks.reduce((sum, w) => sum + w.actions.length, 0) || 0;
  const completedCount = plan?.weeks.reduce((sum, w) =>
    sum + w.actions.filter((_, i) => progress.completedActions[`${w.id}-${i}`]).length, 0
  ) || 0;
  const completionRate = totalActions > 0 ? completedCount / totalActions : 0;
  const cycleNumber = plan?.cycleNumber || 1;
  const careerPathIdForHook = profile?.careerPathId || (plan as any)?.careerPathId;

  const engagedPillars = Array.from(new Set(
    structuredWeeks.flatMap(w =>
      w.actions
        .filter((a, i) => {
          const week = plan?.weeks.find(pw => pw.weekNumber === w.week);
          return week && progress.completedActions[`${week.id}-${i}`];
        })
        .map(a => a.pillar)
        .filter(Boolean) as string[]
    )
  ));

  const readinessScore = readinessData?.overallScore ?? 0;
  const milestoneRateInt = Math.round(completionRate * 100);
  const engagedPillarsKey = engagedPillars.join(',');
  const primaryPillarFocus = plan?.primaryPillarFocus || ['Academic Readiness', 'Exposure & Networking'];

  const daysSinceStart = plan ? Math.max(0, Math.floor((Date.now() - new Date(plan.createdAt).getTime()) / (1000 * 60 * 60 * 24))) : 0;
  const currentWeekNum = Math.min(12, Math.max(1, Math.ceil((daysSinceStart + 1) / 7)));

  useEffect(() => {
    if (careerPathIdForHook) {
      fetchCareerPillars(careerPathIdForHook).then(setPillars);
    }
  }, [careerPathIdForHook]);

  useEffect(() => {
    if (user?.id) {
      fetchUserUnlocks(user.id).then(u => setHasUnlocks(u.length > 0));
    }
  }, [user?.id]);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!user || !careerPathIdForHook) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;

      const pillarActionCounts: Record<string, { total: number; done: number }> = {};
      structuredWeeks.forEach(w => {
        w.actions.forEach((a, i) => {
          const p = a.pillar || 'General';
          if (!pillarActionCounts[p]) pillarActionCounts[p] = { total: 0, done: 0 };
          pillarActionCounts[p].total++;
          const week = plan?.weeks.find(pw => pw.weekNumber === w.week);
          if (week && progress.completedActions[`${week.id}-${i}`]) {
            pillarActionCounts[p].done++;
          }
        });
      });
      const pillarMilestoneRates: Record<string, number> = {};
      for (const [name, counts] of Object.entries(pillarActionCounts)) {
        pillarMilestoneRates[name] = counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0;
      }

      // Server-side readiness recomputation + unlock evaluation (single round-trip)
      recomputeReadinessServer({
        userId: user.id,
        careerPathId: careerPathIdForHook,
        cycleNumber,
        overallMilestoneRate: milestoneRateInt,
        pillarMilestoneRates,
        acceptedOpportunityPillars: engagedPillars,
        engagedPillars,
      }).then(result => {
        if (!mountedRef.current) return;
        setReadinessData(result);
        if (result.newUnlocks && result.newUnlocks.length > 0) {
          setHasUnlocks(true);
          toast.success(`You unlocked ${result.newUnlocks.length} new ${result.newUnlocks.length === 1 ? 'opportunity' : 'opportunities'}!`);
        }
      }).catch(err => {
        console.error('Server readiness recomputation failed:', err);
      });
    }, 1500);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [user?.id, careerPathIdForHook, cycleNumber, milestoneRateInt, engagedPillarsKey]);

  const refreshDashboard = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const handleProgressChange = useCallback((updated: ProgressData) => {
    setProgress(updated);
  }, []);

  if (dataLoading || !profile || !plan) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <DashboardSidebar />
          <main className="flex-1 min-w-0">
            <div className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur-sm">
              <div className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="text-muted-foreground" />
                  <h1 className="text-sm font-medium text-muted-foreground hidden sm:block">Home</h1>
                </div>
              </div>
            </div>
            <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
              <div className="rounded-xl border border-border bg-card p-5 space-y-4 animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-28 bg-muted rounded" />
                  <div className="h-4 w-4 bg-muted rounded" />
                  <div className="h-5 w-40 bg-muted rounded" />
                </div>
                <div className="h-3 w-36 bg-muted rounded" />
                <div className="flex gap-3 mt-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-9 flex-1 bg-muted rounded-lg" />
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 space-y-3 animate-pulse">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-3/4 bg-muted rounded" />
              </div>

              <div className="rounded-xl border border-border bg-card p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="h-7 w-24 bg-muted rounded-full" />
                  <div className="h-7 w-28 bg-muted rounded-full" />
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 space-y-4 animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-muted rounded-full" />
                  <div className="h-5 w-24 bg-muted rounded" />
                </div>
                <div className="h-3 w-48 bg-muted rounded" />
                {[1, 2, 3].map(i => (
                  <div key={i} className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-5 w-5 bg-muted rounded" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 bg-muted rounded" />
                        <div className="h-3 w-1/2 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="ml-8 space-y-2">
                      <div className="h-16 w-full bg-muted/60 rounded" />
                      <div className="h-16 w-full bg-muted/60 rounded" />
                    </div>
                    <div className="ml-8 flex gap-3">
                      <div className="h-5 w-16 bg-muted rounded" />
                      <div className="h-5 w-28 bg-muted rounded-full" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 animate-pulse">
                <div className="h-5 w-44 bg-muted rounded" />
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
                      <div className="flex justify-between">
                        <div className="h-5 w-16 bg-muted rounded-full" />
                        <div className="h-4 w-14 bg-muted rounded" />
                      </div>
                      <div className="h-4 w-full bg-muted rounded" />
                      <div className="h-3 w-2/3 bg-muted rounded" />
                      <div className="flex gap-2">
                        <div className="h-3 w-14 bg-muted rounded" />
                        <div className="h-3 w-24 bg-muted rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {!dataLoading && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center space-y-3">
                  <div className="flex justify-center">
                    <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                  </div>
                  <p className="text-sm font-medium text-card-foreground">Building your personalized plan…</p>
                  <p className="text-xs text-muted-foreground">This usually takes about 30 seconds. We're crafting actions tailored to your goals.</p>
                  <button onClick={() => nav('/onboarding')} className="text-xs text-primary hover:underline mt-2">
                    Or start fresh with onboarding →
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const careerPathName = profile.careerPathName || 'General Exploration';

  const regenerate = async () => {
    try {
      toast.info('Regenerating your plan with AI...');
      const result = await generateLLMPlan(profile, user.id);
      const localWeeks = result.weeks.map((w) => ({
        id: `${result.planId}-w${w.week}`,
        planId: result.planId,
        weekNumber: w.week,
        focus: w.focus,
        actions: w.actions.map(a => a.task),
        resources: w.actions.map(a => `${a.resource} — ${a.access_steps?.[0] || ''}`),
        milestones: [w.milestone],
      }));
      const updated = { ...plan, id: result.planId, createdAt: new Date().toISOString(), weeks: localWeeks };
      setPlan(updated);
      setStructuredWeeks(result.weeks);
      toast.success('Plan regenerated!');
      refreshDashboard();
    } catch (err) {
      console.error('Regenerate failed, using template:', err);
      toast.error('AI unavailable — regenerating from template.');
      const weeks = await generatePlanWeeksWithResources(profile, plan.id);
      const updated = { ...plan, createdAt: new Date().toISOString(), weeks };
      setPlan(updated);
      refreshDashboard();
    }
  };

  const startNextCycle = async () => {
    try {
      toast.info(`Generating Cycle ${cycleNumber + 1} with AI...`);
      const completedGoals = Object.keys(progress.completedGoals);
      const summary = `Cycle ${cycleNumber} completed with ${Math.round(completionRate * 100)}% adherence. Goals completed: ${completedGoals.length > 0 ? completedGoals.join(', ') : 'general progress'}.`;

      const result = await generateLLMPlan(profile, user.id, {
        cycleNumber: cycleNumber + 1,
        previousCycleSummary: summary,
        primaryPillarFocus: primaryPillarFocus,
      });
      const localWeeks = result.weeks.map((w) => ({
        id: `${result.planId}-w${w.week}`,
        planId: result.planId,
        weekNumber: w.week,
        focus: w.focus,
        actions: w.actions.map(a => a.task),
        resources: w.actions.map(a => `${a.resource}`),
        milestones: [w.milestone],
      }));
      const newPlan: Plan = {
        id: result.planId,
        userId: user.id,
        profileId: profile.id,
        title: `${careerPathName} — Cycle ${cycleNumber + 1}`,
        createdAt: new Date().toISOString(),
        weeks: localWeeks,
        careerPathId: profile.careerPathId,
        cycleNumber: cycleNumber + 1,
        outcomeStatement: profile.outcomeStatement,
        targetDate: profile.targetDate,
        primaryPillarFocus: primaryPillarFocus,
      };
      setPlan(newPlan);
      setStructuredWeeks(result.weeks);

      // Reset progress for new cycle
      const freshProgress = await saveProgress(user.id, result.planId, {
        completedActions: {},
        resourcesEngaged: progress.resourcesEngaged,
        academicLog: progress.academicLog,
        completedGoals: {},
      }).then(() => ({
        completedActions: {},
        resourcesEngaged: progress.resourcesEngaged,
        academicLog: progress.academicLog,
        completedGoals: {},
      }));
      setProgress(freshProgress);
      emitCycleStarted(user.id, result.planId, cycleNumber + 1);
      toast.success(`Cycle ${cycleNumber + 1} is ready!`);
    } catch (err) {
      console.error('Cycle generation failed:', err);
      toast.error('Failed to generate next cycle. Please try again.');
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />

        <main className="flex-1 min-w-0">
          <div className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur-sm">
            <div className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-muted-foreground" />
                <h1 className="text-sm font-medium text-muted-foreground hidden sm:block">Home</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={regenerate}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                </button>
                <button
                  onClick={() => setShowProfile(!showProfile)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors ${
                    showProfile ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  <UserCircle className="w-3.5 h-3.5" /> Profile
                </button>
                <button
                  onClick={() => { logout(); nav('/'); }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
            <DashboardPathHeader
              profile={profile}
              plan={plan}
              cycleNumber={cycleNumber}
              readinessScore={readinessScore}
              readinessData={readinessData}
              completionRate={completionRate}
            />

            <BalancingBadge profile={profile} />

            {showProfile && (
              <StudentProfile
                profile={profile}
                onClose={() => setShowProfile(false)}
                onSave={refreshDashboard}
              />
            )}

            <ThisWeekModule
              plan={plan}
              structuredWeeks={structuredWeeks}
              userId={user.id}
              progress={progress}
              onProgressChange={handleProgressChange}
            />

            <RecommendedMoves
              structuredWeeks={structuredWeeks}
              currentWeek={currentWeekNum}
            />

            <ReadinessSnapshot readinessData={readinessData} />

            <DoorsOpening
              userId={user.id}
              careerPathId={careerPathIdForHook}
              completionRate={completionRate}
              cycleNumber={cycleNumber}
              overallReadinessScore={readinessScore}
              hasUnlocks={hasUnlocks}
            />

            <AdherencePrediction
              plan={plan}
              profile={profile}
              userId={user.id}
              progress={progress}
              onPlanAdapted={refreshDashboard}
            />

            <KpiSection plan={plan} profile={profile} userId={user.id} progress={progress} onProgressChange={handleProgressChange} />

            {completionRate >= 0.8 && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Ready for Cycle {cycleNumber + 1}?
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    You've made great progress. Start your next 12-week cycle to keep building.
                  </p>
                </div>
                <button
                  onClick={startNextCycle}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Start Cycle {cycleNumber + 1} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
