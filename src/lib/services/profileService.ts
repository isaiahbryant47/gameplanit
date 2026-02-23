import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/lib/types';

/**
 * Load a user's profile from Supabase.
 * Returns undefined if no profile exists.
 */
export async function loadProfile(userId: string): Promise<Profile | undefined> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    console.error('profileService.loadProfile error:', error);
    return undefined;
  }

  return mapRowToProfile(data);
}

/**
 * Check if a profile exists for a user (lightweight, no full load).
 */
export async function profileExists(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

/**
 * Save/update a profile to Supabase via upsert.
 */
export async function saveProfile(profile: Profile): Promise<void> {
  const { error } = await supabase.from('profiles').upsert({
    user_id: profile.userId,
    type: profile.type,
    grade_level: profile.gradeLevel,
    school_name: profile.schoolName || null,
    zip_code: profile.zipCode,
    interests: profile.interests,
    constraints_json: profile.constraints,
    goals: profile.goals,
    baseline_json: profile.baseline,
    career_path_id: profile.careerPathId || null,
    outcome_statement: profile.outcomeStatement || null,
    target_date: profile.targetDate || null,
    domain_baseline: profile.domainBaseline || {},
  }, { onConflict: 'user_id' });

  if (error) {
    console.error('profileService.saveProfile error:', error);
    throw error;
  }
}

function mapRowToProfile(data: any): Profile {
  const constraints = (data.constraints_json as Record<string, unknown>) || {};
  const baseline = (data.baseline_json as Record<string, unknown>) || {};

  return {
    id: data.id,
    userId: data.user_id,
    type: (data.type as 'student' | 'caregiver') || 'student',
    gradeLevel: data.grade_level || '9',
    schoolName: data.school_name || undefined,
    zipCode: data.zip_code || '00000',
    interests: (data.interests as string[]) || [],
    constraints: {
      timePerWeekHours: Number(constraints.timePerWeekHours) || 4,
      budgetPerMonth: Number(constraints.budgetPerMonth) || 0,
      transportation: (constraints.transportation as Profile['constraints']['transportation']) || 'public',
      responsibilities: String(constraints.responsibilities || ''),
    },
    goals: (data.goals as string[]) || [],
    baseline: {
      gpa: baseline.gpa ? Number(baseline.gpa) : undefined,
      attendance: baseline.attendance ? Number(baseline.attendance) : undefined,
    },
    careerPathId: data.career_path_id || undefined,
    careerDomainName: undefined,
    careerPathName: undefined,
    outcomeStatement: data.outcome_statement || undefined,
    targetDate: data.target_date || undefined,
    domainBaseline: (data.domain_baseline as Record<string, string>) || undefined,
  };
}
