import { useAuth } from '@/hooks/useAuth';
import { loadProfile, loadPlan, loadProgress } from '@/lib/services';
import DashboardLayout from '@/components/DashboardLayout';
import { Dumbbell, BookOpen, Wrench, Users, FolderOpen, CheckCircle2, Clock } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import type { StructuredWeek, StructuredAction } from '@/lib/llmPlanService';
import { loadStructuredWeeks } from '@/lib/services/planService';
import type { Profile, Plan } from '@/lib/types';
import type { ProgressData } from '@/lib/services/progressService';

const pillarConfig: Record<string, { icon: typeof BookOpen; color: string }> = {
  'Academic Readiness': { icon: BookOpen, color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30' },
  'Skill Development': { icon: Wrench, color: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30' },
  'Exposure & Networking': { icon: Users, color: 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30' },
  'Proof & Portfolio': { icon: FolderOpen, color: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30' },
};

export default function PracticePage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>('all');
  const [plan, setPlan] = useState<Plan | undefined>();
  const [progress, setProgress] = useState<ProgressData>({ completedActions: {}, resourcesEngaged: [], academicLog: [], completedGoals: {} });
  const [structuredWeeks, setStructuredWeeks] = useState<StructuredWeek[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    loadPlan(user.id).then(async (planData) => {
      if (cancelled) return;
      setPlan(planData.plan);
      setStructuredWeeks(planData.structuredWeeks);
      const prog = await loadProgress(user.id, planData.plan?.id);
      if (!cancelled) {
        setProgress(prog);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  const pillarGroups = useMemo(() => {
    const groups: Record<string, { action: StructuredAction; weekNum: number; actionIdx: number; weekId: string; done: boolean }[]> = {};
    structuredWeeks.forEach(sw => {
      const planWeek = plan?.weeks.find(w => w.weekNumber === sw.week);
      sw.actions.forEach((a, i) => {
        const pillar = a.pillar || 'General';
        if (!groups[pillar]) groups[pillar] = [];
        const done = planWeek ? !!progress.completedActions[`${planWeek.id}-${i}`] : false;
        groups[pillar].push({ action: a, weekNum: sw.week, actionIdx: i, weekId: planWeek?.id || '', done });
      });
    });
    return groups;
  }, [structuredWeeks, plan, progress]);

  const pillars = Object.keys(pillarGroups);
  const filteredPillars = filter === 'all' ? pillars : pillars.filter(p => p === filter);

  if (loading || !plan) {
    return (
      <DashboardLayout title="Practice">
        <div className="rounded-xl border border-border bg-card p-8 text-center space-y-3">
          <Dumbbell className="w-10 h-10 text-muted-foreground mx-auto" />
          <h2 className="text-base font-semibold text-card-foreground">{loading ? 'Loading...' : 'No Practice Activities Yet'}</h2>
          {!loading && <p className="text-sm text-muted-foreground">Complete onboarding to get your personalized practice plan.</p>}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Practice">
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold text-card-foreground">Practice & Skill Building</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          All your practice activities organized by readiness pillar. Track what you've done and what's next.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          All Pillars
        </button>
        {pillars.map(p => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === p ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {filteredPillars.map(pillar => {
        const cfg = pillarConfig[pillar] || { icon: Dumbbell, color: 'text-muted-foreground bg-secondary' };
        const Icon = cfg.icon;
        const items = pillarGroups[pillar];
        const doneCount = items.filter(i => i.done).length;

        return (
          <div key={pillar} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${cfg.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground">{pillar}</h3>
                  <p className="text-[11px] text-muted-foreground">{doneCount}/{items.length} completed</p>
                </div>
              </div>
              <div className="h-2 w-24 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/70 transition-all"
                  style={{ width: `${items.length > 0 ? (doneCount / items.length) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="divide-y divide-border">
              {items.map((item, idx) => (
                <div key={idx} className={`px-5 py-3 flex items-start gap-3 ${item.done ? 'opacity-60' : ''}`}>
                  {item.done ? (
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${item.done ? 'line-through text-muted-foreground' : 'text-card-foreground'}`}>
                      {item.action.task}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.action.time_estimate_minutes || 30} min</span>
                      <span>·</span>
                      <span>Week {item.weekNum}</span>
                      {item.action.resource && (
                        <>
                          <span>·</span>
                          <span className="truncate max-w-[200px]">{item.action.resource}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </DashboardLayout>
  );
}
