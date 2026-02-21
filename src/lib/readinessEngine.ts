/**
 * Phase 3 — Career Readiness Scoring Engine
 *
 * Deterministic, explainable, extensible.
 * All formulas are transparent and documented so users never feel
 * the score is random.
 *
 * Phase 4 can replace the formulas with ML without changing the API.
 */

import { supabase } from "@/integrations/supabase/client";

// ────────────────────────── Types ──────────────────────────

export interface PillarProgress {
  id: string;
  userId: string;
  careerPillarId: string;
  pillarName: string;
  pillarWeight: number;
  progressScore: number;      // 0-100
  milestoneContribution: number;
  cycleContribution: number;
  opportunityContribution: number;
  lastUpdated: string;
}

export interface UserReadiness {
  id: string;
  userId: string;
  careerPathId: string;
  overallScore: number;       // 0-100
  previousScore: number;
  strongestPillar: string | null;
  weakestPillar: string | null;
  lastUpdated: string;
}

export interface ReadinessExplanation {
  overallScore: number;
  previousScore: number;
  trend: 'up' | 'down' | 'stable';
  strongestPillar: string | null;
  weakestPillar: string | null;
  pillars: {
    name: string;
    score: number;
    weight: number;
    weightedContribution: number;
    breakdown: {
      milestoneContribution: number;
      cycleContribution: number;
      opportunityContribution: number;
    };
    description: string;
  }[];
  nextCycleRecommendation: string;
  nextCycleReason: string;
  difficultyTier: number;     // 1, 2, or 3
}

export interface ScoringContext {
  userId: string;
  careerPathId: string;
  cycleNumber: number;
  /** Per-pillar milestone completion rates: { "Academic Readiness": 45, ... } */
  pillarMilestoneRates: Record<string, number>;
  /** Overall milestone completion across all pillars 0-100 */
  overallMilestoneRate: number;
  /** Pillar names with accepted opportunities */
  acceptedOpportunityPillars: string[];
}

// ────────────────────── Scoring Formula ──────────────────────

/**
 * pillarProgress =
 *   (milestoneCompletionRate × 0.5)
 *   + (cycleCompletionRate × 0.3)
 *   + (opportunityEngagementScore × 0.2)
 *
 * Clamped to 0-100.
 */
function calculatePillarScore(
  milestoneRate: number,
  cycleNumber: number,
  hasAcceptedOpportunity: boolean,
): { score: number; milestone: number; cycle: number; opportunity: number } {
  const maxCycles = 3;
  const cycleRate = Math.min(cycleNumber / maxCycles, 1) * 100;
  const opportunityScore = hasAcceptedOpportunity ? 100 : 0;

  const milestone = milestoneRate * 0.5;
  const cycle = cycleRate * 0.3;
  const opportunity = opportunityScore * 0.2;

  const score = Math.round(Math.min(milestone + cycle + opportunity, 100));
  return { score, milestone: Math.round(milestone), cycle: Math.round(cycle), opportunity: Math.round(opportunity) };
}

/**
 * overallScore = Σ (pillarProgress × pillarWeight)
 */
function calculateOverallScore(
  pillarScores: { score: number; weight: number }[],
): number {
  if (pillarScores.length === 0) return 0;
  const total = pillarScores.reduce((sum, p) => sum + p.score * p.weight, 0);
  return Math.round(Math.min(total, 100));
}

/**
 * difficultyTier:
 *   0-33  → 1
 *   34-66 → 2
 *   67+   → 3
 */
export function getDifficultyTier(overallScore: number): number {
  if (overallScore >= 67) return 3;
  if (overallScore >= 34) return 2;
  return 1;
}

// ────────────────────── DB Operations ──────────────────────

/** Fetch pillar definitions for a career path */
async function fetchPillars(careerPathId: string) {
  const { data } = await supabase
    .from("career_pillars")
    .select("*")
    .eq("career_path_id", careerPathId);
  return (data || []).map((r: any) => ({
    id: r.id as string,
    name: r.name as string,
    weight: Number(r.weight),
  }));
}

/** Fetch existing pillar progress rows for user */
async function fetchPillarProgress(userId: string, pillarIds: string[]): Promise<Record<string, any>> {
  if (pillarIds.length === 0) return {};
  const { data } = await supabase
    .from("user_pillar_progress")
    .select("*")
    .eq("user_id", userId)
    .in("career_pillar_id", pillarIds);
  const map: Record<string, any> = {};
  (data || []).forEach((r: any) => { map[r.career_pillar_id] = r; });
  return map;
}

