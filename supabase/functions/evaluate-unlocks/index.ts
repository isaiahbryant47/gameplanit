import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Standalone unlock evaluator — can be called independently
 * or chained after recompute-readiness.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    const { userId, careerPathId, cycleNumber, milestoneCompletionRate, engagedPillars } = body;

    // Validate
    if (!userId || typeof userId !== "string" || !/^[0-9a-f]{8}-/i.test(userId))
      return new Response(JSON.stringify({ error: "userId required" }), { status: 400, headers: corsHeaders });
    if (!careerPathId || typeof careerPathId !== "string")
      return new Response(JSON.stringify({ error: "careerPathId required" }), { status: 400, headers: corsHeaders });
    if (claimsData.claims.sub !== userId)
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });

    const db = createClient(supabaseUrl, supabaseService);

    // Fetch opportunities
    const { data: opportunities } = await db
      .from("career_opportunities")
      .select("*")
      .eq("career_path_id", careerPathId)
      .eq("is_active", true);

    if (!opportunities || opportunities.length === 0) {
      return new Response(JSON.stringify({ newUnlocks: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const oppIds = opportunities.map((o: any) => o.id);

    const [{ data: rules }, { data: existingUnlocks }] = await Promise.all([
      db.from("career_unlock_rules").select("*").in("opportunity_id", oppIds),
      db.from("user_career_unlocks").select("opportunity_id").eq("user_id", userId),
    ]);

    const alreadyUnlockedIds = new Set((existingUnlocks || []).map((u: any) => u.opportunity_id));
    const newUnlocks: any[] = [];
    const cycle = typeof cycleNumber === "number" ? cycleNumber : 1;
    const rate = typeof milestoneCompletionRate === "number" ? milestoneCompletionRate : 0;
    const pillars = Array.isArray(engagedPillars) ? engagedPillars : [];

    for (const opp of opportunities) {
      if (alreadyUnlockedIds.has(opp.id)) continue;

      const oppRules = (rules || []).filter((r: any) => r.opportunity_id === opp.id);
      if (oppRules.length === 0) continue;

      const allPassed = oppRules.every((rule: any) => {
        if (rule.required_cycle_number && cycle < rule.required_cycle_number) return false;
        if (rate < rule.required_milestone_completion_rate) return false;
        if (rule.required_pillar && !pillars.includes(rule.required_pillar)) return false;
        return true;
      });

      if (allPassed) {
        const { data: unlock, error: unlockErr } = await db
          .from("user_career_unlocks")
          .insert({ user_id: userId, opportunity_id: opp.id })
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

    return new Response(JSON.stringify({ newUnlocks }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("evaluate-unlocks error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
