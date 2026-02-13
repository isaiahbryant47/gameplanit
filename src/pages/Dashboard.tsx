import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { storage } from '@/lib/storage';
import { generatePlanWeeksWithResources } from '@/lib/planGenerator';
import { generateLLMPlan, type StructuredWeek, type StructuredAction } from '@/lib/llmPlanService';
import { RefreshCw, Printer, LogOut, ChevronDown, List, CalendarDays, UserCircle, CheckSquare, Square, Trophy, BookOpen, Clock, Sparkles } from 'lucide-react';
import { useState } from 'react';
import ResourceDiscovery from '@/components/ResourceDiscovery';
import PlanCalendarView from '@/components/PlanCalendarView';
import StudentProfile from '@/components/StudentProfile';
import KpiSection from '@/components/KpiSection';
import AdherencePrediction from '@/components/AdherencePrediction';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [showProfile, setShowProfile] = useState(false);
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

  if (!user) return <Navigate to="/login" />;
  const profile = storage.allProfiles().find((p) => p.userId === user.id);
  const plan = storage.allPlans().find((p) => p.userId === user.id);

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
        resources: w.actions.map(a => `${a.resource} — ${a.access}`),
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

        {/* AI Resource Discovery */}
        <ResourceDiscovery profile={profile} />

      {/* Plan by Goals */}
        {view === 'calendar' ? (
          <PlanCalendarView plan={plan} />
        ) : (
          (() => {
            // Group weeks by goal
            const goalMap = new Map<string, typeof plan.weeks>();
            plan.weeks.forEach(week => {
              // Extract goal from focus string (format: "theme - goal")
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
                      // Find matching structured week for rich action data
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
                                        <div className="flex items-center gap-1.5">
                                          <BookOpen className="w-3 h-3 text-primary shrink-0" />
                                          <span className="text-xs font-semibold text-foreground">{a.resource}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground"><span className="font-medium">Access:</span> {a.access}</p>
                                        <p className="text-xs text-muted-foreground"><span className="font-medium">How to use:</span> {a.how_to_use}</p>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <Clock className="w-3 h-3" />
                                          <span>{a.time_estimate}</span>
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
                          // Also check all actions
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
