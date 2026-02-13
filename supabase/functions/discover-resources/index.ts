import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { interests, gradeLevel, zipCode, transportation, budgetPerMonth, goals, responsibilities } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `You are a youth development resource specialist for students in underserved communities.

Given this student profile:
- Grade: ${gradeLevel}
- ZIP Code: ${zipCode}
- Interests: ${interests?.join(", ")}
- Goals: ${goals?.join(", ")}
- Transportation: ${transportation}
- Budget: $${budgetPerMonth}/month
- Responsibilities: ${responsibilities}

Suggest 5-8 specific, real programs, websites, or opportunities that match this student's profile. Focus on:
1. Free or low-cost options (budget: $${budgetPerMonth}/month)
2. Accessible by ${transportation} from ZIP ${zipCode}
3. Relevant to their interests and goals
4. Age-appropriate for grade ${gradeLevel}
5. Mix of online and local opportunities

For each resource, provide the title, a brief description, a URL if available, whether it's free, and the category (one of: online_learning, local_opportunity, scholarship, mentorship, community_event, career_program).`;

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
                        category: { type: "string", enum: ["online_learning", "local_opportunity", "scholarship", "mentorship", "community_event", "career_program"] },
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
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
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
    console.error("discover-resources error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
