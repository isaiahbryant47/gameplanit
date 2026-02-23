import { supabase } from '@/integrations/supabase/client';

/**
 * Append-only event emitter for student actions.
 * Events are recorded to `student_events` for downstream processing.
 * All calls are fire-and-forget to avoid blocking UI interactions.
 */

type StudentEventType =
  | 'action_completed'
  | 'action_uncompleted'
  | 'goal_completed'
  | 'resource_engaged'
  | 'opportunity_accepted'
  | 'cycle_started'
  | 'reflection_submitted'
  | 'profile_updated'
  | 'plan_adapted';

interface EventPayload {
  [key: string]: unknown;
}

async function emit(userId: string, eventType: StudentEventType, payload: EventPayload = {}) {
  const { error } = await supabase.from('student_events').insert({
    user_id: userId,
    event_type: eventType as any,
    payload: payload as any,
  });
  if (error) {
    console.error(`activityService.emit(${eventType}) error:`, error);
  }
}

// ── Convenience helpers ──

export function emitActionCompleted(userId: string, planId: string, weekId: string, actionIndex: number, actionName?: string) {
  return emit(userId, 'action_completed', { planId, weekId, actionIndex, actionName });
}

export function emitActionUncompleted(userId: string, planId: string, weekId: string, actionIndex: number) {
  return emit(userId, 'action_uncompleted', { planId, weekId, actionIndex });
}

export function emitGoalCompleted(userId: string, goalName: string) {
  return emit(userId, 'goal_completed', { goalName });
}

export function emitResourceEngaged(userId: string, resourceTitle: string, resourceUrl?: string) {
  return emit(userId, 'resource_engaged', { resourceTitle, resourceUrl });
}

export function emitOpportunityAccepted(userId: string, opportunityId: string, opportunityTitle?: string) {
  return emit(userId, 'opportunity_accepted', { opportunityId, opportunityTitle });
}

export function emitCycleStarted(userId: string, planId: string, cycleNumber: number) {
  return emit(userId, 'cycle_started', { planId, cycleNumber });
}

export function emitReflectionSubmitted(userId: string, planId: string, weekNumber: number) {
  return emit(userId, 'reflection_submitted', { planId, weekNumber });
}

export function emitProfileUpdated(userId: string, fields?: string[]) {
  return emit(userId, 'profile_updated', { fields });
}

export function emitPlanAdapted(userId: string, planId: string, weekNumber: number, reason?: string) {
  return emit(userId, 'plan_adapted', { planId, weekNumber, reason });
}
