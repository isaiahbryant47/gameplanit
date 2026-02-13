import { useState, useMemo } from 'react';
import { storage, type ProgressData } from '@/lib/storage';
import type { Plan, Profile } from '@/lib/types';
import { TrendingUp, Target, BookOpen, GraduationCap, Plus, ChevronDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props {
  plan: Plan;
  profile: Profile;
  userId: string;
}

export default function KpiSection({ plan, profile, userId }: Props) {
  const [progress, setProgress] = useState(() => storage.getProgress(userId));
  const [showAcademicForm, setShowAcademicForm] = useState(false);
  const [gpaInput, setGpaInput] = useState('');
  const [attendanceInput, setAttendanceInput] = useState('');
  const [expanded, setExpanded] = useState(true);

  const save = (updated: ProgressData) => {
    setProgress(updated);
    storage.saveProgress(userId, updated);
  };

  const totalActions = plan.weeks.reduce((sum, w) => sum + w.actions.length, 0);
  const completedCount = Object.values(progress.completedActions).filter(Boolean).length;
  const weeklyPct = totalActions > 0 ? Math.round((completedCount / totalActions) * 100) : 0;

  // Goal completion: % of weeks with at least one completed action per goal
  const goalStats = useMemo(() => {
    const goalMap = new Map<string, { total: number; completed: number }>();
    plan.weeks.forEach(week => {
      const goal = week.focus.includes(' - ') ? week.focus.split(' - ').slice(1).join(' - ') : week.focus;
      if (!goalMap.has(goal)) goalMap.set(goal, { total: 0, completed: 0 });
      const entry = goalMap.get(goal)!;
      entry.total += week.actions.length;
      week.actions.forEach((_, idx) => {
        if (progress.completedActions[`${week.id}-${idx}`]) entry.completed++;
      });
    });
    return Array.from(goalMap.entries()).map(([goal, stats]) => ({
      goal,
      pct: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      completed: stats.completed,
      total: stats.total,
    }));
  }, [plan.weeks, progress.completedActions]);

  const resourceCount = progress.resourcesEngaged.length;
  const totalResources = plan.weeks.reduce((sum, w) => sum + w.resources.length, 0);
  const resourcePct = totalResources > 0 ? Math.round((resourceCount / totalResources) * 100) : 0;

  // Current week based on plan creation date
  const daysSinceStart = Math.floor((Date.now() - new Date(plan.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const currentWeek = Math.min(12, Math.max(1, Math.ceil(daysSinceStart / 7)));

  const addAcademicEntry = () => {
    if (!gpaInput && !attendanceInput) return;
    const entry = {
      date: new Date().toISOString(),
      gpa: gpaInput ? Number(gpaInput) : undefined,
      attendance: attendanceInput ? Number(attendanceInput) : undefined,
    };
    save({ ...progress, academicLog: [...progress.academicLog, entry] });
    setGpaInput('');
    setAttendanceInput('');
    setShowAcademicForm(false);
  };

  const latestAcademic = progress.academicLog.length > 0 ? progress.academicLog[progress.academicLog.length - 1] : null;

  const kpis = [
    {
      icon: TrendingUp,
      label: 'Weekly Progress',
      value: `${completedCount}/${totalActions}`,
      pct: weeklyPct,
      sub: `Week ${currentWeek} of 12`,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      icon: Target,
      label: 'Goals Completed',
      value: `${Object.keys(progress.completedGoals || {}).length}/${goalStats.length}`,
      pct: goalStats.length > 0 ? Math.round((Object.keys(progress.completedGoals || {}).length / goalStats.length) * 100) : 0,
      sub: `${goalStats.length} goals tracked`,
      color: 'text-accent-foreground',
      bg: 'bg-accent',
    },
    {
      icon: BookOpen,
      label: 'Resources Used',
      value: `${resourceCount}/${totalResources}`,
      pct: resourcePct,
      sub: 'Engaged with',
      color: 'text-primary',
      bg: 'bg-secondary',
    },
    {
      icon: GraduationCap,
      label: 'Academic Baseline',
      value: latestAcademic ? `${latestAcademic.gpa ?? '—'} GPA` : 'No data',
      pct: latestAcademic?.attendance ?? 0,
      sub: latestAcademic ? `${latestAcademic.attendance ?? '—'}% attendance` : 'Log your first entry',
      color: 'text-primary',
      bg: 'bg-muted',
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-card-foreground">Progress & KPIs</h2>
          <span className="text-xs text-muted-foreground ml-2">{weeklyPct}% overall</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {kpis.map(k => (
              <div key={k.label} className={`rounded-xl ${k.bg} p-3 space-y-2`}>
                <div className="flex items-center gap-1.5">
                  <k.icon className={`w-3.5 h-3.5 ${k.color}`} />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{k.label}</span>
                </div>
                <p className="text-lg font-bold text-card-foreground">{k.value}</p>
                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(k.pct, 100)}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Goal Breakdown */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Goal Breakdown</h3>
            <div className="space-y-2">
              {goalStats.map(g => (
                <div key={g.goal} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-card-foreground capitalize truncate">{g.goal}</span>
                      <span className="text-[10px] text-muted-foreground ml-2">{g.completed}/{g.total}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${g.pct}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-card-foreground w-10 text-right">{g.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Academic Log */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Academic Log</h3>
              <button
                onClick={() => setShowAcademicForm(!showAcademicForm)}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus className="w-3 h-3" /> Log Entry
              </button>
            </div>
            {showAcademicForm && (
              <div className="flex items-end gap-2 mb-3 p-3 rounded-lg bg-secondary/50 border border-border">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground block mb-1">GPA</label>
                  <input
                    className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    value={gpaInput}
                    onChange={e => setGpaInput(e.target.value)}
                    placeholder="e.g. 3.2"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground block mb-1">Attendance %</label>
                  <input
                    className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    value={attendanceInput}
                    onChange={e => setAttendanceInput(e.target.value)}
                    placeholder="e.g. 92"
                  />
                </div>
                <button onClick={addAcademicEntry} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                  Save
                </button>
              </div>
            )}
            {progress.academicLog.length > 0 ? (
              <div className="space-y-3">
                {/* Chart */}
                {progress.academicLog.length >= 2 && (
                  <div className="rounded-lg border border-border bg-background p-3">
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={progress.academicLog.map(e => ({
                        date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        GPA: e.gpa != null ? e.gpa : undefined,
                        Attendance: e.attendance != null ? e.attendance : undefined,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis yAxisId="gpa" domain={[0, 4]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={30} />
                        <YAxis yAxisId="att" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={35} />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                          labelStyle={{ color: 'hsl(var(--card-foreground))' }}
                        />
                        <Line yAxisId="gpa" type="monotone" dataKey="GPA" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: 'hsl(var(--primary))' }} connectNulls />
                        <Line yAxisId="att" type="monotone" dataKey="Attendance" stroke="hsl(var(--accent-foreground))" strokeWidth={2} dot={{ r: 3, fill: 'hsl(var(--accent-foreground))' }} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="flex items-center justify-center gap-4 mt-1">
                      <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="w-3 h-0.5 rounded bg-primary inline-block" /> GPA (0–4)
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="w-3 h-0.5 rounded bg-accent-foreground inline-block" /> Attendance (0–100%)
                      </span>
                    </div>
                  </div>
                )}
                {/* Entry cards */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {progress.academicLog.slice(-6).map((entry, i) => (
                    <div key={i} className="shrink-0 rounded-lg bg-muted px-3 py-2 min-w-[100px]">
                      <p className="text-[10px] text-muted-foreground">{new Date(entry.date).toLocaleDateString()}</p>
                      {entry.gpa != null && <p className="text-xs font-semibold text-card-foreground">{entry.gpa} GPA</p>}
                      {entry.attendance != null && <p className="text-[10px] text-muted-foreground">{entry.attendance}% att.</p>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No entries yet. Log your GPA and attendance to track trends.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
