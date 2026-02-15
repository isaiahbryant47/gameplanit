import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Structured JSON schema for the LLM via tool calling ──
const weekActionSchema = {
  type: "object" as const,
  properties: {
    task: { type: "string" as const, description: "A specific, actionable task the student should complete" },
    resource: { type: "string" as const, description: "Name of the resource to use" },
    pillar: { type: "string" as const, description: "Which career readiness pillar this action advances: Academic Readiness, Skill Development, Exposure & Networking, or Proof & Portfolio" },
    access_steps: {
      type: "array" as const,
      items: { type: "string" as const },
      description: "Step-by-step instructions to access the resource",
    },
    use_steps: {
      type: "array" as const,
      items: { type: "string" as const },
      description: "Exactly how the student should use this resource this week, as ordered steps",
    },
    time_estimate_minutes: { type: "number" as const, description: "Estimated time in minutes (e.g. 30)" },
    success_metric: { type: "string" as const, description: "A measurable indicator that this action was completed successfully" },
  },
  required: ["task", "resource", "pillar", "access_steps", "use_steps", "time_estimate_minutes", "success_metric"],
  additionalProperties: false,
};

const weekSchema = {
  type: "object" as const,
  properties: {
    week: { type: "number" as const },
    focus: { type: "string" as const, description: "Theme or focus area for this week" },
    actions: {
      type: "array" as const,
      items: weekActionSchema,
      minItems: 3,
      maxItems: 5,
    },
    milestone: { type: "string" as const, description: "A measurable milestone for the week" },
  },
  required: ["week", "focus", "actions", "milestone"],
  additionalProperties: false,
};

const planToolSchema = {
  type: "function" as const,
  function: {
    name: "create_plan",
    description: "Create a structured 12-week action plan for a student.",
    parameters: {
      type: "object" as const,
      properties: {
        weeks: {
          type: "array" as const,
          items: weekSchema,
          minItems: 12,
          maxItems: 12,
        },
      },
      required: ["weeks"],
      additionalProperties: false,
    },
  },
};

// ── Prompt builder ──
interface ProfileInput {
  gradeLevel: string;
  interests: string[];
  goals: string[];
  zipCode: string;
  constraints: {
    timePerWeekHours: number;
    budgetPerMonth: number;
    transportation: string;
    responsibilities: string;
  };
  baseline?: { gpa?: number; attendance?: number };
  // Career-first fields
  careerPathId?: string;
  careerDomainName?: string;
  careerPathName?: string;
  primaryPillarFocus?: string[];
  // Legacy fields
  goalDomain?: string;
  pathwayId?: string;
  outcomeStatement?: string;
  targetDate?: string;
  domainBaseline?: Record<string, string>;
  cycleNumber?: number;
  previousCycleSummary?: string;
  stage?: string;
}

