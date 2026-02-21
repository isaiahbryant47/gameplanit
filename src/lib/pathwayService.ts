import { supabase } from "@/integrations/supabase/client";
import type { Pathway, Opportunity, GoalDomain } from "./types";

type UnlockRule = { type: string; min_rate?: number; min_cycle?: number };

function isUnlockRule(value: unknown): value is UnlockRule {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;

  if (typeof candidate.type !== "string") return false;
  if (candidate.min_rate !== undefined && typeof candidate.min_rate !== "number") return false;
  if (candidate.min_cycle !== undefined && typeof candidate.min_cycle !== "number") return false;
  return true;
}

export async function fetchPathways(): Promise<Pathway[]> {
  const { data, error } = await supabase
    .from("pathways")
    .select("*")
    .eq("is_active", true)
    .order("domain");

  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id,
    domain: r.domain as GoalDomain,
    title: r.title,
    description: r.description,
    default_milestones: r.default_milestones as string[],
    tags: r.tags,
    is_active: r.is_active,
  }));
}

export async function fetchOpportunitiesForPathway(pathwayId: string): Promise<
  { opportunity: Opportunity; unlockRule: UnlockRule }[]
> {
  const { data, error } = await supabase
    .from("pathway_opportunities")
    .select("unlock_rule_json, opportunities(*)")
    .eq("pathway_id", pathwayId);

  if (error || !data) return [];
  return data.flatMap((r) => {
    if (!r.opportunities || !isUnlockRule(r.unlock_rule_json)) return [];

    return [{
    opportunity: {
      id: r.opportunities.id,
      domain: r.opportunities.domain as GoalDomain,
      title: r.opportunities.title,
      description: r.opportunities.description,
      requirements_json: r.opportunities.requirements_json,
      next_step_cta_label: r.opportunities.next_step_cta_label,
      next_step_url: r.opportunities.next_step_url,
    },
    unlockRule: r.unlock_rule_json,
  }];
  });
}

export async function createUserPathway(userId: string, pathwayId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("user_pathways")
    .insert({ user_id: userId, pathway_id: pathwayId })
    .select("id")
    .single();

  if (error || !data) return null;
  return data.id;
}

export function checkOpportunityUnlock(
  rule: UnlockRule,
  completionRate: number,
  currentCycle: number
): boolean {
  if (rule.type === "cycle_complete") {
    return currentCycle >= (rule.min_cycle || 1);
  }
  if (rule.type === "milestone_rate") {
    return completionRate >= (rule.min_rate || 0.5);
  }
  return false;
}
