import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Support both legacy format and new quiz format
    let userPrompt: string;

    if (body.quizAnswers) {
      // New 20-question quiz format
      const { quizAnswers, skinImage } = body;
      console.log("Generating skincare recommendations from quiz answers:", quizAnswers.length, "questions");

      const answersText = quizAnswers
        .map((qa: { question: string; answer: string }) => `- ${qa.question}\n  Answer: ${qa.answer}`)
        .join("\n");

      userPrompt = `Create a personalized skincare routine based on the following skin profile quiz answers:

${answersText}

${skinImage ? "- A skin image was provided for visual reference" : ""}

Based on these answers, provide:
1. A skin type assessment (oily, dry, combination, sensitive, normal, or dehydrated)
2. Top skin concerns identified from the answers
3. A complete morning routine (4-6 steps) with specific product types and key ingredients
4. A complete evening routine (4-6 steps) with specific product types and key ingredients
5. Key active ingredients to look for based on their profile
6. One weekly treatment recommendation
7. Important notes and lifestyle tips specific to their needs

Be specific with product recommendations from our SKINLABS collection when possible. Remember to remind them to consult a dermatologist for any medical skin conditions.`;
    } else {
      // Legacy format
      const { skinType, concerns, age, lifestyle, environment, currentProducts, allergies, skinImage } = body;
      console.log("Generating skincare recommendations for:", { skinType, concerns, age, lifestyle, environment });

      userPrompt = `Create a personalized skincare routine for someone with the following profile:
- Skin Type: ${skinType}
- Main Concerns: ${concerns.join(", ")}
- Age Range: ${age || "Not specified"}
- Lifestyle: ${lifestyle || "Not specified"}
- Environment: ${environment || "Not specified"}
- Current Products: ${currentProducts || "Not specified"}
- Known Allergies/Sensitivities: ${allergies || "None specified"}
${skinImage ? "- A skin image was provided for visual reference" : ""}

Provide:
1. A complete morning routine (4-6 steps)
2. A complete evening routine (4-6 steps)
3. Key ingredients to look for based on their concerns and profile
4. One weekly treatment recommendation
5. Important notes about their specific needs

Be specific with product recommendations from our SKINLABS collection when possible. Remember to remind them to consult a dermatologist for any medical skin conditions.`;
    }

    const systemPrompt = `You are an expert skincare formulation specialist and AI advisor at SKINLABS, a premium skincare technology brand. You create personalized skincare routines based on individual skin profiles. 

IMPORTANT: You are NOT a dermatologist and should never refer to yourself as one. You provide general skincare advice and recommendations, but users should consult with licensed dermatologists for medical concerns.

Your recommendations should:
- Be science-backed and evidence-based
- Include specific product types (cleanser, toner, serum, moisturizer, SPF, treatment)
- Explain WHY each product is recommended for their specific concerns
- Include both morning and evening routines
- Mention key ingredients to look for
- Be warm, professional, and encouraging
- Always remind users that for medical skin conditions, they should consult a licensed dermatologist

Format your response as a structured routine with clear steps.`;

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
