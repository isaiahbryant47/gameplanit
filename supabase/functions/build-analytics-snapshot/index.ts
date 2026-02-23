import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MIN_BUCKET_SIZE = 5;
const domainLabels: Record<string, string> = { college: "College", career: "Career", health_fitness: "Health & Fitness" };

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(supabaseUrl, serviceKey);

    // Optional: allow auth-gated manual trigger (partner_admin) OR cron (no auth)
    // For cron calls, Authorization header may be the anon key — we skip auth check
    // since the function only writes aggregated/anonymized data.

    // ── Fetch source data ──
    const [{ data: predictions }, { data: plans }, { data: pathways }, { data: readiness }] = await Promise.all([
      db.from("prediction_snapshots").select("*").order("created_at", { ascending: false }).limit(5000),
      db.from("plans").select("id, user_id, goal_domain, pathway_id, cycle_number").limit(5000),
      db.from("pathways").select("id, title, domain").limit(500),
      db.from("user_readiness").select("user_id, career_path_id, overall_score, strongest_pillar, weakest_pillar").limit(5000),
    ]);

    // ── Domain & Pathway aggregation ──
    const domainMap = new Map<string, number>();
    const pathwayMap = new Map<string, { title: string; domain: string; count: number; cycleSum: number }>();
    const pathwayLookup = new Map<string, { title: string; domain: string }>();
    (pathways || []).forEach((p: any) => pathwayLookup.set(p.id, { title: p.title, domain: p.domain }));

    (plans || []).forEach((p: any) => {
      const d = p.goal_domain || "unspecified";
      domainMap.set(d, (domainMap.get(d) || 0) + 1);

      if (p.pathway_id) {
        const pw = pathwayMap.get(p.pathway_id) || {
          title: pathwayLookup.get(p.pathway_id)?.title || "Unknown",
          domain: pathwayLookup.get(p.pathway_id)?.domain || d,
          count: 0, cycleSum: 0,
        };
        pw.count++;
        pw.cycleSum += p.cycle_number || 1;
        pathwayMap.set(p.pathway_id, pw);
      }
    });

    const byDomain = Array.from(domainMap.entries())
      .filter(([, v]) => v >= MIN_BUCKET_SIZE)
      .map(([domain, count]) => ({ domain, label: domainLabels[domain] || domain, planCount: count, avgAdherence: null }));

    const byPathway = Array.from(pathwayMap.entries())
      .filter(([, v]) => v.count >= MIN_BUCKET_SIZE)
      .map(([pathwayId, v]) => ({
        pathwayId, pathwayTitle: v.title, domain: v.domain,
        planCount: v.count, avgCycle: v.cycleSum / v.count, avgAdherence: null,
      }));

    // ── Prediction analytics ──
    let byGrade: any[] = [];
    let byHours: any[] = [];
    let byTransport: any[] = [];
    let overall = { avgAdherence: 0, totalUsers: 0, atRiskPct: 0 };

    if (predictions && predictions.length > 0) {
      // Deduplicate: latest per user_hash
      const latest = new Map<string, any>();
      predictions.forEach((p: any) => { if (!latest.has(p.user_hash)) latest.set(p.user_hash, p); });
      const rows = Array.from(latest.values());

      const totalUsers = rows.length;
      const avgAdherence = rows.reduce((s: number, r: any) => s + Number(r.adherence_probability), 0) / totalUsers;
      const atRiskCount = rows.filter((r: any) => r.risk_flag).length;
      overall = { avgAdherence, totalUsers, atRiskPct: totalUsers > 0 ? (atRiskCount / totalUsers) * 100 : 0 };

      // By grade
      const gradeMap = new Map<string, { sum: number; count: number; risk: number }>();
      rows.forEach((r: any) => {
        const g = r.grade_level || "Unknown";
        const e = gradeMap.get(g) || { sum: 0, count: 0, risk: 0 };
        e.sum += Number(r.adherence_probability); e.count++; if (r.risk_flag) e.risk++;
        gradeMap.set(g, e);
      });
      const gradeItems = Array.from(gradeMap.entries()).map(([grade, v]) => ({
        grade, avgAdherence: v.sum / v.count, count: v.count, atRiskCount: v.risk,
      }));
      // Suppress small buckets
      const bigGrades: typeof gradeItems = [];
      let otherSum = 0, otherCount = 0, otherRisk = 0;
      gradeItems.forEach(item => {
        if (item.count >= MIN_BUCKET_SIZE) bigGrades.push(item);
        else { otherSum += item.avgAdherence * item.count; otherCount += item.count; otherRisk += item.atRiskCount; }
      });
      if (otherCount >= MIN_BUCKET_SIZE) bigGrades.push({ grade: "Other", avgAdherence: otherSum / otherCount, count: otherCount, atRiskCount: otherRisk });
      byGrade = bigGrades;

      // By hours
      const hoursBuckets: Record<string, { sum: number; count: number }> = {};
      rows.forEach((r: any) => {
        const h = Number(r.time_per_week_hours) || 0;
        const bucket = h <= 2 ? "1–2h" : h <= 4 ? "3–4h" : h <= 6 ? "5–6h" : "7h+";
        if (!hoursBuckets[bucket]) hoursBuckets[bucket] = { sum: 0, count: 0 };
        hoursBuckets[bucket].sum += Number(r.adherence_probability);
        hoursBuckets[bucket].count++;
      });
      byHours = Object.entries(hoursBuckets)
        .map(([bucket, v]) => ({ bucket, avgAdherence: v.sum / v.count, count: v.count }))
        .filter(i => i.count >= MIN_BUCKET_SIZE);

      // By transport
      const transportMap = new Map<string, { sum: number; count: number }>();
      rows.forEach((r: any) => {
        const t = r.transportation || "Unknown";
        const e = transportMap.get(t) || { sum: 0, count: 0 };
        e.sum += Number(r.adherence_probability); e.count++;
        transportMap.set(t, e);
      });
      byTransport = Array.from(transportMap.entries())
        .map(([transport, v]) => ({ transport, avgAdherence: v.sum / v.count, count: v.count }))
        .filter(i => i.count >= MIN_BUCKET_SIZE);
    }

    // ── Readiness distribution (new for Phase 4) ──
    const readinessDistribution = { tier1: 0, tier2: 0, tier3: 0, totalScored: 0 };
    (readiness || []).forEach((r: any) => {
      const score = Number(r.overall_score);
      readinessDistribution.totalScored++;
      if (score >= 67) readinessDistribution.tier3++;
      else if (score >= 34) readinessDistribution.tier2++;
      else readinessDistribution.tier1++;
    });

    const snapshot = { byGrade, byHours, byTransport, byDomain, byPathway, overall, readinessDistribution };

    // ── Upsert snapshot (keep only latest) ──
    // Delete old snapshots, insert new one
    await db.from("partner_analytics_snapshot").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    const { error: insertErr } = await db.from("partner_analytics_snapshot").insert({
      snapshot_json: snapshot,
    });

    if (insertErr) {
      console.error("Snapshot insert error:", insertErr);
      return new Response(JSON.stringify({ error: "Failed to save snapshot" }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true, computed_at: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("build-analytics-snapshot error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: corsHeaders });
  }
});
