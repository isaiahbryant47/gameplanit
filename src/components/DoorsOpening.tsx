import { Trophy, Lock, ArrowRight } from 'lucide-react';
import CareerUnlockedOpportunities from '@/components/CareerUnlockedOpportunities';

interface Props {
  userId: string;
  careerPathId?: string;
  completionRate: number;
  cycleNumber: number;
  overallReadinessScore: number;
  hasUnlocks: boolean;
}

export default function DoorsOpening({
  userId,
  careerPathId,
  completionRate,
  cycleNumber,
  overallReadinessScore,
  hasUnlocks,
}: Props) {
  if (!careerPathId) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Trophy className="w-4 h-4 text-primary" />
        Doors Opening
      </h2>

      <CareerUnlockedOpportunities
        userId={userId}
        careerPathId={careerPathId}
        completionRate={completionRate}
        cycleNumber={cycleNumber}
        overallReadinessScore={overallReadinessScore}
      />

      {/* Encouragement when no unlocks yet */}
      {!hasUnlocks && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent shrink-0">
              <Lock className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-card-foreground">
                You're close to unlocking opportunities!
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Keep completing your weekly actions. At {Math.round(completionRate * 100)}% completion,
                you're making progress. Real opportunities like internships, certifications, and programs
                unlock as you build your readiness.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
