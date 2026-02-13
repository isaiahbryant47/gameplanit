import { supabase } from '@/integrations/supabase/client';

/**
 * Simple hash function for anonymizing user IDs before sending to Supabase.
 * Uses Web Crypto API for SHA-256.
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

export interface AggregatedAnalytics {
  byGrade: { grade: string; avgAdherence: number; count: number; atRiskCount: number }[];
  byHours: { bucket: string; avgAdherence: number; count: number }[];
  byTransport: { transport: string; avgAdherence: number; count: number }[];
  byDomain: DomainAnalytics[];
  byPathway: PathwayAnalytics[];
  overall: { avgAdherence: number; totalUsers: number; atRiskPct: number };
}

const MIN_BUCKET_SIZE = 5;

export async function fetchAggregatedAnalytics(): Promise<AggregatedAnalytics> {
  // Fetch latest prediction per user_hash
  const [{ data: predictions }, { data: plans }, { data: pathways }] = await Promise.all([
    supabase.from('prediction_snapshots').select('*').order('created_at', { ascending: false }),
    supabase.from('plans').select('id, user_id, goal_domain, pathway_id, cycle_number'),
    supabase.from('pathways').select('id, title, domain'),
  ]);

  const domainLabels: Record<string, string> = { college: 'College', career: 'Career', health_fitness: 'Health & Fitness' };

  // --- Domain & Pathway analytics from plans ---
  const domainMap = new Map<string, { count: number }>();
  const pathwayMap = new Map<string, { title: string; domain: string; count: number; cycleSum: number }>();
  const pathwayLookup = new Map<string, { title: string; domain: string }>();
  (pathways || []).forEach(p => pathwayLookup.set(p.id, { title: p.title, domain: p.domain }));

  (plans || []).forEach(p => {
    const d = p.goal_domain || 'unspecified';
    const entry = domainMap.get(d) || { count: 0 };
    entry.count++;
    domainMap.set(d, entry);

    if (p.pathway_id) {
      const pw = pathwayMap.get(p.pathway_id) || { title: pathwayLookup.get(p.pathway_id)?.title || 'Unknown', domain: pathwayLookup.get(p.pathway_id)?.domain || d, count: 0, cycleSum: 0 };
      pw.count++;
      pw.cycleSum += p.cycle_number || 1;
      pathwayMap.set(p.pathway_id, pw);
    }
  });

  const byDomain: DomainAnalytics[] = Array.from(domainMap.entries())
    .filter(([, v]) => v.count >= MIN_BUCKET_SIZE)
    .map(([domain, v]) => ({ domain, label: domainLabels[domain] || domain, planCount: v.count, avgAdherence: null }));

  const byPathway: PathwayAnalytics[] = Array.from(pathwayMap.entries())
    .filter(([, v]) => v.count >= MIN_BUCKET_SIZE)
    .map(([pathwayId, v]) => ({ pathwayId, pathwayTitle: v.title, domain: v.domain, planCount: v.count, avgCycle: v.cycleSum / v.count, avgAdherence: null }));

  if (!predictions || predictions.length === 0) {
    return { byGrade: [], byHours: [], byTransport: [], byDomain, byPathway, overall: { avgAdherence: 0, totalUsers: 0, atRiskPct: 0 } };
  }

  // Deduplicate: latest per user_hash
  const latest = new Map<string, typeof predictions[0]>();
  predictions.forEach(p => {
    if (!latest.has(p.user_hash)) latest.set(p.user_hash, p);
  });
  const rows = Array.from(latest.values());

  // Overall
  const totalUsers = rows.length;
  const avgAdherence = rows.reduce((s, r) => s + Number(r.adherence_probability), 0) / totalUsers;
  const atRiskCount = rows.filter(r => r.risk_flag).length;

  // By grade
  const gradeMap = new Map<string, { sum: number; count: number; risk: number }>();
  rows.forEach(r => {
    const g = r.grade_level || 'Unknown';
    const entry = gradeMap.get(g) || { sum: 0, count: 0, risk: 0 };
    entry.sum += Number(r.adherence_probability);
    entry.count++;
    if (r.risk_flag) entry.risk++;
    gradeMap.set(g, entry);
  });

  // By hours bucket
  const hoursBuckets: Record<string, { sum: number; count: number }> = {};
  rows.forEach(r => {
    const h = Number(r.time_per_week_hours) || 0;
    const bucket = h <= 2 ? '1–2h' : h <= 4 ? '3–4h' : h <= 6 ? '5–6h' : '7h+';
    if (!hoursBuckets[bucket]) hoursBuckets[bucket] = { sum: 0, count: 0 };
    hoursBuckets[bucket].sum += Number(r.adherence_probability);
    hoursBuckets[bucket].count++;
  });

  // By transport
  const transportMap = new Map<string, { sum: number; count: number }>();
  rows.forEach(r => {
    const t = r.transportation || 'Unknown';
    const entry = transportMap.get(t) || { sum: 0, count: 0 };
    entry.sum += Number(r.adherence_probability);
    entry.count++;
    transportMap.set(t, entry);
  });

  // Suppress small buckets
  const suppress = <T extends { count: number }>(items: (T & { grade?: string; bucket?: string; transport?: string })[], nameKey: string): T[] => {
    const big: T[] = [];
    let otherSum = 0;
    let otherCount = 0;
    let otherRisk = 0;
    items.forEach(item => {
      if (item.count >= MIN_BUCKET_SIZE) {
        big.push(item);
      } else {
        otherSum += (item as any).avgAdherence * item.count;
        otherCount += item.count;
        otherRisk += (item as any).atRiskCount || 0;
      }
    });
    if (otherCount >= MIN_BUCKET_SIZE) {
      big.push({ [nameKey]: 'Other', avgAdherence: otherSum / otherCount, count: otherCount, atRiskCount: otherRisk } as any);
    }
    return big;
  };

  const byGrade = suppress(
    Array.from(gradeMap.entries()).map(([grade, v]) => ({
      grade, avgAdherence: v.sum / v.count, count: v.count, atRiskCount: v.risk,
    })),
    'grade'
  );

  const byHours = suppress(
    Object.entries(hoursBuckets).map(([bucket, v]) => ({
      bucket, avgAdherence: v.sum / v.count, count: v.count,
    })),
    'bucket'
  );

  const byTransport = suppress(
    Array.from(transportMap.entries()).map(([transport, v]) => ({
      transport, avgAdherence: v.sum / v.count, count: v.count,
    })),
    'transport'
  );

  return {
    byGrade,
    byHours,
    byTransport,
    byDomain,
    byPathway,
    overall: { avgAdherence, totalUsers, atRiskPct: totalUsers > 0 ? (atRiskCount / totalUsers) * 100 : 0 },
  };
}
