import { supabase } from '@/integrations/supabase/client';

export interface ProgressData {
  completedActions: Record<string, boolean>;
  resourcesEngaged: string[];
  academicLog: { date: string; gpa?: number; attendance?: number }[];
  completedGoals: Record<string, string>;
}

const emptyProgress: ProgressData = {
  completedActions: {},
  resourcesEngaged: [],
  academicLog: [],
  completedGoals: {},
};

/**
 * Load progress for a user+plan from Supabase.
 * Falls back to localStorage for migration, and syncs up if found.
 */
export async function loadProgress(userId: string, planId?: string): Promise<ProgressData> {
  if (!planId) return { ...emptyProgress };

  // Try Supabase first
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('plan_id', planId)
    .maybeSingle();

  if (!error && data) {
    return {
      completedActions: (data.completed_actions as Record<string, boolean>) || {},
      resourcesEngaged: (data.resources_engaged as string[]) || [],
      academicLog: (data.academic_log as ProgressData['academicLog']) || [],
      completedGoals: (data.completed_goals as Record<string, string>) || {},
    };
  }

  // Fallback: migrate from localStorage if exists
  const localKey = `gp_progress_${userId}`;
  const raw = localStorage.getItem(localKey);
  if (raw) {
    try {
      const local: ProgressData = JSON.parse(raw);
      if (!local.completedGoals) local.completedGoals = {};
      // Persist to Supabase (fire-and-forget migration)
      saveProgress(userId, planId, local).catch(() => {});
      return local;
    } catch { /* fall through */ }
  }

  return { ...emptyProgress };
}

/**
 * Save progress to Supabase (upsert by user_id + plan_id).
 */
export async function saveProgress(userId: string, planId: string, progress: ProgressData): Promise<void> {
  const { error } = await supabase
    .from('user_progress')
    .upsert(
      {
        user_id: userId,
        plan_id: planId,
        completed_actions: progress.completedActions as any,
        resources_engaged: progress.resourcesEngaged,
        academic_log: progress.academicLog as any,
        completed_goals: progress.completedGoals as any,
      },
      { onConflict: 'user_id,plan_id' }
    );

  if (error) {
    console.error('progressService.saveProgress error:', error);
  }
}

/**
 * Reset progress for a new cycle.
 */
export async function resetProgress(userId: string, planId: string, keepMeta?: Partial<ProgressData>): Promise<ProgressData> {
  const fresh: ProgressData = {
    completedActions: {},
    resourcesEngaged: keepMeta?.resourcesEngaged || [],
    academicLog: keepMeta?.academicLog || [],
    completedGoals: {},
  };
  await saveProgress(userId, planId, fresh);
  return fresh;
}
