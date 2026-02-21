import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { storage } from '@/lib/storage';
import { generateLLMPlan, type StructuredWeek, type StructuredAction } from '@/lib/llmPlanService';
import { generatePlanWeeksWithResources } from '@/lib/planGenerator';
import {
  RefreshCw, Printer, LogOut, UserCircle, Sparkles, ArrowRight,
  GraduationCap, Wrench, Users, FolderOpen, Compass,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
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
import { evaluateUnlocks, fetchUserUnlocks } from '@/lib/unlockService';
import { recalculateReadiness, type ReadinessExplanation } from '@/lib/readinessEngine';
import type { CareerPillar } from '@/lib/types';
import { toast } from 'sonner';



export default function Dashboard() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [pillars, setPillars] = useState<CareerPillar[]>([]);
  const [readinessData, setReadinessData] = useState<ReadinessExplanation | null>(null);
  const [hasUnlocks, setHasUnlocks] = useState(false);
  const [structuredWeeks] = useState<StructuredWeek[]>(() => {
    if (!user) return [];
    try {
      const raw = localStorage.getItem(`gp_structured_weeks_${user.id}`);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [progress, setProgress] = useState(() => {
    const p = user ? storage.getProgress(user.id) : { completedActions: {}, resourcesEngaged: [] as string[], academicLog: [] as { date: string; gpa?: number; attendance?: number }[], completedGoals: {} as Record<string, string>, weeklyCheckins: {} as Record<number, { lowTime: boolean; transportationIssue: boolean; unexpectedResponsibilities: boolean; motivationLow: boolean; updatedAt: string }> };
    if (!p.completedGoals) p.completedGoals = {};
    if (!p.weeklyCheckins) p.weeklyCheckins = {};
    return p;
  });

  const profile = user ? storage.allProfiles().find((p) => p.userId === user.id) : undefined;
  const plan = user ? storage.allPlans().find((p) => p.userId === user.id) : undefined;

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

  // Current week
  const daysSinceStart = plan ? Math.floor((Date.now() - new Date(plan.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const currentWeekNum = Math.min(12, Math.max(1, Math.ceil(daysSinceStart / 7)));

  useEffect(() => {
    if (careerPathIdForHook) {
      fetchCareerPillars(careerPathIdForHook).then(setPillars);
    }
  }, [careerPathIdForHook]);


  // Check for existing unlocks
  useEffect(() => {
    if (user?.id) {
      fetchUserUnlocks(user.id).then(u => setHasUnlocks(u.length > 0));
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user || !careerPathIdForHook) return;

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

    evaluateUnlocks({
      userId: user.id,
      careerPathId: careerPathIdForHook,
      cycleNumber,
      milestoneCompletionRate: milestoneRateInt,
      engagedPillars,
    }).then(newUnlocks => {
      if (newUnlocks.length > 0) {
        setHasUnlocks(true);
        toast.success(`🎉 You unlocked ${newUnlocks.length} new ${newUnlocks.length === 1 ? 'opportunity' : 'opportunities'}!`);
      }
    });

    recalculateReadiness({
      userId: user.id,
      careerPathId: careerPathIdForHook,
      cycleNumber,
      pillarMilestoneRates,
      overallMilestoneRate: milestoneRateInt,
      acceptedOpportunityPillars: engagedPillars,
    }).then(setReadinessData);
  }, [user?.id, careerPathIdForHook, cycleNumber, milestoneRateInt, engagedPillarsKey]);

  if (!user) return <Navigate to="/login" />;

  if (!profile || !plan) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <DashboardSidebar />
          <main className="flex-1 min-w-0">
            <div className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur-sm">
              <div className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="text-muted-foreground" />
                  <h1 className="text-sm font-medium text-muted-foreground hidden sm:block">Student Dashboard</h1>
                </div>
              </div>
            </div>
            <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
              {/* Path Header skeleton */}
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

              {/* Why This Matters skeleton */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-3 animate-pulse">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-3/4 bg-muted rounded" />
              </div>

              {/* Balancing badge skeleton */}
              <div className="rounded-xl border border-border bg-card p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="h-7 w-24 bg-muted rounded-full" />
                  <div className="h-7 w-28 bg-muted rounded-full" />
                </div>
              </div>

              {/* This Week skeleton */}
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

              {/* Recommended Moves skeleton */}
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

              {/* Generating message */}
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
        id: crypto.randomUUID(),
        planId: result.planId,
        weekNumber: w.week,
        focus: w.focus,
        actions: w.actions.map(a => a.task),
        resources: w.actions.map(a => `${a.resource} — ${a.access_steps?.[0] || ''}`),
        milestones: [w.milestone],
      }));
      const updated = { ...plan, id: result.planId, createdAt: new Date().toISOString(), weeks: localWeeks };
      storage.savePlans([...storage.allPlans().filter((p) => p.userId !== user.id), updated]);
      localStorage.setItem(`gp_structured_weeks_${user.id}`, JSON.stringify(result.weeks));
      toast.success('Plan regenerated!');
      nav(0);
    } catch (err) {
      console.error('Regenerate failed, using template:', err);
      toast.error('AI unavailable — regenerating from template.');
      const weeks = await generatePlanWeeksWithResources(profile, plan.id);
      const updated = { ...plan, createdAt: new Date().toISOString(), weeks };
      storage.savePlans([...storage.allPlans().filter((p) => p.userId !== user.id), updated]);
      nav(0);
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
        id: crypto.randomUUID(),
        planId: result.planId,
        weekNumber: w.week,
        focus: w.focus,
        actions: w.actions.map(a => a.task),
        resources: w.actions.map(a => `${a.resource}`),
        milestones: [w.milestone],
      }));
      const newPlan = {
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
      storage.savePlans([...storage.allPlans().filter((p) => p.userId !== user.id), newPlan]);
      localStorage.setItem(`gp_structured_weeks_${user.id}`, JSON.stringify(result.weeks));
      storage.saveProgress(user.id, { completedActions: {}, resourcesEngaged: progress.resourcesEngaged, academicLog: progress.academicLog, completedGoals: {}, weeklyCheckins: {} });
      toast.success(`Cycle ${cycleNumber + 1} is ready!`);
      nav(0);
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
          {/* Top bar */}
          <div className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur-sm">
            <div className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-muted-foreground" />
                <h1 className="text-sm font-medium text-muted-foreground hidden sm:block">Student Dashboard</h1>
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

          {/* Main Content */}
          <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
            {/* C + D: Path Header + Why This Matters (first thing students see) */}
            <DashboardPathHeader
              profile={profile}
              plan={plan}
              cycleNumber={cycleNumber}
              readinessScore={readinessScore}
              readinessData={readinessData}
              completionRate={completionRate}
            />


            {/* What you're balancing */}
            <BalancingBadge profile={profile} />

            {/* Student Profile (collapsible) */}
            {showProfile && (
              <StudentProfile
                profile={profile}
                onClose={() => setShowProfile(false)}
                onSave={() => nav(0)}
              />
            )}

            {/* A: This Week (highest priority) */}
            <ThisWeekModule
              plan={plan}
              structuredWeeks={structuredWeeks}
              userId={user.id}
              progress={progress}
              onProgressChange={setProgress}
            />

            {/* B: Recommended Next Moves */}
            <RecommendedMoves
              structuredWeeks={structuredWeeks}
              currentWeek={currentWeekNum}
            />

            {/* C: Readiness Snapshot */}
            <ReadinessSnapshot readinessData={readinessData} />

            {/* D: Doors Opening / Unlocked Opportunities */}
            <DoorsOpening
              userId={user.id}
              careerPathId={careerPathIdForHook}
              completionRate={completionRate}
              cycleNumber={cycleNumber}
              overallReadinessScore={readinessScore}
              hasUnlocks={hasUnlocks}
            />

            {/* Predictive Insights */}
            <AdherencePrediction
              plan={plan}
              profile={profile}
              userId={user.id}
              progress={progress}
              onPlanAdapted={() => nav(0)}
            />

            {/* KPIs */}
            <KpiSection plan={plan} profile={profile} userId={user.id} />

            {/* Next Cycle CTA */}
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
