import { supabase } from '@/integrations/supabase/client';

/**
 * Simple hash function for anonymizing user IDs before sending to Supabase.
 */
async function hashId(id: string): Promise<string> {
  const data = new TextEncoder().encode(id);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

export interface CheckinData {
  userId: string;
  planId: string;
  weekNumber: number;
  completedActionsCount: number;
  totalActionsCount: number;
  gradeLevel?: string;
  timePerWeekHours?: number;
  transportation?: string;
}

export interface PredictionData {
  userId: string;
  planId: string;
  weekNumber: number;
  adherenceProbability: number;
  riskFlag: boolean;
  topDrivers: string[];
  gradeLevel?: string;
  timePerWeekHours?: number;
  transportation?: string;
}

export async function submitCheckin(data: CheckinData) {
  const userHash = await hashId(data.userId);
  const planHash = await hashId(data.planId);

  const { error } = await supabase.from('weekly_checkins').insert({
    user_hash: userHash,
    plan_hash: planHash,
    week_number: data.weekNumber,
    completed_actions_count: data.completedActionsCount,
    total_actions_count: data.totalActionsCount,
    grade_level: data.gradeLevel,
    time_per_week_hours: data.timePerWeekHours,
    transportation: data.transportation,
  });

  if (error) console.error('Checkin insert error:', error);
  return !error;
}

export async function submitPrediction(data: PredictionData) {
  const userHash = await hashId(data.userId);
  const planHash = await hashId(data.planId);

  const { error } = await supabase.from('prediction_snapshots').insert({
    user_hash: userHash,
    plan_hash: planHash,
    week_number: data.weekNumber,
    adherence_probability: data.adherenceProbability,
    risk_flag: data.riskFlag,
    top_drivers: data.topDrivers,
    grade_level: data.gradeLevel,
    time_per_week_hours: data.timePerWeekHours,
    transportation: data.transportation,
  });

  if (error) console.error('Prediction insert error:', error);
  return !error;
}

export interface DomainAnalytics {
  domain: string;
  label: string;
  planCount: number;
  avgAdherence: number | null;
}

export interface PathwayAnalytics {
  pathwayId: string;
  pathwayTitle: string;
  domain: string;
  planCount: number;
  avgCycle: number;
  avgAdherence: number | null;
}

export interface ReadinessDistribution {
  tier1: number;
  tier2: number;
  tier3: number;
  totalScored: number;
}

export interface AggregatedAnalytics {
  byGrade: { grade: string; avgAdherence: number; count: number; atRiskCount: number }[];
  byHours: { bucket: string; avgAdherence: number; count: number }[];
  byTransport: { transport: string; avgAdherence: number; count: number }[];
  byDomain: DomainAnalytics[];
  byPathway: PathwayAnalytics[];
  overall: { avgAdherence: number; totalUsers: number; atRiskPct: number };
  readinessDistribution?: ReadinessDistribution;
}

/**
 * Fetch pre-computed analytics from the snapshot table.
 * Falls back to empty data if no snapshot exists yet.
 */
export async function fetchAggregatedAnalytics(): Promise<AggregatedAnalytics> {
  const { data, error } = await supabase
    .from('partner_analytics_snapshot')
    .select('snapshot_json, computed_at')
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.snapshot_json) {
    return emptyAnalytics();
  }

  return data.snapshot_json as unknown as AggregatedAnalytics;
}

function emptyAnalytics(): AggregatedAnalytics {
  return {
    byGrade: [], byHours: [], byTransport: [], byDomain: [], byPathway: [],
    overall: { avgAdherence: 0, totalUsers: 0, atRiskPct: 0 },
    readinessDistribution: { tier1: 0, tier2: 0, tier3: 0, totalScored: 0 },
  };
}
