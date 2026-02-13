import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "./types";

export interface StructuredAction {
  task: string;
  resource: string;
  access: string;
  how_to_use: string;
  time_estimate: string;
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

export async function generateLLMPlan(
  profile: Profile,
  userId: string
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
        // Pathway fields
        goalDomain: profile.goalDomain,
        pathwayId: profile.pathwayId,
        outcomeStatement: profile.outcomeStatement,
        targetDate: profile.targetDate,
        domainBaseline: profile.domainBaseline,
      },
    },
  });

  if (error) {
    throw new Error(error.message || "Failed to generate plan");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as GeneratedPlan;
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
    actions: (row.actions as unknown as StructuredAction[]) || [],
    milestone: row.milestone,
  }));
}

export async function fetchUserPlan(userId: string): Promise<{ planId: string; title: string; createdAt: string; weeks: StructuredWeek[] } | null> {
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
    weeks,
  };
}
