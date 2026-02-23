import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Scoring Formula ──
function calculatePillarScore(
  milestoneRate: number,
  cycleNumber: number,
  hasAcceptedOpportunity: boolean,
): { score: number; milestone: number; cycle: number; opportunity: number } {
  const maxCycles = 3;
  const cycleRate = Math.min(cycleNumber / maxCycles, 1) * 100;
  const opportunityScore = hasAcceptedOpportunity ? 100 : 0;

  const milestone = milestoneRate * 0.5;
  const cycle = cycleRate * 0.3;
  const opportunity = opportunityScore * 0.2;

  const score = Math.round(Math.min(milestone + cycle + opportunity, 100));
  return { score, milestone: Math.round(milestone), cycle: Math.round(cycle), opportunity: Math.round(opportunity) };
}

function calculateOverallScore(pillarScores: { score: number; weight: number }[]): number {
  if (pillarScores.length === 0) return 0;
  const total = pillarScores.reduce((sum, p) => sum + p.score * p.weight, 0);
  return Math.round(Math.min(total, 100));
}

function getDifficultyTier(score: number): number {
  if (score >= 67) return 3;
  if (score >= 34) return 2;
  return 1;
}

function describePillar(name: string, score: number): string {
  if (score >= 80) return `Excellent ${name} — you're well-prepared in this area.`;
  if (score >= 60) return `Strong ${name} — keep building on this momentum.`;
  if (score >= 40) return `Growing ${name} — continue engaging with activities here.`;
  if (score >= 20) return `Emerging ${name} — focus more actions in this area.`;
  return `Just starting ${name} — look for activities to boost this pillar.`;
}

// ── Input validation ──
function validateInput(body: unknown): { valid: true; data: ScoringInput } | { valid: false; error: string } {
  if (!body || typeof body !== "object") return { valid: false, error: "Body must be a JSON object" };
  const b = body as Record<string, unknown>;

  if (!b.userId || typeof b.userId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(b.userId))
    return { valid: false, error: "userId must be a valid UUID" };
  if (!b.careerPathId || typeof b.careerPathId !== "string" || !/^[0-9a-f]{8}-/i.test(b.careerPathId as string))
    return { valid: false, error: "careerPathId must be a valid UUID" };
  if (typeof b.cycleNumber !== "number" || b.cycleNumber < 1 || b.cycleNumber > 100)
    return { valid: false, error: "cycleNumber must be 1-100" };
  if (typeof b.overallMilestoneRate !== "number" || b.overallMilestoneRate < 0 || b.overallMilestoneRate > 100)
    return { valid: false, error: "overallMilestoneRate must be 0-100" };
  if (b.pillarMilestoneRates && typeof b.pillarMilestoneRates !== "object")
    return { valid: false, error: "pillarMilestoneRates must be an object" };
  if (b.acceptedOpportunityPillars && !Array.isArray(b.acceptedOpportunityPillars))
    return { valid: false, error: "acceptedOpportunityPillars must be an array" };
  if (b.engagedPillars && !Array.isArray(b.engagedPillars))
    return { valid: false, error: "engagedPillars must be an array" };

  return {
    valid: true,
    data: {
      userId: b.userId as string,
      careerPathId: b.careerPathId as string,
      cycleNumber: b.cycleNumber as number,
      overallMilestoneRate: b.overallMilestoneRate as number,
      pillarMilestoneRates: (b.pillarMilestoneRates as Record<string, number>) || {},
      acceptedOpportunityPillars: (b.acceptedOpportunityPillars as string[]) || [],
      engagedPillars: (b.engagedPillars as string[]) || [],
    },
  };
}

