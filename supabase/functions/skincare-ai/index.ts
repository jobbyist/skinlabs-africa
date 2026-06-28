import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- AUTH CHECK (security fix: prevent anonymous AI credit abuse) ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: authError } = await supabaseAuth.auth.getClaims(token);
    if (authError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let userPrompt: string;


    if (body.quizAnswers) {
      const { quizAnswers, skinImage, contactName } = body;
      console.log("Generating skincare recommendations from quiz:", quizAnswers.length, "questions");

      const answersText = quizAnswers
        .map((qa: { question: string; answer: string }) => `- ${qa.question}\n  Answer: ${qa.answer}`)
        .join("\n");

      userPrompt = `Create a comprehensive, personalized skincare report for ${contactName || "this person"} based on the following skin assessment quiz:

${answersText}

${skinImage ? "- A skin image was provided for visual reference" : ""}

Generate a detailed report with EXACTLY these sections:

## 1. SKIN PROFILE
- Skin type classification (oily/dry/combination/sensitive/normal/dehydrated)
- Dehydration status assessment
- Sensitivity & barrier status
- Acne risk flags
- Pigmentation risk flags
- Aging risk flags

## 2. MORNING ROUTINE (AM)
Provide exact step-by-step order (4-6 steps) with:
- Step number
- Product type (e.g., gentle foaming cleanser)
- Key ingredients to look for
- Brief reason why

## 3. EVENING ROUTINE (PM)
Provide exact step-by-step order (4-6 steps) with same detail as AM.

## 4. ACTIVES SCHEDULE
- Week 1-2: Introduction plan
- Week 3-4: Building tolerance
- Ongoing: Maintenance
- IMPORTANT: List what actives NOT to combine

## 5. PRODUCT-TYPE RECOMMENDATIONS
Based on their climate, budget, and sensitivity:
- Cleanser type recommendation
- Moisturizer texture recommendation
- SPF format recommendation
- Active ingredient recommendations
- Adapted to their specific constraints

## 6. IMPORTANT NOTES
- Lifestyle-specific tips
- Reminder to consult a licensed dermatologist for medical skin conditions
- Note that this report is AI-generated and reviewed by skincare professionals

Keep the tone warm, professional, and encouraging. Be specific with product type recommendations from the SKINLABS collection when possible.`;
    } else {
      const { skinType, concerns, age, lifestyle, environment, currentProducts, allergies, skinImage } = body;
      console.log("Generating skincare recommendations (legacy):", { skinType, concerns });

      userPrompt = `Create a personalized skincare routine for someone with:
- Skin Type: ${skinType}
- Concerns: ${concerns?.join(", ") || "Not specified"}
- Age: ${age || "Not specified"}
- Lifestyle: ${lifestyle || "Not specified"}
- Environment: ${environment || "Not specified"}
- Current Products: ${currentProducts || "Not specified"}
- Allergies: ${allergies || "None"}
${skinImage ? "- Skin image provided" : ""}

Provide AM/PM routines, key ingredients, weekly treatment, and important notes.`;
    }

    const systemPrompt = `You are an expert skincare formulation specialist and AI advisor at SKINLABS, a premium skincare technology brand based in South Africa. You create personalized skincare routines based on individual skin profiles.

IMPORTANT: You are NOT a dermatologist. You provide general skincare advice. Users should consult licensed dermatologists for medical concerns.

Your recommendations should be:
- Science-backed and evidence-based
- Include specific product types with key ingredients
- Explain WHY each product is recommended
- Warm, professional, and encouraging
- Formatted with clear markdown headers and bullet points`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const recommendation = data.choices?.[0]?.message?.content;

    console.log("Successfully generated recommendation");

    return new Response(
      JSON.stringify({ recommendation }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in skincare-ai function:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate recommendation";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
