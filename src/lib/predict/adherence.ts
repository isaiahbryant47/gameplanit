/**
 * Predictive Analytics v1 — Deterministic, Explainable Adherence Predictor
 *
 * Predicts next-week plan adherence probability (0–100%) for each user.
 * Architected so the scoring function can be swapped for an ML model later.
 */

export interface AdherenceInput {
  lastWeekCompletionRate: number | null; // 0–1, null if no data
  completionStreakWeeks: number;          // consecutive weeks >= 60% completion
  planComplexity: number;                 // total actions in the upcoming week
  timePerWeekHours: number;              // from profile
}

export interface AdherenceResult {
  probability: number;   // 0–1, clamped [0.05, 0.95]
  riskFlag: boolean;
  drivers: string[];     // top 3 human-readable factors
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * v1 Rules-based scoring. Deterministic and explainable.
 * To swap to ML later: replace this function body with model inference.
 */
export function predictAdherence(input: AdherenceInput): AdherenceResult {
  const rate = input.lastWeekCompletionRate ?? 0.5;
  const streak = input.completionStreakWeeks;
  const complexity = input.planComplexity;
  const hours = input.timePerWeekHours;

  // Component scores
  const baseScore = 0.55;
  const completionBoost = 0.25 * (rate - 0.5);
  const streakBoost = 0.06 * Math.min(streak, 4);
  const complexityPenalty = -0.04 * Math.max(complexity - 4, 0);
  const timeBoost = 0.03 * clamp(hours - 2, -2, 4);

  const raw = baseScore + completionBoost + streakBoost + complexityPenalty + timeBoost;
  const probability = clamp(raw, 0.05, 0.95);

  const riskFlag = probability < 0.55 || rate < 0.35;

  // Build ranked drivers
  const factors: { label: string; impact: number }[] = [
    {
      label: rate >= 0.7
        ? `Strong last-week completion (${Math.round(rate * 100)}%)`
        : rate < 0.35
          ? `Low last-week completion (${Math.round(rate * 100)}%)`
          : `Moderate last-week completion (${Math.round(rate * 100)}%)`,
      impact: Math.abs(completionBoost),
    },
    {
      label: streak >= 3
        ? `${streak}-week completion streak`
        : streak === 0
          ? 'No completion streak yet'
          : `Building streak (${streak} week${streak > 1 ? 's' : ''})`,
      impact: Math.abs(streakBoost),
    },
    {
      label: complexity > 5
        ? `High plan complexity (${complexity} actions)`
        : complexity <= 3
          ? `Light plan (${complexity} actions)`
          : `Moderate plan (${complexity} actions)`,
      impact: Math.abs(complexityPenalty),
    },
    {
      label: hours >= 5
        ? `Good time availability (${hours}h/week)`
        : hours <= 2
          ? `Limited time (${hours}h/week)`
          : `Moderate time (${hours}h/week)`,
      impact: Math.abs(timeBoost),
    },
  ];

  // Sort by impact descending, take top 3
  factors.sort((a, b) => b.impact - a.impact);
  const drivers = factors.slice(0, 3).map(f => f.label);

  return { probability, riskFlag, drivers };
}

/**
 * Compute completion rate for a given week from progress data.
 */
export function getWeekCompletionRate(
  weekId: string,
  actionCount: number,
  completedActions: Record<string, boolean>
): number {
  if (actionCount === 0) return 0;
  let completed = 0;
  for (let i = 0; i < actionCount; i++) {
    if (completedActions[`${weekId}-${i}`]) completed++;
  }
  return completed / actionCount;
}

/**
 * Count consecutive weeks with >= 60% completion, working backwards
 * from the current week (not the last week in the plan).
 */
export function getCompletionStreak(
  weeks: { id: string; actions: string[] }[],
  completedActions: Record<string, boolean>,
  currentWeekIndex?: number
): number {
  let streak = 0;
  const startIndex = currentWeekIndex !== undefined
    ? Math.min(currentWeekIndex, weeks.length - 1)
    : weeks.length - 1;
  for (let i = startIndex; i >= 0; i--) {
    const rate = getWeekCompletionRate(weeks[i].id, weeks[i].actions.length, completedActions);
    if (rate >= 0.6) streak++;
    else break;
  }
  return streak;
}

/**
 * Generate micro-actions for risk-adapted weeks.
 * Low friction, free, <20 min each.
 */
export function generateMicroActions(goal: string, interest: string): string[] {
  return [
    `Spend 15 minutes reviewing one free resource related to ${goal}.`,
    `Write down 3 things you learned this week about ${interest}.`,
    `Set one small, achievable target for ${goal} next week.`,
  ];
}
