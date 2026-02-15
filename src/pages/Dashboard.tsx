import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { storage } from '@/lib/storage';
import { generatePlanWeeksWithResources } from '@/lib/planGenerator';
import { generateLLMPlan, type StructuredWeek, type StructuredAction } from '@/lib/llmPlanService';
import { RefreshCw, Printer, LogOut, ChevronDown, List, CalendarDays, UserCircle, CheckSquare, Square, Trophy, BookOpen, Clock, Sparkles, Compass, ArrowRight, GraduationCap, Wrench, Users, FolderOpen, Zap, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import ResourceDiscovery from '@/components/ResourceDiscovery';
import PlanCalendarView from '@/components/PlanCalendarView';
import StudentProfile from '@/components/StudentProfile';
import KpiSection from '@/components/KpiSection';
import AdherencePrediction from '@/components/AdherencePrediction';
import CareerUnlockedOpportunities from '@/components/CareerUnlockedOpportunities';
import { fetchCareerPillars } from '@/lib/careerService';
import { evaluateUnlocks, computeReadinessScore, fetchUserUnlocks } from '@/lib/unlockService';
import type { CareerPillar } from '@/lib/types';
import { toast } from 'sonner';

const pillarIcons: Record<string, typeof GraduationCap> = {
  'Academic Readiness': GraduationCap,
  'Skill Development': Wrench,
  'Exposure & Networking': Users,
  'Proof & Portfolio': FolderOpen,
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [showProfile, setShowProfile] = useState(false);
  const [pillars, setPillars] = useState<CareerPillar[]>([]);
  const [unlockCount, setUnlockCount] = useState(0);
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

  // Compute completion for hooks
  const totalActions = plan?.weeks.reduce((sum, w) => sum + w.actions.length, 0) || 0;
  const completedCount = plan?.weeks.reduce((sum, w) =>
    sum + w.actions.filter((_, i) => progress.completedActions[`${w.id}-${i}`]).length, 0
  ) || 0;
  const completionRate = totalActions > 0 ? completedCount / totalActions : 0;
  const cycleNumber = plan?.cycleNumber || 1;
  const careerPathIdForHook = profile?.careerPathId || (plan as any)?.careerPathId;

  // Derive engaged pillars from completed structured actions
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

  // Readiness score (Phase 2 placeholder formula)
  const readinessScore = computeReadinessScore(
    cycleNumber,
    Math.round(completionRate * 100),
    engagedPillars.length,
    4
  );

  // Fetch pillars for career path (must be before early return)
  useEffect(() => {
    if (careerPathIdForHook) {
      fetchCareerPillars(careerPathIdForHook).then(setPillars);
    }
  }, [careerPathIdForHook]);

  // Run unlock evaluation when progress changes
  useEffect(() => {
    if (!user || !careerPathIdForHook) return;
    evaluateUnlocks({
      userId: user.id,
      careerPathId: careerPathIdForHook,
      cycleNumber,
      milestoneCompletionRate: Math.round(completionRate * 100),
      engagedPillars,
    }).then(newUnlocks => {
      if (newUnlocks.length > 0) {
        setUnlockCount(prev => prev + newUnlocks.length);
        toast.success(`🎉 You unlocked ${newUnlocks.length} new ${newUnlocks.length === 1 ? 'opportunity' : 'opportunities'}!`);
      }
    });
  }, [user?.id, careerPathIdForHook, cycleNumber, Math.round(completionRate * 100), engagedPillars.join(',')]);


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

  // Career info
  const careerPathName = profile.careerPathName || 'General Exploration';
  const careerDomainName = profile.careerDomainName || '';
  const primaryPillarFocus = plan.primaryPillarFocus || ['Academic Readiness', 'Exposure & Networking'];

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

  const exportPdf = () => {
    const html = `<html><head><title>${plan.title}</title><style>body{font-family:system-ui;max-width:700px;margin:0 auto;padding:40px}h1{color:#1a5c3a}h3{margin-top:24px;color:#1a5c3a}ul{margin:8px 0}li{margin:4px 0}</style></head><body><h1>${plan.title}</h1>${plan.weeks.map(w => `<h3>Week ${w.weekNumber}: ${w.focus}</h3><ul>${w.actions.map(a => `<li>${a}</li>`).join('')}</ul>`).join('')}</body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.print();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Page Label */}
      <div className="fixed bottom-4 right-4 z-10">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Student Dashboard</span>
      </div>
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-card-foreground">Your Action Plan</h1>
            <p className="text-sm text-muted-foreground">Created {new Date(plan.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="flex gap-2">
            <div className="inline-flex rounded-lg border border-border overflow-hidden">
              <button onClick={() => setView('list')} className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${view === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
                <List className="w-4 h-4" /> List
              </button>
              <button onClick={() => setView('calendar')} className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${view === 'calendar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
                <CalendarDays className="w-4 h-4" /> Calendar
              </button>
            </div>
            <button onClick={regenerate} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
              <RefreshCw className="w-4 h-4" /> Regenerate
            </button>
            <button onClick={exportPdf} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
              <Printer className="w-4 h-4" /> Export PDF
            </button>
            <button onClick={() => setShowProfile(!showProfile)} className={`inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors ${showProfile ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
              <UserCircle className="w-4 h-4" />
            </button>
            <button onClick={() => { logout(); nav('/'); }} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weeks */}
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
        {/* Career Path Header */}
        <div className="rounded-xl border border-primary/20 bg-accent/30 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <Compass className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {careerDomainName && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {careerDomainName}
                  </span>
                )}
                <span className="text-sm font-semibold text-card-foreground">
                  Career Path: {careerPathName}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  Cycle {cycleNumber}
                </span>
              </div>
              {profile.outcomeStatement && (
                <p className="text-sm text-muted-foreground mt-1">{profile.outcomeStatement}</p>
              )}
            </div>
          </div>

          {/* Primary Pillars This Cycle */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Primary Pillars This Cycle:</p>
            <div className="flex flex-wrap gap-2">
              {primaryPillarFocus.map(p => {
                const Icon = pillarIcons[p] || Compass;
                return (
                  <span key={p} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    <Icon className="w-3.5 h-3.5" />
                    {p}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Career Readiness Bar (placeholder) */}
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Career Readiness</span>
              <span>{readinessScore}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${readinessScore}%` }} />
            </div>
          </div>

          {/* Completion */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{Math.round(completionRate * 100)}% plan complete</span>
            {profile.targetDate && <span>Target: {profile.targetDate.replace('_', ' ')}</span>}
          </div>
        </div>

        {/* Unlocked Opportunities */}
        {careerPathIdForHook && (
          <CareerUnlockedOpportunities
            userId={user.id}
            careerPathId={careerPathIdForHook}
            completionRate={completionRate}
            cycleNumber={cycleNumber}
          />
        )}

        {/* Next Recommended Move */}
        {completionRate < 0.8 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-card-foreground">Next Recommended Move</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Keep working through your current cycle — you're at {Math.round(completionRate * 100)}% completion. Focus on {primaryPillarFocus[0] || 'your current actions'} to unlock new opportunities.
            </p>
          </div>
        )}

        {/* Student Profile */}
        {showProfile && (
          <StudentProfile
            profile={profile}
            onClose={() => setShowProfile(false)}
            onSave={() => nav(0)}
          />
        )}

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
              onClick={async () => {
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
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Start Cycle {cycleNumber + 1} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* AI Resource Discovery */}
        <ResourceDiscovery profile={profile} />

        {/* Plan by Goals */}
        {view === 'calendar' ? (
          <PlanCalendarView plan={plan} />
        ) : (
          (() => {
            const goalMap = new Map<string, typeof plan.weeks>();
            plan.weeks.forEach(week => {
              const goal = week.focus.includes(' - ') ? week.focus.split(' - ').slice(1).join(' - ') : week.focus;
              if (!goalMap.has(goal)) goalMap.set(goal, []);
              goalMap.get(goal)!.push(week);
            });

            return Array.from(goalMap.entries()).map(([goal, weeks]) => {
              const isGoalCompleted = !!progress.completedGoals[goal];
              return (
              <div key={goal} className={`rounded-xl border shadow-sm overflow-hidden ${isGoalCompleted ? 'border-primary/50 bg-primary/5' : 'border-border bg-card'}`}>
                <button
                  onClick={() => setExpandedWeek(prev => prev === goal ? null : goal)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isGoalCompleted ? (
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm"><Trophy className="w-4 h-4" /></span>
                    ) : (
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">{weeks.length}</span>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold text-card-foreground capitalize">{goal}</h2>
                        {isGoalCompleted && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded-full">✓ Completed</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {weeks.length} {weeks.length === 1 ? 'week' : 'weeks'} · Weeks {weeks[0].weekNumber}–{weeks[weeks.length - 1].weekNumber}
                        {isGoalCompleted && ` · Completed ${new Date(progress.completedGoals[goal]).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedWeek === goal ? 'rotate-180' : ''}`} />
                </button>
                {expandedWeek === goal && (
                  <div className="border-t border-border">
                    {/* Check All / Uncheck All */}
                    {(() => {
                      const allKeys = weeks.flatMap(w => w.actions.map((_, i) => `${w.id}-${i}`));
                      const allDone = allKeys.every(k => !!progress.completedActions[k]);
                      return (
                        <div className="px-5 py-2.5 flex items-center justify-end border-b border-border bg-secondary/30">
                          <button
                            onClick={() => {
                              const updated = { ...progress, completedActions: { ...progress.completedActions } };
                              allKeys.forEach(k => { updated.completedActions[k] = !allDone; });
                              setProgress(updated);
                              storage.saveProgress(user.id, updated);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                          >
                            {allDone ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                            {allDone ? 'Uncheck All' : 'Check All'}
                          </button>
                        </div>
                      );
                    })()}
                  <div className="divide-y divide-border">
                    {weeks.map(week => {
                      const theme = week.focus.includes(' - ') ? week.focus.split(' - ')[0] : '';
                      const sWeek = structuredWeeks.find(sw => sw.week === week.weekNumber);
                      return (
                        <div key={week.id} className="px-5 py-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-primary">WEEK {week.weekNumber}</span>
                            {theme && <span className="text-xs text-muted-foreground">· {theme}</span>}
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Actions</h4>
                            {sWeek ? (
                              <div className="space-y-3">
                                {sWeek.actions.map((a: StructuredAction, i: number) => {
                                  const actionKey = `${week.id}-${i}`;
                                  const done = !!progress.completedActions[actionKey];
                                  const PillarIcon = a.pillar ? pillarIcons[a.pillar] || Compass : null;
                                  return (
                                    <div key={i} className={`rounded-lg border p-3 space-y-2 transition-colors ${done ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}>
                                      <div className="flex items-start gap-2">
                                        <button
                                          onClick={() => {
                                            const updated = { ...progress, completedActions: { ...progress.completedActions, [actionKey]: !done } };
                                            setProgress(updated);
                                            storage.saveProgress(user.id, updated);
                                          }}
                                          className="mt-0.5 shrink-0"
                                        >
                                          {done ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                                        </button>
                                        <span className={`text-sm font-medium ${done ? 'line-through text-muted-foreground' : 'text-card-foreground'}`}>{a.task}</span>
                                      </div>
                                      <div className="ml-6 space-y-1.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <div className="flex items-center gap-1.5">
                                            <BookOpen className="w-3 h-3 text-primary shrink-0" />
                                            <span className="text-xs font-semibold text-foreground">{a.resource}</span>
                                          </div>
                                          {a.pillar && PillarIcon && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                                              <PillarIcon className="w-3 h-3" />
                                              {a.pillar}
                                            </span>
                                          )}
                                        </div>
                                        {a.access_steps && a.access_steps.length > 0 ? (
                                          <div>
                                            <span className="text-xs font-medium text-muted-foreground">How to access:</span>
                                            <ol className="list-decimal list-inside ml-1 mt-0.5 space-y-0.5">
                                              {a.access_steps.map((s: string, si: number) => (
                                                <li key={si} className="text-xs text-muted-foreground">{s}</li>
                                              ))}
                                            </ol>
                                          </div>
                                        ) : a.access ? (
                                          <p className="text-xs text-muted-foreground"><span className="font-medium">Access:</span> {a.access}</p>
                                        ) : null}
                                        {a.use_steps && a.use_steps.length > 0 ? (
                                          <div>
                                            <span className="text-xs font-medium text-muted-foreground">How to use:</span>
                                            <ol className="list-decimal list-inside ml-1 mt-0.5 space-y-0.5">
                                              {a.use_steps.map((s: string, si: number) => (
                                                <li key={si} className="text-xs text-muted-foreground">{s}</li>
                                              ))}
                                            </ol>
                                          </div>
                                        ) : a.how_to_use ? (
                                          <p className="text-xs text-muted-foreground"><span className="font-medium">How to use:</span> {a.how_to_use}</p>
                                        ) : null}
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                          <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {a.time_estimate_minutes ? `${a.time_estimate_minutes} min` : a.time_estimate || '30 min'}
                                          </span>
                                          {a.success_metric && (
                                            <span className="flex items-center gap-1 text-primary/80">
                                              ✓ {a.success_metric}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <ul className="space-y-1.5">
                                {week.actions.map((a, i) => {
                                  const actionKey = `${week.id}-${i}`;
                                  const done = !!progress.completedActions[actionKey];
                                  return (
                                    <li key={i} className="flex items-start gap-2 text-sm text-card-foreground">
                                      <button
                                        onClick={() => {
                                          const updated = { ...progress, completedActions: { ...progress.completedActions, [actionKey]: !done } };
                                          setProgress(updated);
                                          storage.saveProgress(user.id, updated);
                                        }}
                                        className="mt-0.5 shrink-0"
                                      >
                                        {done ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                                      </button>
                                      <span className={done ? 'line-through text-muted-foreground' : ''}>{a}</span>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                          {!sWeek && (
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Resources</h4>
                            <ul className="space-y-1">
                              {week.resources.map((r, i) => (
                                <li key={i} className="text-sm text-primary hover:underline">
                                  {r.startsWith('http') ? <a href={r} target="_blank" rel="noopener noreferrer">{r}</a> : r}
                                </li>
                              ))}
                            </ul>
                          </div>
                          )}
                          <div className="pt-2 border-t border-border">
                            <p className="text-xs text-muted-foreground">{week.milestones[0]}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Goal Completed Button */}
                  <div className="px-5 py-3 border-t border-border bg-secondary/30 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {isGoalCompleted ? 'This goal has been marked as complete.' : 'Mark this goal as successfully completed when done.'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = { ...progress, completedGoals: { ...progress.completedGoals } };
                        if (isGoalCompleted) {
                          delete updated.completedGoals[goal];
                        } else {
                          updated.completedGoals[goal] = new Date().toISOString();
                          const allKeys = weeks.flatMap(w => w.actions.map((_, i) => `${w.id}-${i}`));
                          updated.completedActions = { ...updated.completedActions };
                          allKeys.forEach(k => { updated.completedActions[k] = true; });
                        }
                        setProgress(updated);
                        storage.saveProgress(user.id, updated);
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
                        isGoalCompleted
                          ? 'border border-primary text-primary hover:bg-primary/10'
                          : 'bg-primary text-primary-foreground hover:opacity-90'
                      }`}
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      {isGoalCompleted ? 'Undo Completion' : 'Goal Completed 🎉'}
                    </button>
                  </div>
                  </div>
                )}
              </div>
              );
            });
          })()
        )}
      </div>
    </div>
  );
}
