import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DERMATOLOGIST_KNOWLEDGE } from "./dermatologist-knowledge.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ---- AUTH (optional) ----
    // The quiz + free preview are open to anonymous visitors. When a valid
    // user session is present we identify the user so the recommendation can
    // be persisted to their account; otherwise we proceed anonymously.
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} },
    });

    let userId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData } = await supabaseAuth.auth.getClaims(token).catch(() => ({ data: null }));
      userId = claimsData?.claims?.sub ?? null;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body = await req.json();
    const { quizAnswers, skinImage, contactName } = body as {
      quizAnswers?: Array<{ question: string; answer: string }>;
      skinImage?: string | null; // base64 data URL OR null
      contactName?: string;
    };

    if (!quizAnswers || !Array.isArray(quizAnswers) || quizAnswers.length === 0) {
      return new Response(JSON.stringify({ error: "Missing quiz answers" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const answersText = quizAnswers
      .map((qa) => `- ${qa.question}\n  → ${qa.answer}`)
      .join("\n");

    const userTextPrompt = `Generate a comprehensive, dermatologist-grade personalized skincare report for ${contactName || "this client"}.

CLIENT SKIN ASSESSMENT (20-question quiz):
${answersText}

${skinImage ? "A clear selfie has been attached — analyse it for visible skin tone (Fitzpatrick estimate), oil/shine distribution, visible texture, redness, post-inflammatory marks, congestion, and barrier signs. Cross-reference the visual observations with the quiz answers." : "(No selfie provided — base analysis on quiz answers only.)"}

OUTPUT FORMAT — use EXACTLY these markdown sections in this order:

## 1. SKIN PROFILE
- Skin type (oily / dry / combination / sensitive / normal / dehydrated)
- Estimated Fitzpatrick phototype + reasoning
- Dehydration status
- Sensitivity & barrier status
- Acne risk
- Pigmentation / PIH risk
- Photoaging risk
${skinImage ? "- Visible observations from the photo (objective, non-diagnostic)" : ""}

## 2. MORNING ROUTINE (AM)
4–6 numbered steps. For each: step name, product TYPE, 2–3 key ingredients, brief WHY tied to this person's profile.

## 3. EVENING ROUTINE (PM)
4–6 numbered steps with the same detail as AM.

## 4. ACTIVES SCHEDULE
- Week 1–2: introduction plan (which active, frequency, buffering)
- Week 3–4: building tolerance
- Ongoing maintenance
- DO NOT COMBINE: list specific actives that should not be layered for this client

## 5. PRODUCT-TYPE RECOMMENDATIONS
Adapted to the client's climate, budget, sensitivity, and consistency level:
- Cleanser type
- Moisturizer texture
- SPF format (and minimum SPF value)
- 2–3 active serums prioritized for their concerns
- Optional weekly treatment

## 6. LIFESTYLE & ENVIRONMENT TIPS
3–5 bullet points tailored to their environment, makeup use, and constraints.

## 7. IMPORTANT NOTES
- Remind them to introduce one active at a time.
- Flag any signs that warrant seeing a licensed dermatologist.
- State that this report is AI-generated, grounded in dermatology references, and reviewed by SKINLABS skincare specialists.

Tone: warm, professional, encouraging, evidence-led. Cite the client's own quiz answers when justifying choices. Be specific.`;

    const systemPrompt = `You are SKINLABS' senior AI skincare formulator. You produce dermatologist-grade personalized skincare routines for clients in South Africa. You are NOT a dermatologist — always remind users to consult one for medical concerns.

You MUST ground every recommendation in the dermatology reference knowledge below. Do not invent ingredients or concentrations outside this reference. Adapt strictly to the client's quiz answers and (when provided) selfie.

=== DERMATOLOGY REFERENCE KNOWLEDGE ===
${DERMATOLOGIST_KNOWLEDGE}
=== END REFERENCE KNOWLEDGE ===

Output rules:
- Use clean markdown with the exact section headers requested by the user prompt.
- Be specific (product type + key ingredients + reason), but never name competitor brands.
- Always tailor SPF and active titration to the client's Fitzpatrick estimate and barrier status.`;

    // Build multimodal user message (text + optional image)
    const userContent: Array<Record<string, unknown>> = [
      { type: "text", text: userTextPrompt },
    ];

    if (skinImage && typeof skinImage === "string" && skinImage.startsWith("data:image/")) {
      userContent.push({
        type: "image_url",
        image_url: { url: skinImage },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const recommendation = data.choices?.[0]?.message?.content;

    if (!recommendation) throw new Error("No recommendation returned by AI");

    // Persist (best-effort, signed-in users only) — does not block the response
    if (userId) {
      try {
        const skinType = /skin type[^\n]*?(oily|dry|combination|sensitive|normal|dehydrated)/i
          .exec(recommendation)?.[1]
          ?.toLowerCase() ?? "unknown";
        await supabaseAuth.from("skincare_recommendations").insert({
          user_id: userId,
          skin_type: skinType,
          concerns: [],
          recommendation,
          status: "delivered",
          contact_name: contactName ?? null,
        });
      } catch (persistErr) {
        console.warn("Could not persist recommendation:", persistErr);
      }
    }

    return new Response(JSON.stringify({ recommendation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in skincare-ai function:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate recommendation";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
