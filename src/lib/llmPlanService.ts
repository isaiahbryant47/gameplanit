import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "./types";

export interface StructuredAction {
  task: string;
  resource: string;
  access_steps: string[];
  use_steps: string[];
  time_estimate_minutes: number;
  success_metric: string;
  // Legacy compat
  access?: string;
  how_to_use?: string;
  time_estimate?: string;
}

export interface StructuredWeek {
  week: number;
  focus: string;
  actions: StructuredAction[];
  milestone: string;
}

export interface GeneratedPlan {
  planId: string;
  weeks: StructuredWeek[];
}

/** Normalize an action from DB (could be old or new format) */
function normalizeAction(a: Record<string, unknown>): StructuredAction {
  return {
    task: String(a.task || ""),
    resource: String(a.resource || ""),
    access_steps: Array.isArray(a.access_steps) ? a.access_steps.map(String) : (typeof a.access === "string" ? [a.access] : []),
    use_steps: Array.isArray(a.use_steps) ? a.use_steps.map(String) : (typeof a.how_to_use === "string" ? [a.how_to_use] : []),
    time_estimate_minutes: typeof a.time_estimate_minutes === "number" ? a.time_estimate_minutes : (typeof a.time_estimate === "string" ? parseInt(a.time_estimate, 10) || 30 : 30),
    success_metric: typeof a.success_metric === "string" ? a.success_metric : "Complete the task as described",
  };
}

export async function generateLLMPlan(
  profile: Profile,
  userId: string,
  options?: { cycleNumber?: number; previousCycleSummary?: string; stage?: string }
): Promise<GeneratedPlan> {
  const { data, error } = await supabase.functions.invoke("generate-plan", {
    body: {
      userId,
      profile: {
        gradeLevel: profile.gradeLevel,
        interests: profile.interests,
        goals: profile.goals,
        zipCode: profile.zipCode,
        constraints: profile.constraints,
        baseline: profile.baseline,
        goalDomain: profile.goalDomain,
        pathwayId: profile.pathwayId,
        outcomeStatement: profile.outcomeStatement,
        targetDate: profile.targetDate,
        domainBaseline: profile.domainBaseline,
        cycleNumber: options?.cycleNumber,
        previousCycleSummary: options?.previousCycleSummary,
        stage: options?.stage || "foundation",
      },
    },
  });

  if (error) {
    throw new Error(error.message || "Failed to generate plan");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  // Normalize actions in response
  const result = data as GeneratedPlan;
  if (result.weeks) {
    result.weeks = result.weeks.map(w => ({
      ...w,
      actions: w.actions.map(a => normalizeAction(a as unknown as Record<string, unknown>)),
    }));
  }

  return result;
}

export async function fetchPlanFromDB(planId: string): Promise<StructuredWeek[]> {
  const { data, error } = await supabase
    .from("plan_weeks")
    .select("*")
    .eq("plan_id", planId)
    .order("week_number", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    week: row.week_number,
    focus: row.focus,
    actions: ((row.actions as unknown as Record<string, unknown>[]) || []).map(normalizeAction),
    milestone: row.milestone,
  }));
}

export async function fetchUserPlan(userId: string): Promise<{ planId: string; title: string; createdAt: string; stage: string; weeks: StructuredWeek[] } | null> {
  const { data: plans, error } = await supabase
    .from("plans")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !plans || plans.length === 0) return null;

  const plan = plans[0];
  const weeks = await fetchPlanFromDB(plan.id);

  return {
    planId: plan.id,
    title: plan.title,
    createdAt: plan.created_at,
    stage: (plan as Record<string, unknown>).stage as string || "foundation",
    weeks,
  };
}
