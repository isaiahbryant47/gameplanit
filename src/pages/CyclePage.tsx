import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { storage } from '@/lib/storage';
import DashboardLayout from '@/components/DashboardLayout';
import PlanCalendarView from '@/components/PlanCalendarView';
import { CalendarDays, Target, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function CyclePage() {
  const { user } = useAuth();

  const profile = user ? storage.allProfiles().find(p => p.userId === user.id) : undefined;
  const plan = user ? storage.allPlans().find(p => p.userId === user.id) : undefined;

  if (!user) return <Navigate to="/login" />;

  if (!profile || !plan) {
    return (
      <DashboardLayout title="My 12-Week Cycle">
        <div className="rounded-xl border border-border bg-card p-8 text-center space-y-3">
          <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto" />
          <h2 className="text-base font-semibold text-card-foreground">No Active Cycle</h2>
          <p className="text-sm text-muted-foreground">Complete onboarding to start your first 12-week cycle.</p>
        </div>
      </DashboardLayout>
    );
  }

  const cycleNumber = plan.cycleNumber || 1;
  const daysSinceStart = Math.floor((Date.now() - new Date(plan.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const currentWeekNum = Math.min(12, Math.max(1, Math.ceil(daysSinceStart / 7)));
  const progress = storage.getProgress(user.id);
  const totalActions = plan.weeks.reduce((sum, w) => sum + w.actions.length, 0);
  const completedCount = plan.weeks.reduce((sum, w) =>
    sum + w.actions.filter((_, i) => progress.completedActions[`${w.id}-${i}`]).length, 0
  );
  const completionRate = totalActions > 0 ? Math.round((completedCount / totalActions) * 100) : 0;

  const weeklyStats = plan.weeks.map(w => {
    const done = w.actions.filter((_, i) => progress.completedActions[`${w.id}-${i}`]).length;
    return { weekNumber: w.weekNumber, focus: w.focus, total: w.actions.length, done, milestones: w.milestones };
  });

  return (
    <DashboardLayout title="My 12-Week Cycle">
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold text-card-foreground">Cycle {cycleNumber}</h2>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> Week {currentWeekNum} of 12
            </span>
            <span className="font-semibold text-primary">{completionRate}% complete</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="h-3 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${completionRate}%` }} />
          </div>
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>{completedCount} of {totalActions} actions done</span>
            <span>{12 - currentWeekNum} weeks remaining</span>
          </div>
        </div>
      </div>

      <PlanCalendarView plan={plan} />

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Week-by-Week Breakdown</h3>
        <div className="space-y-2">
          {weeklyStats.map(w => {
            const pct = w.total > 0 ? Math.round((w.done / w.total) * 100) : 0;
            const isCurrent = w.weekNumber === currentWeekNum;
            const isPast = w.weekNumber < currentWeekNum;
            return (
              <div
                key={w.weekNumber}
                className={`rounded-lg border p-4 transition-colors ${
                  isCurrent ? 'border-primary/40 bg-primary/5' : isPast && pct === 100 ? 'border-success/30 bg-success/5' : 'border-border bg-card'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${
                      isCurrent ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                    }`}>
                      W{w.weekNumber}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{w.focus}</p>
                      {isCurrent && <span className="text-[10px] font-semibold text-primary uppercase">Current Week</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pct === 100 && <CheckCircle2 className="w-4 h-4 text-success" />}
                    {isPast && pct < 100 && <AlertCircle className="w-4 h-4 text-warning" />}
                    <span className="text-xs font-semibold text-muted-foreground">{w.done}/{w.total}</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${pct === 100 ? 'bg-success' : 'bg-primary/70'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {w.milestones.length > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
                    <Target className="w-3 h-3" /> {w.milestones[0]}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