interface ScoringInput {
  userId: string;
  careerPathId: string;
  cycleNumber: number;
  overallMilestoneRate: number;
  pillarMilestoneRates: Record<string, number>;
  acceptedOpportunityPillars: string[];
  engagedPillars: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const validation = validateInput(body);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), { status: 400, headers: corsHeaders });
    }

    const ctx = validation.data;

    // Verify ownership
    if (claimsData.claims.sub !== ctx.userId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    // Use service role for DB writes
    const db = createClient(supabaseUrl, supabaseService);

    // 1. Fetch pillar definitions
    const { data: pillarsRaw } = await db
      .from("career_pillars")
      .select("*")
      .eq("career_path_id", ctx.careerPathId);

    const pillars = (pillarsRaw || []).map((r: any) => ({
      id: r.id as string,
      name: r.name as string,
      weight: Number(r.weight),
    }));

    if (pillars.length === 0) {
      return new Response(JSON.stringify({
        overallScore: 0, previousScore: 0, trend: "stable",
        strongestPillar: null, weakestPillar: null, pillars: [],
        nextCycleRecommendation: "General Exploration",
        nextCycleReason: "Start your first cycle to begin building career readiness.",
        difficultyTier: 1, newUnlocks: [],
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Normalize weights
    const weightSum = pillars.reduce((s: number, p: any) => s + p.weight, 0);
    const normalizedPillars = pillars.map((p: any) => ({
      ...p,
      weight: weightSum > 0 ? p.weight / weightSum : 1 / pillars.length,
    }));

    // 2. Fetch existing pillar progress
    const { data: progressRaw } = await db
      .from("user_pillar_progress")
      .select("*")
      .eq("user_id", ctx.userId)
      .in("career_pillar_id", pillars.map((p: any) => p.id));

    const existingProgress: Record<string, any> = {};
    (progressRaw || []).forEach((r: any) => { existingProgress[r.career_pillar_id] = r; });

    // 3. Calculate each pillar
    const pillarResults: any[] = [];
    for (const pillar of normalizedPillars) {
      const milestoneRate = ctx.pillarMilestoneRates[pillar.name] ?? ctx.overallMilestoneRate;
      const hasOppAccepted = ctx.acceptedOpportunityPillars.includes(pillar.name);
      const calc = calculatePillarScore(milestoneRate, ctx.cycleNumber, hasOppAccepted);
      pillarResults.push({ pillarId: pillar.id, name: pillar.name, weight: pillar.weight, ...calc });
    }

    // 4. Overall score
    const overallScore = calculateOverallScore(pillarResults.map((p: any) => ({ score: p.score, weight: p.weight })));

    // 5. Previous score
    const { data: oldReadiness } = await db
      .from("user_readiness")
      .select("*")
      .eq("user_id", ctx.userId)
      .eq("career_path_id", ctx.careerPathId)
      .maybeSingle();

    const previousScore = oldReadiness ? Number(oldReadiness.overall_score) : 0;

    // 6. Strongest/weakest
    const sorted = [...pillarResults].sort((a: any, b: any) => b.score - a.score);
    const strongestPillar = sorted[0]?.name || null;
    const weakestPillar = sorted[sorted.length - 1]?.name || null;

    // 7. Persist pillar progress
    const now = new Date().toISOString();
    const writePromises: Promise<any>[] = [];

    for (const pr of pillarResults) {
      if (existingProgress[pr.pillarId]) {
        writePromises.push(
          db.from("user_pillar_progress").update({
            progress_score: pr.score,
            milestone_contribution: pr.milestone,
            cycle_contribution: pr.cycle,
            opportunity_contribution: pr.opportunity,
            last_updated: now,
          }).eq("id", existingProgress[pr.pillarId].id)
        );
      } else {
        writePromises.push(
          db.from("user_pillar_progress").insert({
            user_id: ctx.userId,
            career_pillar_id: pr.pillarId,
            progress_score: pr.score,
            milestone_contribution: pr.milestone,
            cycle_contribution: pr.cycle,
            opportunity_contribution: pr.opportunity,
          })
        );
      }
    }

    // 8. Persist overall readiness
    if (oldReadiness) {
      writePromises.push(
        db.from("user_readiness").update({
          overall_score: overallScore,
          previous_score: previousScore,
          strongest_pillar: strongestPillar,
          weakest_pillar: weakestPillar,
          last_updated: now,
        }).eq("id", oldReadiness.id)
      );
    } else {
      writePromises.push(
        db.from("user_readiness").insert({
          user_id: ctx.userId,
          career_path_id: ctx.careerPathId,
          overall_score: overallScore,
          previous_score: previousScore,
          strongest_pillar: strongestPillar,
          weakest_pillar: weakestPillar,
        })
      );
    }

    await Promise.all(writePromises);

    // ── Evaluate Unlocks ──
    const milestoneRateInt = ctx.overallMilestoneRate;

    const { data: opportunities } = await db
      .from("career_opportunities")
      .select("*")
      .eq("career_path_id", ctx.careerPathId)
      .eq("is_active", true);

    const newUnlocks: any[] = [];

    if (opportunities && opportunities.length > 0) {
      const oppIds = opportunities.map((o: any) => o.id);

      const { data: rules } = await db
        .from("career_unlock_rules")
        .select("*")
        .in("opportunity_id", oppIds);

      const { data: existingUnlocks } = await db
        .from("user_career_unlocks")
        .select("opportunity_id")
        .eq("user_id", ctx.userId);

      const alreadyUnlockedIds = new Set((existingUnlocks || []).map((u: any) => u.opportunity_id));

      for (const opp of opportunities) {
        if (alreadyUnlockedIds.has(opp.id)) continue;

        const oppRules = (rules || []).filter((r: any) => r.opportunity_id === opp.id);
        if (oppRules.length === 0) continue;

        const allPassed = oppRules.every((rule: any) => {
          if (rule.required_cycle_number && ctx.cycleNumber < rule.required_cycle_number) return false;
          if (milestoneRateInt < rule.required_milestone_completion_rate) return false;
          if (rule.required_pillar && !ctx.engagedPillars.includes(rule.required_pillar)) return false;
          return true;
        });

        if (allPassed) {
          const { data: unlock, error: unlockErr } = await db
            .from("user_career_unlocks")
            .insert({ user_id: ctx.userId, opportunity_id: opp.id })
            .select("*")
            .single();

          if (!unlockErr && unlock) {
            newUnlocks.push({
              id: unlock.id,
              opportunityId: opp.id,
              title: opp.title,
              type: opp.type,
              description: opp.description,
            });
          }
        }
      }
    }

    // Build response
    const trend = overallScore > previousScore ? "up" : overallScore < previousScore ? "down" : "stable";
    const difficultyTier = getDifficultyTier(overallScore);

    const response = {
      overallScore,
      previousScore,
      trend,
      strongestPillar,
      weakestPillar,
      pillars: pillarResults.map((p: any) => ({
        name: p.name,
        score: p.score,
        weight: p.weight,
        weightedContribution: Math.round(p.score * p.weight),
        breakdown: {
          milestoneContribution: p.milestone,
          cycleContribution: p.cycle,
          opportunityContribution: p.opportunity,
        },
        description: describePillar(p.name, p.score),
      })),
      nextCycleRecommendation: weakestPillar || "General Exploration",
      nextCycleReason: weakestPillar
        ? `${weakestPillar} is currently your lowest readiness score at ${sorted[sorted.length - 1]?.score || 0}%.`
        : "Continue building across all pillars.",
      difficultyTier,
      newUnlocks,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("recompute-readiness error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