/** Fetch existing readiness row */
async function fetchReadiness(userId: string, careerPathId: string): Promise<any | null> {
  const { data } = await supabase
    .from("user_readiness")
    .select("*")
    .eq("user_id", userId)
    .eq("career_path_id", careerPathId)
    .maybeSingle();
  return data;
}

// ────────────────── Main Recalculation ──────────────────

/**
 * Recalculate and persist all pillar scores + overall readiness.
 * Called whenever user completes actions, milestones, or accepts opportunities.
 */
export async function recalculateReadiness(ctx: ScoringContext): Promise<ReadinessExplanation> {
  // 1. Fetch pillar definitions
  const pillars = await fetchPillars(ctx.careerPathId);
  if (pillars.length === 0) {
    return emptyExplanation();
  }

  // Normalize weights so they sum to 1.0
  const weightSum = pillars.reduce((s, p) => s + p.weight, 0);
  const normalizedPillars = pillars.map(p => ({
    ...p,
    weight: weightSum > 0 ? p.weight / weightSum : 1 / pillars.length,
  }));

  // 2. Fetch existing progress
  const existingProgress = await fetchPillarProgress(ctx.userId, pillars.map(p => p.id));

  // 3. Calculate each pillar
  const pillarResults: {
    pillarId: string;
    name: string;
    weight: number;
    score: number;
    milestone: number;
    cycle: number;
    opportunity: number;
  }[] = [];

  for (const pillar of normalizedPillars) {
    const milestoneRate = ctx.pillarMilestoneRates[pillar.name] ?? ctx.overallMilestoneRate;
    const hasOppAccepted = ctx.acceptedOpportunityPillars.includes(pillar.name);
    const calc = calculatePillarScore(milestoneRate, ctx.cycleNumber, hasOppAccepted);

    pillarResults.push({
      pillarId: pillar.id,
      name: pillar.name,
      weight: pillar.weight,
      ...calc,
    });
  }

  // 4. Calculate overall
  const overallScore = calculateOverallScore(pillarResults.map(p => ({ score: p.score, weight: p.weight })));

  // 5. Fetch old readiness for trend
  const oldReadiness = await fetchReadiness(ctx.userId, ctx.careerPathId);
  const previousScore = oldReadiness ? Number(oldReadiness.overall_score) : 0;

  // 6. Identify strongest/weakest
  const sorted = [...pillarResults].sort((a, b) => b.score - a.score);
  const strongestPillar = sorted[0]?.name || null;
  const weakestPillar = sorted[sorted.length - 1]?.name || null;

  // 7. Persist pillar progress (batched upsert)
  const now = new Date().toISOString();
  const toUpdate = pillarResults.filter(pr => existingProgress[pr.pillarId]);
  const toInsert = pillarResults.filter(pr => !existingProgress[pr.pillarId]);

  const pillarWritePromises: Promise<unknown>[] = [];

  if (toUpdate.length > 0) {
    pillarWritePromises.push(
      ...toUpdate.map(pr =>
        supabase
          .from("user_pillar_progress")
          .update({
            progress_score: pr.score,
            milestone_contribution: pr.milestone,
            cycle_contribution: pr.cycle,
            opportunity_contribution: pr.opportunity,
            last_updated: now,
          })
          .eq("id", existingProgress[pr.pillarId].id)
      )
    );
  }

  if (toInsert.length > 0) {
    pillarWritePromises.push(
      supabase
        .from("user_pillar_progress")
        .insert(toInsert.map(pr => ({
          user_id: ctx.userId,
          career_pillar_id: pr.pillarId,
          progress_score: pr.score,
          milestone_contribution: pr.milestone,
          cycle_contribution: pr.cycle,
          opportunity_contribution: pr.opportunity,
        })))
    );
  }

  // 8. Persist overall readiness (upsert) — batched with pillar writes
  if (oldReadiness) {
    pillarWritePromises.push(
      supabase
        .from("user_readiness")
        .update({
          overall_score: overallScore,
          previous_score: previousScore,
          strongest_pillar: strongestPillar,
          weakest_pillar: weakestPillar,
          last_updated: now,
        })
        .eq("id", oldReadiness.id)
    );
  } else {
    pillarWritePromises.push(
      supabase
        .from("user_readiness")
        .insert({
          user_id: ctx.userId,
          career_path_id: ctx.careerPathId,
          overall_score: overallScore,
          previous_score: previousScore,
          strongest_pillar: strongestPillar,
          weakest_pillar: weakestPillar,
        })
    );
  }

  await Promise.all(pillarWritePromises);

  // 9. Build explanation
  const trend: 'up' | 'down' | 'stable' =
    overallScore > previousScore ? 'up' :
    overallScore < previousScore ? 'down' : 'stable';

  const difficultyTier = getDifficultyTier(overallScore);

  return {
    overallScore,
    previousScore,
    trend,
    strongestPillar,
    weakestPillar,
    pillars: pillarResults.map(p => ({
      name: p.name,
      score: p.score,
      weight: p.weight,
      weightedContribution: Math.round(p.score * p.weight),
      breakdown: {
        milestoneContribution: p.milestone,
        cycleContribution: p.cycle,
        opportunityContribution: p.opportunity,
      },
      description: describePillar(p.name, p.score),
    })),
    nextCycleRecommendation: weakestPillar || 'General Exploration',
    nextCycleReason: weakestPillar
      ? `${weakestPillar} is currently your lowest readiness score at ${sorted[sorted.length - 1]?.score || 0}%.`
      : 'Continue building across all pillars.',
    difficultyTier,
  };
}

