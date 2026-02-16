import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { storage } from '@/lib/storage';
import { generateLLMPlan, type StructuredWeek, type StructuredAction } from '@/lib/llmPlanService';
import { generatePlanWeeksWithResources } from '@/lib/planGenerator';
import {
  RefreshCw, Printer, LogOut, UserCircle, Sparkles, ArrowRight,
  GraduationCap, Wrench, Users, FolderOpen, Compass,
} from 'lucide-react';
import { useState, useEffect } from 'react';
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
    const p = user ? storage.getProgress(user.id) : { completedActions: {}, resourcesEngaged: [] as string[], academicLog: [] as { date: string; gpa?: number; attendance?: number }[], completedGoals: {} as Record<string, string> };
    if (!p.completedGoals) p.completedGoals = {};
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
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-lg text-muted-foreground">No plan yet.</p>
          <button onClick={() => nav('/onboarding')} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
            Start Onboarding
          </button>
        </div>
      </div>
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
      storage.saveProgress(user.id, { completedActions: {}, resourcesEngaged: progress.resourcesEngaged, academicLog: progress.academicLog, completedGoals: {} });
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
