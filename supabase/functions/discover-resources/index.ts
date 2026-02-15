import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_TRANSPORT = ["walk", "public", "car", "mixed", "virtual"];
const VALID_CATEGORIES = ["online_learning", "local_opportunity", "scholarship", "mentorship", "community_event", "career_program"];

function validateInput(body: unknown): { valid: true; data: Record<string, unknown> } | { valid: false; error: string } {
  if (!body || typeof body !== "object") return { valid: false, error: "Request body must be a JSON object" };
  const b = body as Record<string, unknown>;

  if (!b.gradeLevel || typeof b.gradeLevel !== "string" || b.gradeLevel.length > 10) {
    return { valid: false, error: "gradeLevel is required (string, max 10 chars)" };
  }
  if (!b.zipCode || typeof b.zipCode !== "string" || !/^\d{5}$/.test(b.zipCode)) {
    return { valid: false, error: "zipCode must be a 5-digit string" };
  }
  if (b.interests && (!Array.isArray(b.interests) || b.interests.length > 20 || b.interests.some((i: unknown) => typeof i !== "string" || (i as string).length > 100))) {
    return { valid: false, error: "interests must be an array of up to 20 strings (max 100 chars each)" };
  }
  if (b.goals && (!Array.isArray(b.goals) || b.goals.length > 10 || b.goals.some((g: unknown) => typeof g !== "string" || (g as string).length > 200))) {
    return { valid: false, error: "goals must be an array of up to 10 strings (max 200 chars each)" };
  }
  if (b.transportation && (typeof b.transportation !== "string" || !VALID_TRANSPORT.includes(b.transportation))) {
    return { valid: false, error: `transportation must be one of: ${VALID_TRANSPORT.join(", ")}` };
  }
  if (b.budgetPerMonth !== undefined && (typeof b.budgetPerMonth !== "number" || b.budgetPerMonth < 0 || b.budgetPerMonth > 10000)) {
    return { valid: false, error: "budgetPerMonth must be a number between 0 and 10000" };
  }
  if (b.responsibilities && (typeof b.responsibilities !== "string" || (b.responsibilities as string).length > 500)) {
    return { valid: false, error: "responsibilities must be a string (max 500 chars)" };
  }

  return { valid: true, data: b };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ── Authentication ──
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Input Validation ──
    const body = await req.json();
    const validation = validateInput(body);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { interests, gradeLevel, zipCode, transportation, budgetPerMonth, goals, responsibilities } = validation.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const safeInterests = (interests as string[] | undefined)?.join(", ") || "general";
    const safeGoals = (goals as string[] | undefined)?.join(", ") || "general development";
    const safeBudget = budgetPerMonth ?? 0;

    const prompt = `You are a youth development resource specialist for students in underserved communities.

Given this student profile:
- Grade: ${gradeLevel}
- ZIP Code: ${zipCode}
- Interests: ${safeInterests}
- Goals: ${safeGoals}
- Transportation: ${transportation || "any"}
- Budget: $${safeBudget}/month
- Responsibilities: ${responsibilities || "none reported"}

Suggest 5-8 specific, real programs, websites, or opportunities that match this student's profile. Focus on:
1. Free or low-cost options (budget: $${safeBudget}/month)
2. Accessible by ${transportation || "any means"} from ZIP ${zipCode}
3. Relevant to their interests and goals
4. Age-appropriate for grade ${gradeLevel}
5. Mix of online and local opportunities

For each resource, provide the title, a brief description, a URL if available, whether it's free, and the category (one of: ${VALID_CATEGORIES.join(", ")}).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a helpful resource discovery assistant for youth development. Always return actionable, real resources." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_resources",
              description: "Return a list of suggested resources for the student.",
              parameters: {
                type: "object",
                properties: {
                  resources: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        url: { type: "string" },
                        is_free: { type: "boolean" },
                        category: { type: "string", enum: VALID_CATEGORIES },
                        why: { type: "string", description: "Brief explanation of why this matches the student" },
                      },
                      required: ["title", "description", "is_free", "category", "why"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["resources"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_resources" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI gateway error:", response.status);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("discover-resources error:", e instanceof Error ? e.message : "Unknown");
    return new Response(JSON.stringify({ error: "An internal error occurred" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
