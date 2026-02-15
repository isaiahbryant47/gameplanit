import { supabase } from "@/integrations/supabase/client";
import type { CareerDomain, CareerPath, CareerPillar } from "./types";

export async function fetchCareerDomains(): Promise<CareerDomain[]> {
  const { data, error } = await supabase
    .from("career_domains")
    .select("*")
    .order("name");

  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.id,
    name: r.name,
    description: r.description,
  }));
}

export async function fetchCareerPaths(domainId?: string): Promise<CareerPath[]> {
  let query = supabase
    .from("career_paths")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (domainId) {
    query = query.eq("domain_id", domainId);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.id,
    domainId: r.domain_id,
    name: r.name,
    description: r.description,
    recommendedEducationNotes: r.recommended_education_notes,
    tags: r.tags,
    isActive: r.is_active,
  }));
}

export async function fetchCareerPillars(careerPathId: string): Promise<CareerPillar[]> {
  const { data, error } = await supabase
    .from("career_pillars")
    .select("*")
    .eq("career_path_id", careerPathId)
    .order("name");

  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.id,
    careerPathId: r.career_path_id,
    name: r.name,
    weight: Number(r.weight),
  }));
}
