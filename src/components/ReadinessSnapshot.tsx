import { GraduationCap, Wrench, Users, FolderOpen, Compass } from 'lucide-react';
import type { ReadinessExplanation } from '@/lib/readinessEngine';

const pillarIcons: Record<string, typeof GraduationCap> = {
  'Academic Readiness': GraduationCap,
  'Skill Development': Wrench,
  'Exposure & Networking': Users,
  'Proof & Portfolio': FolderOpen,
};

interface Props {
  readinessData: ReadinessExplanation | null;
}

export default function ReadinessSnapshot({ readinessData }: Props) {
  if (!readinessData || readinessData.pillars.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-card-foreground mb-2">Readiness Snapshot</h2>
        <p className="text-xs text-muted-foreground">
          Complete actions in your plan to start building your readiness score. Every step counts!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-card-foreground">Readiness Snapshot</h2>
        <span className="text-xs font-medium text-foreground">{readinessData.overallScore}% overall</span>
      </div>

      <div className="space-y-3">
        {readinessData.pillars.map(p => {
          const Icon = pillarIcons[p.name] || Compass;
          return (
            <div key={p.name} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                  {p.name}
                </span>
                <span className="text-xs font-semibold text-foreground">{p.score}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/80 transition-all duration-500"
                  style={{ width: `${p.score}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">{p.description}</p>
            </div>
          );
        })}
      </div>

      {/* Growth messaging */}
      <div className="flex flex-wrap gap-3 pt-1 border-t border-border">
        {readinessData.strongestPillar && (
          <span className="text-[11px] text-success font-medium">
            ★ Your strength: {readinessData.strongestPillar}
          </span>
        )}
        {readinessData.weakestPillar && readinessData.weakestPillar !== readinessData.strongestPillar && (
          <span className="text-[11px] text-warning font-medium">
            ↑ Room to grow: {readinessData.weakestPillar}
          </span>
        )}
      </div>
    </div>
  );
}
