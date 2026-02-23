import { supabase } from '@/integrations/supabase/client';
import type { ReadinessExplanation } from '@/lib/readinessEngine';

/**
 * Calls the server-side recompute-readiness edge function.
 * This replaces client-side recalculateReadiness + evaluateUnlocks.
 * Returns readiness data + any new unlocks in a single round-trip.
 */
export interface ServerReadinessResult extends ReadinessExplanation {
  newUnlocks: {
    id: string;
    opportunityId: string;
    title: string;
    type: string;
    description: string;
  }[];
}

export async function recomputeReadinessServer(params: {
  userId: string;
  careerPathId: string;
  cycleNumber: number;
  overallMilestoneRate: number;
  pillarMilestoneRates: Record<string, number>;
  acceptedOpportunityPillars: string[];
  engagedPillars: string[];
}): Promise<ServerReadinessResult> {
  const { data, error } = await supabase.functions.invoke('recompute-readiness', {
    body: params,
  });

  if (error) {
    console.error('recomputeReadinessServer error:', error);
    throw error;
  }

  return data as ServerReadinessResult;
}

/**
 * Standalone unlock evaluation (can be called independently).
 */
export async function evaluateUnlocksServer(params: {
  userId: string;
  careerPathId: string;
  cycleNumber: number;
  milestoneCompletionRate: number;
  engagedPillars: string[];
}): Promise<{ newUnlocks: { id: string; opportunityId: string; title: string; type: string; description: string }[] }> {
  const { data, error } = await supabase.functions.invoke('evaluate-unlocks', {
    body: params,
  });

  if (error) {
    console.error('evaluateUnlocksServer error:', error);
    throw error;
  }

  return data;
}