function buildSystemPrompt(profile: ProfileInput): string {
  const budget =
    profile.constraints.budgetPerMonth === 0
      ? "zero budget — only free resources"
      : profile.constraints.budgetPerMonth <= 25
        ? "very low budget (under $25/mo) — prioritize free resources"
        : `up to $${profile.constraints.budgetPerMonth}/mo`;

  const responsibilities = profile.constraints.responsibilities || "none reported";

  const careerPathName = profile.careerPathName || "General Exploration";
  const careerDomainName = profile.careerDomainName || "General";

  const pillarFocus = profile.primaryPillarFocus && profile.primaryPillarFocus.length > 0
    ? profile.primaryPillarFocus.join(", ")
    : "Academic Readiness, Exposure & Networking";

  const stageLabel = profile.stage
    ? { foundation: "Foundation (build basics)", proof: "Proof (demonstrate ability)", leverage: "Leverage (advance toward outcome)" }[profile.stage] || profile.stage
    : "Foundation (build basics)";

  const domainBaselineLines = profile.domainBaseline
    ? Object.entries(profile.domainBaseline).map(([k, v]) => `- ${k}: ${v}`).join("\n")
    : "";

  return `You are the planning engine inside GameplanIT, a Career-First Pathway Engine for middle and high school students (grades 7–12).

CAREER DOMAIN: ${careerDomainName}
CAREER PATH: ${careerPathName}
STAGE: ${stageLabel}
PRIMARY PILLARS THIS CYCLE: ${pillarFocus}

CAREER READINESS PILLARS (every action must map to one):
1. Academic Readiness — grades, coursework, test prep aligned to this career
2. Skill Development — hands-on skills, tools, certifications relevant to this career
3. Exposure & Networking — job shadowing, mentors, industry events, informational interviews
4. Proof & Portfolio — projects, portfolios, certifications that prove readiness

${profile.outcomeStatement ? `OUTCOME GOAL: ${profile.outcomeStatement}` : ""}
${profile.targetDate ? `TARGET TIMEFRAME: ${profile.targetDate}` : ""}

STUDENT PROFILE:
- Grade: ${profile.gradeLevel}
- Interests: ${profile.interests.join(", ") || "general academics"}
- Goals: ${profile.goals.join("; ")}
- ZIP code area: ${profile.zipCode}
- Available time: ${profile.constraints.timePerWeekHours} hours per week
- Budget: ${budget}
- Transportation: ${profile.constraints.transportation}
- Outside responsibilities: ${responsibilities}
${profile.baseline?.gpa ? `- Current GPA: ${profile.baseline.gpa}` : ""}
${profile.baseline?.attendance ? `- Attendance rate: ${profile.baseline.attendance}%` : ""}
${domainBaselineLines ? `\nBASELINE INFO:\n${domainBaselineLines}` : ""}

REQUIREMENTS:
1. Generate exactly 12 weeks.
2. Each week MUST have 3–5 actionable steps.
3. Every action MUST map to one of the 4 career readiness pillars via the "pillar" field.
4. Each week should clearly advance at least 1 pillar, with emphasis on the PRIMARY PILLARS this cycle.
5. Every action must include a SPECIFIC, REAL resource (website, app, program, or local service).
6. For each resource, provide:
   - The resource name
   - pillar: which career readiness pillar this action advances
   - access_steps: an ARRAY of step-by-step strings on how to access it
   - use_steps: an ARRAY of step-by-step strings on how to use it THIS week
   - time_estimate_minutes: a NUMBER of minutes (e.g. 30)
   - success_metric: a measurable indicator the student completed the action
7. Every week must have a measurable milestone (not vague).
8. Prioritize free or low-cost resources.
9. Keep all language at a grade 7–10 reading level.
10. Build progressive difficulty — early weeks are lighter.
11. Account for the student's transportation and time constraints.
12. Do NOT use generic filler. Every action must be concrete and doable.
13. ${profile.outcomeStatement ? `All weeks must advance toward the student's outcome goal: "${profile.outcomeStatement}".` : "Weeks should build career readiness across all pillars."}
14. If the student has limited time, keep weekly actions to 3 items max.
15. Do NOT invent hyper-local organizations. Keep resources general unless verified.
16. All actions should be relevant to the career path: ${careerPathName}. The student is exploring or preparing for this career.
${(profile.cycleNumber || 1) > 1 ? `
CYCLE CONTEXT:
This is Cycle ${profile.cycleNumber}. Build on what was accomplished in previous cycles — increase difficulty, introduce new resources, and push toward more advanced milestones.
${profile.previousCycleSummary ? `\nPREVIOUS CYCLE SUMMARY:\n${profile.previousCycleSummary}` : ""}
Do NOT repeat actions from earlier cycles. Advance the student further toward their outcome goal.` : ""}`;
}

// ── Call LLM ──
async function callLLM(profile: ProfileInput): Promise<unknown> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const systemPrompt = buildSystemPrompt(profile);

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-5-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Create a personalized 12-week career readiness plan for this student pursuing ${profile.careerPathName || "career exploration"}. Each action must include a "pillar" field mapping to one of the 4 readiness pillars. Use the create_plan tool.`,
        },
      ],
      tools: [planToolSchema],
      tool_choice: { type: "function", function: { name: "create_plan" } },
    }),
  });

  if (!response.ok) {
    const status = response.status;
    const text = await response.text();
    if (status === 429) throw new Error("RATE_LIMITED");
    if (status === 402) throw new Error("PAYMENT_REQUIRED");
    console.error("LLM error:", status, text);
    throw new Error(`LLM returned ${status}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) {
    throw new Error("NO_TOOL_CALL");
  }

  return JSON.parse(toolCall.function.arguments);
}

// ── Validate structure ──
interface WeekAction {
  task: string;
  resource: string;
  pillar: string;
  access_steps: string[];
  use_steps: string[];
  time_estimate_minutes: number;
  success_metric: string;
}

interface Week {
  week: number;
  focus: string;
  actions: WeekAction[];
  milestone: string;
}

function validatePlan(raw: unknown): Week[] {
  const obj = raw as { weeks?: unknown[] };
  if (!obj?.weeks || !Array.isArray(obj.weeks) || obj.weeks.length !== 12) {
    throw new Error("INVALID_PLAN: Must have exactly 12 weeks");
  }

  const validPillars = ["Academic Readiness", "Skill Development", "Exposure & Networking", "Proof & Portfolio"];

  return obj.weeks.map((w: unknown, i: number) => {
    const week = w as Record<string, unknown>;
    if (!week.focus || typeof week.focus !== "string") throw new Error(`INVALID_PLAN: Week ${i + 1} missing focus`);
    if (!week.milestone || typeof week.milestone !== "string") throw new Error(`INVALID_PLAN: Week ${i + 1} missing milestone`);
    if (!Array.isArray(week.actions) || week.actions.length < 3) throw new Error(`INVALID_PLAN: Week ${i + 1} needs 3+ actions`);

    const actions = (week.actions as Record<string, unknown>[]).map((a, j) => {
      if (!a.task || !a.resource) {
        throw new Error(`INVALID_PLAN: Week ${i + 1}, action ${j + 1} missing task or resource`);
      }

      // Normalize pillar
      let pillar = typeof a.pillar === "string" ? a.pillar : "Skill Development";
      // Fuzzy match
      if (!validPillars.includes(pillar)) {
        const lower = pillar.toLowerCase();
        pillar = validPillars.find(p => lower.includes(p.toLowerCase().split(" ")[0])) || "Skill Development";
      }

      let accessSteps: string[] = [];
      if (Array.isArray(a.access_steps)) accessSteps = a.access_steps.map(String);
      else if (typeof a.access_steps === "string") accessSteps = [a.access_steps];
      else if (typeof a.access === "string") accessSteps = [a.access as string];

      let useSteps: string[] = [];
      if (Array.isArray(a.use_steps)) useSteps = a.use_steps.map(String);
      else if (typeof a.use_steps === "string") useSteps = [a.use_steps];
      else if (typeof a.how_to_use === "string") useSteps = [a.how_to_use as string];

      const timeMinutes = typeof a.time_estimate_minutes === "number"
        ? a.time_estimate_minutes
        : typeof a.time_estimate === "string"
          ? parseInt(a.time_estimate as string, 10) || 30
          : 30;

      const successMetric = typeof a.success_metric === "string"
        ? a.success_metric
        : "Complete the task as described";

      return {
        task: String(a.task),
        resource: String(a.resource),
        pillar,
        access_steps: accessSteps.length > 0 ? accessSteps : ["Visit the resource website"],
        use_steps: useSteps.length > 0 ? useSteps : ["Follow the instructions provided"],
        time_estimate_minutes: timeMinutes,
        success_metric: successMetric,
      };
    });

    return {
      week: i + 1,
      focus: String(week.focus),
      actions,
      milestone: String(week.milestone),
    };
  });
}

// ── Save to DB ──
async function savePlan(userId: string, title: string, weeks: Week[], profile: ProfileInput) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: plan, error: planErr } = await supabase
    .from("plans")
    .insert({
      user_id: userId,
      title,
      profile_snapshot: profile,
      career_path_id: profile.careerPathId || null,
      primary_pillar_focus: profile.primaryPillarFocus || ["Academic Readiness", "Exposure & Networking"],
      cycle_number: profile.cycleNumber || 1,
      outcome_statement: profile.outcomeStatement || null,
      target_date: profile.targetDate || null,
      goal_domain: profile.goalDomain || null,
      stage: profile.stage || "foundation",
      // Legacy compat
      pathway_id: profile.pathwayId || null,
    })
    .select("id")
    .single();

  if (planErr || !plan) throw new Error(`DB_ERROR: ${planErr?.message}`);

  const weekRows = weeks.map((w) => ({
    plan_id: plan.id,
    week_number: w.week,
    focus: w.focus,
    milestone: w.milestone,
    actions: w.actions,
  }));

  const { error: weekErr } = await supabase.from("plan_weeks").insert(weekRows);
  if (weekErr) throw new Error(`DB_ERROR: ${weekErr.message}`);

  return plan.id;
}

// ── Main handler ──
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { profile, userId } = await req.json();

    if (!profile || !userId) {
      return new Response(JSON.stringify({ error: "Missing profile or userId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call LLM with retry
    let plan: unknown;
    try {
      plan = await callLLM(profile);
    } catch (e) {
      if (e instanceof Error && e.message === "NO_TOOL_CALL") {
        console.log("Retrying LLM call...");
        plan = await callLLM(profile);
      } else {
        throw e;
      }
    }

    // Validate
    const weeks = validatePlan(plan);

    // Save to DB
    const careerName = profile.careerPathName || profile.goals?.join(" & ") || "Career Growth";
    const title = `12-Week Plan: ${careerName}`;
    const planId = await savePlan(userId, title, weeks, profile);

    return new Response(
      JSON.stringify({ planId, weeks }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("generate-plan error:", msg);

    if (msg === "RATE_LIMITED") {
      return new Response(JSON.stringify({ error: "AI is busy — please try again in a moment." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (msg === "PAYMENT_REQUIRED") {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
