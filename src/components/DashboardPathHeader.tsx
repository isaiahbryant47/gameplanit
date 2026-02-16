import { ArrowRight, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import type { Profile, Plan } from '@/lib/types';
import type { ReadinessExplanation } from '@/lib/readinessEngine';

const stages = [
  { key: 'explore', label: 'Explore', description: 'Discover what excites you' },
  { key: 'build-skills', label: 'Build Skills', description: 'Develop core abilities' },
  { key: 'build-proof', label: 'Build Proof', description: 'Create tangible evidence' },
  { key: 'apply', label: 'Apply & Unlock', description: 'Open real doors' },
];

function getStageIndex(cycleNumber: number): number {
  if (cycleNumber <= 1) return 0;
  if (cycleNumber === 2) return 1;
  if (cycleNumber === 3) return 2;
  return 3;
}

function getWhyThisMatters(stageKey: string): string {
  switch (stageKey) {
    case 'explore':
      return "Right now, you're exploring what interests you and building a foundation. This is where you figure out what direction feels right — there's no wrong answer here.";
    case 'build-skills':
      return "You're building real skills that connect to your career path. Every activity this cycle is designed to grow your abilities and confidence.";
    case 'build-proof':
      return "This is where you turn what you've learned into proof — projects, certifications, and experiences that show what you can do.";
    case 'apply':
      return "You've built a strong foundation. Now it's time to apply for real opportunities and unlock the doors your hard work has opened.";
    default:
      return "Every step you take brings you closer to your goals. Keep going!";
  }
}

interface Props {
  profile: Profile;
  plan: Plan;
  cycleNumber: number;
  readinessScore: number;
  readinessData: ReadinessExplanation | null;
  completionRate: number;
}

export default function DashboardPathHeader({
  profile,
  plan,
  cycleNumber,
  readinessScore,
  readinessData,
  completionRate,
}: Props) {
  const careerPathName = profile.careerPathName || 'General Exploration';
  const careerDomainName = profile.careerDomainName || '';
  const stageIndex = getStageIndex(cycleNumber);
  const currentStage = stages[stageIndex];

  return (
    <div className="space-y-4">
      {/* Career Path + Cycle */}
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          {careerDomainName && (
            <span className="text-sm text-muted-foreground">{careerDomainName}</span>
          )}
          {careerDomainName && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
          <h1 className="text-xl font-bold text-foreground">{careerPathName}</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Cycle {cycleNumber} of 3 · {Math.round(completionRate * 100)}% complete
        </p>
      </div>

      {/* Path Map */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Your Path Map
        </p>
        <div className="flex items-center gap-1">
          {stages.map((stage, i) => {
            const isPast = i < stageIndex;
            const isCurrent = i === stageIndex;
            const isFuture = i > stageIndex;

            return (
              <div key={stage.key} className="flex items-center flex-1 min-w-0">
                <div
                  className={`flex-1 rounded-lg px-3 py-2.5 text-center transition-all ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : isPast
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  <p className={`text-xs font-semibold ${isCurrent ? '' : ''}`}>{stage.label}</p>
                </div>
                {i < stages.length - 1 && (
                  <ArrowRight className={`w-3.5 h-3.5 mx-0.5 shrink-0 ${
                    isPast ? 'text-accent-foreground' : 'text-muted-foreground/40'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Why This Matters */}
      <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
        <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
          💡 Why this matters
        </p>
        <p className="text-sm text-foreground leading-relaxed">
          {getWhyThisMatters(currentStage.key)}
        </p>
      </div>

      {/* Readiness bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-muted-foreground">Career Readiness</span>
            <span className="flex items-center gap-1 font-semibold text-foreground">
              {readinessScore}%
              {readinessData?.trend === 'up' && <ArrowUpRight className="w-3 h-3 text-success" />}
              {readinessData?.trend === 'down' && <ArrowDownRight className="w-3 h-3 text-destructive" />}
              {readinessData?.trend === 'stable' && <Minus className="w-3 h-3 text-muted-foreground" />}
            </span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${readinessScore}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
