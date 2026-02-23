import { supabase } from '@/integrations/supabase/client';
import { fetchUserPlan, type StructuredWeek } from '@/lib/llmPlanService';
import type { Plan } from '@/lib/types';

/**
 * Load a user's plan from Supabase.
 * Returns { plan, structuredWeeks } or undefined plan if none exists.
 */
export async function loadPlan(userId: string): Promise<{ plan: Plan | undefined; structuredWeeks: StructuredWeek[] }> {
  try {
    const supabasePlan = await fetchUserPlan(userId);
    if (supabasePlan && supabasePlan.weeks.length > 0) {
      const localWeeks = supabasePlan.weeks.map(w => ({
        id: `${supabasePlan.planId}-w${w.week}`,
        planId: supabasePlan.planId,
        weekNumber: w.week,
        focus: w.focus,
        actions: w.actions.map(a => a.task),
        resources: w.actions.map(a => a.resource),
        milestones: [w.milestone],
      }));

      // Also check for additional metadata in the plans table
      const { data: planRow } = await supabase
        .from('plans')
        .select('career_path_id, cycle_number, outcome_statement, target_date, primary_pillar_focus, profile_snapshot')
        .eq('id', supabasePlan.planId)
        .maybeSingle();

      const plan: Plan = {
        id: supabasePlan.planId,
        userId,
        profileId: '',
        title: supabasePlan.title,
        createdAt: supabasePlan.createdAt,
        weeks: localWeeks,
        cycleNumber: planRow?.cycle_number || 1,
        careerPathId: planRow?.career_path_id || undefined,
        outcomeStatement: planRow?.outcome_statement || undefined,
        targetDate: planRow?.target_date || undefined,
        primaryPillarFocus: (planRow?.primary_pillar_focus as string[]) || undefined,
      };

      return { plan, structuredWeeks: supabasePlan.weeks };
    }
  } catch (e) {
    console.error('planService.loadPlan error:', e);
  }

  return { plan: undefined, structuredWeeks: [] };
}

/**
 * Load just the structured weeks for a plan from Supabase.
 */
export async function loadStructuredWeeks(userId: string): Promise<StructuredWeek[]> {
  try {
    const supabasePlan = await fetchUserPlan(userId);
    return supabasePlan?.weeks || [];
  } catch {
    return [];
  }
}
