import { supabase } from "@/integrations/supabase/client";
import type { CareerOpportunity, CareerUnlockRule, UserCareerUnlock } from "./types";

// ── Fetch opportunities for a career path ──
export async function fetchCareerOpportunities(careerPathId: string): Promise<CareerOpportunity[]> {
  const { data, error } = await supabase
    .from("career_opportunities")
    .select("*")
    .eq("career_path_id", careerPathId)
    .eq("is_active", true)
    .order("difficulty_level");

  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.id,
    careerPathId: r.career_path_id,
    title: r.title,
    description: r.description,
    type: r.type,
    difficultyLevel: r.difficulty_level,
    externalUrl: r.external_url || undefined,
    nextActionLabel: r.next_action_label,
    nextActionInstructions: r.next_action_instructions,
  }));
}

// ── Fetch unlock rules for opportunities ──
export async function fetchUnlockRules(opportunityIds: string[]): Promise<CareerUnlockRule[]> {
  if (opportunityIds.length === 0) return [];
  const { data, error } = await supabase
    .from("career_unlock_rules")
    .select("*")
    .in("opportunity_id", opportunityIds);

  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.id,
    opportunityId: r.opportunity_id,
    requiredCycleNumber: r.required_cycle_number || undefined,
    requiredPillar: r.required_pillar || undefined,
    requiredMilestoneCompletionRate: r.required_milestone_completion_rate,
  }));
}

// ── Fetch user's existing unlocks ──
export async function fetchUserUnlocks(userId: string): Promise<UserCareerUnlock[]> {
  const { data, error } = await supabase
    .from("user_career_unlocks")
    .select("*, career_opportunities(*)")
    .eq("user_id", userId);

  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    opportunityId: r.opportunity_id,
    unlockedAt: r.unlocked_at,
    seen: r.seen,
    accepted: r.accepted,
    opportunity: r.career_opportunities ? {
      id: r.career_opportunities.id,
      careerPathId: r.career_opportunities.career_path_id,
      title: r.career_opportunities.title,
      description: r.career_opportunities.description,
      type: r.career_opportunities.type,
      difficultyLevel: r.career_opportunities.difficulty_level,
      externalUrl: r.career_opportunities.external_url || undefined,
      nextActionLabel: r.career_opportunities.next_action_label,
      nextActionInstructions: r.career_opportunities.next_action_instructions,
    } : undefined,
  }));
}

// ── Evaluate unlocks ──
interface UnlockContext {
  userId: string;
  careerPathId: string;
  cycleNumber: number;
  milestoneCompletionRate: number; // 0-100
  engagedPillars: string[]; // pillar names the user has engaged with
}

export async function evaluateUnlocks(ctx: UnlockContext): Promise<UserCareerUnlock[]> {
  // 1. Get all opportunities for this career path
  const opportunities = await fetchCareerOpportunities(ctx.careerPathId);
  if (opportunities.length === 0) return [];

  // 2. Get unlock rules
  const rules = await fetchUnlockRules(opportunities.map(o => o.id));

  // 3. Get existing unlocks
  const existingUnlocks = await fetchUserUnlocks(ctx.userId);
  const alreadyUnlockedIds = new Set(existingUnlocks.map(u => u.opportunityId));

  // 4. Evaluate each opportunity
  const newUnlocks: UserCareerUnlock[] = [];

  for (const opp of opportunities) {
    if (alreadyUnlockedIds.has(opp.id)) continue;

    const oppRules = rules.filter(r => r.opportunityId === opp.id);
    if (oppRules.length === 0) continue;

    // ALL rules for this opportunity must pass
    const allPassed = oppRules.every(rule => {
      // Check cycle requirement
      if (rule.requiredCycleNumber && ctx.cycleNumber < rule.requiredCycleNumber) return false;
      // Check milestone completion rate
      if (ctx.milestoneCompletionRate < rule.requiredMilestoneCompletionRate) return false;
      // Check pillar engagement
      if (rule.requiredPillar && !ctx.engagedPillars.includes(rule.requiredPillar)) return false;
      return true;
    });

    if (allPassed) {
      // Insert unlock
      const { data, error } = await supabase
        .from("user_career_unlocks")
        .insert({ user_id: ctx.userId, opportunity_id: opp.id })
        .select("*")
        .single();

      if (!error && data) {
        newUnlocks.push({
          id: data.id,
          userId: data.user_id,
          opportunityId: data.opportunity_id,
          unlockedAt: data.unlocked_at,
          seen: data.seen,
          accepted: data.accepted,
          opportunity: opp,
        });
      }
    }
  }

  return newUnlocks;
}

// ── Mark opportunity as seen ──
export async function markOpportunitySeen(unlockId: string): Promise<void> {
  await supabase
    .from("user_career_unlocks")
    .update({ seen: true })
    .eq("id", unlockId);
}

// ── Mark opportunity as accepted ──
export async function markOpportunityAccepted(unlockId: string): Promise<void> {
  await supabase
    .from("user_career_unlocks")
    .update({ accepted: true, seen: true })
    .eq("id", unlockId);
}

// ── Compute readiness score (placeholder for Phase 3) ──
export function computeReadinessScore(
  cycleNumber: number,
  milestoneCompletionRate: number, // 0-100
  engagedPillarCount: number,
  totalPillarCount: number
): number {
  const maxCycles = 3; // normalize cycle completion
  const cycleCompletion = Math.min(cycleNumber / maxCycles, 1) * 100;
  const pillarEngagement = totalPillarCount > 0
    ? (engagedPillarCount / totalPillarCount) * 100
    : 0;

  const score = Math.round(
    (cycleCompletion * 0.4) +
    (milestoneCompletionRate * 0.4) +
    (pillarEngagement * 0.2)
  );

  return Math.min(score, 100);
}

// ── Get unlock reason ──
export function getUnlockReason(
  rules: CareerUnlockRule[],
  cycleNumber: number,
  completionRate: number
): string {
  const reasons: string[] = [];
  for (const rule of rules) {
    if (rule.requiredMilestoneCompletionRate > 0) {
      reasons.push(`${rule.requiredMilestoneCompletionRate}%+ plan completion`);
    }
    if (rule.requiredCycleNumber) {
      reasons.push(`reached Cycle ${rule.requiredCycleNumber}`);
    }
    if (rule.requiredPillar) {
      reasons.push(`engaged with ${rule.requiredPillar}`);
    }
  }
  return reasons.length > 0 ? `You unlocked this by: ${reasons.join(', ')}` : 'Unlocked through your progress!';
}
