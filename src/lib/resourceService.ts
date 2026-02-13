import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Resource = Tables<'resources'>;

interface MatchCriteria {
  interests: string[];
  gradeLevel: string;
  zipCode: string;
  transportation: string;
  budgetPerMonth: number;
}

export async function fetchMatchingResources(criteria: MatchCriteria): Promise<Resource[]> {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('is_active', true);

  if (error || !data) {
    console.error('Error fetching resources:', error);
    return [];
  }

  // Score and rank resources by relevance to student profile
  const scored = data.map(resource => {
    let score = 0;

    // Tag overlap with interests
    const interestMatch = resource.tags.filter(tag =>
      criteria.interests.some(i => i.toLowerCase().includes(tag.toLowerCase()) || tag.toLowerCase().includes(i.toLowerCase()))
    ).length;
    score += interestMatch * 3;

    // Grade level match
    if (resource.grade_levels.length === 0 || resource.grade_levels.includes(criteria.gradeLevel)) {
      score += 2;
    }

    // ZIP prefix match (local relevance)
    if (resource.zip_prefixes.length === 0) {
      score += 1; // Universal resources get a small boost
    } else if (resource.zip_prefixes.some(zp => criteria.zipCode.startsWith(zp))) {
      score += 4; // Local match is very valuable
    }

    // Transportation compatibility
    if (resource.transportation === 'virtual') {
      score += 1; // Always accessible
    } else if (resource.transportation === criteria.transportation) {
      score += 2;
    }

    // Budget compatibility
    if (resource.is_free || resource.cost_dollars <= criteria.budgetPerMonth) {
      score += 1;
    }

    return { resource, score };
  });

  // Sort by score descending, return top results
  return scored
    .sort((a, b) => b.score - a.score)
    .map(s => s.resource);
}

export async function fetchAllResources(): Promise<Resource[]> {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching resources:', error);
    return [];
  }
  return data || [];
}
