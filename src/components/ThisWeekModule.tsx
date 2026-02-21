import { CheckSquare, Square, BookOpen, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { Plan } from '@/lib/types';
import type { StructuredWeek, StructuredAction } from '@/lib/llmPlanService';
import { storage, type ProgressData } from '@/lib/storage';

interface Props {
  plan: Plan;
  structuredWeeks: StructuredWeek[];
  userId: string;
  progress: ProgressData;
  onProgressChange: (p: ProgressData) => void;
}

export default function ThisWeekModule({ plan, structuredWeeks, userId, progress, onProgressChange }: Props) {
  const [expanded, setExpanded] = useState(true);

  // Current week based on plan creation date (handle day-0 and clock skew)
  const daysSinceStart = Math.max(0, Math.floor((Date.now() - new Date(plan.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
  const currentWeekNum = Math.min(12, Math.max(1, Math.ceil((daysSinceStart + 1) / 7)));

  const currentPlanWeek = plan.weeks.find(w => w.weekNumber === currentWeekNum);
  const currentStructuredWeek = structuredWeeks.find(w => w.week === currentWeekNum);

  if (!currentPlanWeek) return null;

  const toggleAction = (actionKey: string) => {
    const updated = {
      ...progress,
      completedActions: {
        ...progress.completedActions,
        [actionKey]: !progress.completedActions[actionKey],
      },
    };
    onProgressChange(updated);
    storage.saveProgress(userId, updated);
  };

  const actions = currentStructuredWeek?.actions || [];
  const completedCount = actions.filter((_, i) =>
    progress.completedActions[`${currentPlanWeek.id}-${i}`]
  ).length;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-secondary/30 transition-colors"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground text-xs font-bold">
              W{currentWeekNum}
            </span>
            <h2 className="text-sm font-semibold text-card-foreground">This Week</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {currentStructuredWeek?.focus || currentPlanWeek.focus} · {completedCount}/{actions.length} done
          </p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-3">
          {actions.length > 0 ? (
            actions.map((a: StructuredAction, i: number) => {
              const actionKey = `${currentPlanWeek.id}-${i}`;
              const done = !!progress.completedActions[actionKey];

              return (
                <div
                  key={i}
                  className={`rounded-lg border p-4 space-y-2.5 transition-colors ${
                    done ? 'border-primary/30 bg-primary/5' : 'border-border'
                  }`}
                >
                  {/* Task + toggle */}
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggleAction(actionKey)} className="mt-0.5 shrink-0">
                      {done ? (
                        <CheckSquare className="w-5 h-5 text-primary" />
                      ) : (
                        <Square className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${done ? 'line-through text-muted-foreground' : 'text-card-foreground'}`}>
                        {a.task}
                      </p>
                      {a.success_metric && (
                        <p className="text-xs text-muted-foreground mt-0.5 italic">
                          Why: {a.success_metric}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Resource details */}
                  {!done && (
                    <div className="ml-8 space-y-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="text-xs font-semibold text-foreground">{a.resource}</span>
                      </div>

                      {a.access_steps && a.access_steps.length > 0 && (
                        <div className="rounded-lg bg-secondary/50 p-3">
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            How to access
                          </p>
                          <ol className="list-decimal list-inside space-y-0.5">
                            {a.access_steps.map((s, si) => (
                              <li key={si} className="text-xs text-foreground">{s}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {a.use_steps && a.use_steps.length > 0 && (
                        <div className="rounded-lg bg-accent/30 p-3">
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            How to use
                          </p>
                          <ol className="list-decimal list-inside space-y-0.5">
                            {a.use_steps.map((s, si) => (
                              <li key={si} className="text-xs text-foreground">{s}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {a.time_estimate_minutes ? `${a.time_estimate_minutes} min` : '30 min'}
                        </span>
                        {a.pillar && (
                          <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                            {a.pillar}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            // Fallback to plain actions
            <ul className="space-y-2">
              {currentPlanWeek.actions.map((a, i) => {
                const actionKey = `${currentPlanWeek.id}-${i}`;
                const done = !!progress.completedActions[actionKey];
                return (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <button onClick={() => toggleAction(actionKey)} className="mt-0.5 shrink-0">
                      {done ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5 text-muted-foreground" />}
                    </button>
                    <span className={done ? 'line-through text-muted-foreground' : 'text-card-foreground'}>{a}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
