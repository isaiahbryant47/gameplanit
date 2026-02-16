import { BookOpen, Wrench, Award, Users, ArrowRight } from 'lucide-react';
import type { StructuredWeek, StructuredAction } from '@/lib/llmPlanService';

const categoryConfig = {
  Learn: { icon: BookOpen, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  Do: { icon: Wrench, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  Prove: { icon: Award, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  Connect: { icon: Users, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

type Category = keyof typeof categoryConfig;

function categorizeAction(action: StructuredAction): Category {
  const pillar = (action.pillar || '').toLowerCase();
  const task = (action.task || '').toLowerCase();

  if (pillar.includes('academic') || task.includes('study') || task.includes('read') || task.includes('learn') || task.includes('course'))
    return 'Learn';
  if (pillar.includes('proof') || pillar.includes('portfolio') || task.includes('create') || task.includes('build') || task.includes('project'))
    return 'Prove';
  if (pillar.includes('exposure') || pillar.includes('network') || task.includes('connect') || task.includes('mentor') || task.includes('attend'))
    return 'Connect';
  return 'Do';
}

interface Props {
  structuredWeeks: StructuredWeek[];
  currentWeek: number;
}

export default function RecommendedMoves({ structuredWeeks, currentWeek }: Props) {
  // Collect next 2-3 weeks of actions as recommendations
  const upcomingActions: { action: StructuredAction; weekNum: number; category: Category }[] = [];
  for (const sw of structuredWeeks) {
    if (sw.week > currentWeek && sw.week <= currentWeek + 3) {
      for (const a of sw.actions.slice(0, 2)) {
        upcomingActions.push({
          action: a,
          weekNum: sw.week,
          category: categorizeAction(a),
        });
      }
    }
  }

  // Limit to 6 cards
  const cards = upcomingActions.slice(0, 6);

  if (cards.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Recommended Next Moves</h2>
        <span className="text-xs text-muted-foreground">Coming up</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((card, i) => {
          const cfg = categoryConfig[card.category];
          const Icon = cfg.icon;

          return (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-4 space-y-2.5 hover:border-primary/30 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.color}`}>
                  <Icon className="w-3 h-3" />
                  {card.category}
                </span>
                <span className="text-[10px] text-muted-foreground">Week {card.weekNum}</span>
              </div>

              <p className="text-sm font-medium text-card-foreground line-clamp-2">
                {card.action.task}
              </p>

              <p className="text-xs text-muted-foreground line-clamp-1">
                {card.action.resource}
              </p>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{card.action.time_estimate_minutes || 30} min</span>
                {card.action.pillar && (
                  <>
                    <span>·</span>
                    <span>{card.action.pillar}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