// ────────────────── Read-Only Queries ──────────────────

/** Get the current readiness explanation without recalculating */
export async function getReadinessExplanation(
  userId: string,
  careerPathId: string,
): Promise<ReadinessExplanation> {
  const pillars = await fetchPillars(careerPathId);
  if (pillars.length === 0) return emptyExplanation();

  const weightSum = pillars.reduce((s, p) => s + p.weight, 0);
  const normalizedPillars = pillars.map(p => ({
    ...p,
    weight: weightSum > 0 ? p.weight / weightSum : 1 / pillars.length,
  }));

  const progressMap = await fetchPillarProgress(userId, pillars.map(p => p.id));
  const readiness = await fetchReadiness(userId, careerPathId);

  const pillarData = normalizedPillars.map(p => {
    const prog = progressMap[p.id];
    const score = prog ? Number(prog.progress_score) : 0;
    return {
      name: p.name,
      score,
      weight: p.weight,
      weightedContribution: Math.round(score * p.weight),
      breakdown: {
        milestoneContribution: prog ? Number(prog.milestone_contribution) : 0,
        cycleContribution: prog ? Number(prog.cycle_contribution) : 0,
        opportunityContribution: prog ? Number(prog.opportunity_contribution) : 0,
      },
      description: describePillar(p.name, score),
    };
  });

  const overallScore = readiness ? Number(readiness.overall_score) : 0;
  const previousScore = readiness ? Number(readiness.previous_score) : 0;
  const strongestPillar = readiness?.strongest_pillar || null;
  const weakestPillar = readiness?.weakest_pillar || null;

  const trend: 'up' | 'down' | 'stable' =
    overallScore > previousScore ? 'up' :
    overallScore < previousScore ? 'down' : 'stable';

  const weakestScore = pillarData.reduce((min, p) => p.score < min.score ? p : min, pillarData[0]);

  return {
    overallScore,
    previousScore,
    trend,
    strongestPillar,
    weakestPillar,
    pillars: pillarData,
    nextCycleRecommendation: weakestPillar || weakestScore?.name || 'General Exploration',
    nextCycleReason: weakestPillar
      ? `${weakestPillar} is currently your lowest readiness score at ${weakestScore?.score || 0}%.`
      : 'Continue building across all pillars.',
    difficultyTier: getDifficultyTier(overallScore),
  };
}

// ────────────────── Helpers ──────────────────

function describePillar(name: string, score: number): string {
  if (score >= 80) return `Excellent ${name} — you're well-prepared in this area.`;
  if (score >= 60) return `Strong ${name} — keep building on this momentum.`;
  if (score >= 40) return `Growing ${name} — continue engaging with activities here.`;
  if (score >= 20) return `Emerging ${name} — focus more actions in this area.`;
  return `Just starting ${name} — look for activities to boost this pillar.`;
}

function emptyExplanation(): ReadinessExplanation {
  return {
    overallScore: 0,
    previousScore: 0,
    trend: 'stable',
    strongestPillar: null,
    weakestPillar: null,
    pillars: [],
    nextCycleRecommendation: 'General Exploration',
    nextCycleReason: 'Start your first cycle to begin building career readiness.',
    difficultyTier: 1,
  };
}
