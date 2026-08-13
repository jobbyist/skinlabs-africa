import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DERMATOLOGIST_KNOWLEDGE } from "../skincare-ai/dermatologist-knowledge.ts";

/**
 * SkinLabs MCP server — exposes SkinLabs' skincare intelligence as MCP tools
 * so it can be called from other agents/apps, not just the website. Implements
 * the Streamable HTTP transport in its simplest, spec-legal "stateless" mode:
 * every request is a single JSON-RPC 2.0 call, answered with a single JSON
 * response (no session id, no SSE stream) — no server-side session state to
 * manage, which is the right tradeoff for a Deno edge function. If a future
 * client needs the stateful/streaming mode, add session-id issuance + an SSE
 * branch here; the tool implementations below don't need to change.
 *
 * Register this as an MCP connector at the deployed function URL, e.g.
 * https://<project-ref>.supabase.co/functions/v1/mcp-server
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, mcp-session-id",
};

// ---- Tool data (small/static — mirrors src/data/*.ts; Deno can't import
// those directly since they use Vite path aliases and image imports). Once
// Newsroom/Podcast move into Supabase like Reviews did, swap these for real
// queries the same way products/retailer_listings work below. ----

const QUIZ_QUESTIONS = [
  { id: "q1", title: "How would you describe your skin most days?", options: ["Oily / shiny by midday", "Combination — oily T-zone, dry cheeks", "Normal — balanced", "Dry / tight, especially after washing"] },
  { id: "q2", title: "How visible are your pores?", options: ["Very visible, especially on nose/cheeks", "Visible in the T-zone only", "Barely visible", "Not visible"] },
  { id: "q3", title: "How often do you get breakouts?", options: ["Frequently, multiple active spots", "Occasionally, around my period/stress", "Rarely", "Almost never"] },
  { id: "q9", title: "What's your #1 skin priority right now?", options: ["Clearing acne / breakouts", "Fading dark marks / brightening", "Anti-ageing / fine lines", "Calming sensitivity / redness"] },
];

const NEWSROOM_ARTICLES = [
  { id: "sunscreen-labelling-sa", title: "New SPF labelling guidance tightens sunscreen claims for local brands", tag: "UV Protection", date: "2026-08-12" },
  { id: "niacinamide-hyperpigmentation-trial", title: "Trial data supports niacinamide pairing for post-inflammatory hyperpigmentation", tag: "Hyperpigmentation", date: "2026-08-12" },
  { id: "winter-barrier-highveld", title: "Dermatologists report a spike in winter barrier damage across the Highveld", tag: "Gauteng Dryness", date: "2026-08-11" },
  { id: "retinal-vs-retinol", title: "Retinaldehyde gains ground as the tolerable retinoid step-up", tag: "Retinoids", date: "2026-08-11" },
  { id: "hard-water-skin", title: "Hard water linked to increased skin sensitivity in urban households", tag: "Water Quality", date: "2026-08-10" },
  { id: "teledermatology-access", title: "Teledermatology expands specialist access beyond metro areas", tag: "Access to Care", date: "2026-08-10" },
];

const PODCAST_EPISODES = [
  { slug: "ep-1-weird-skincare", title: "Episode 1: Weird Skincare", duration: "18 min", topics: ["Ingredient Science", "Trends"] },
  { slug: "ep-2-skincare-fails", title: "Episode 2: Skincare Fails", duration: "22 min", topics: ["Barrier Repair", "Routine Building"] },
  { slug: "ep-3-glass-skin", title: "Episode 3: Glass Skin", duration: "20 min", topics: ["Hydration", "Trends"] },
  { slug: "ep-4-ingredient-drama", title: "Episode 4: Ingredient Drama", duration: "19 min", topics: ["Retinoids 101", "Ingredient Science"] },
];

const PRACTITIONERS = [
  { id: "dr-naledi-mokoena", name: "Dr. Naledi Mokoena", city: "Johannesburg", province: "Gauteng", specialities: ["Hyperpigmentation", "Acne", "Melanin-rich skin"], virtual_fee_zar: 850 },
  { id: "dr-imraan-patel", name: "Dr. Imraan Patel", city: "Durban", province: "KwaZulu-Natal", specialities: ["Eczema", "Rosacea", "Humid climate care"], virtual_fee_zar: 1150 },
  { id: "sr-lerato-dlamini", name: "Sr. Lerato Dlamini", city: "Pretoria", province: "Gauteng", specialities: ["Routine building", "Barrier repair", "Post-procedure care"], virtual_fee_zar: 550 },
  { id: "dr-hanri-van-zyl", name: "Dr. Hanri van Zyl", city: "Cape Town", province: "Western Cape", specialities: ["Photoageing", "Retinoid protocols", "Sun damage"], virtual_fee_zar: 950 },
];

// ---- Tool definitions (MCP `tools/list` shape) ----

const TOOLS = [
  {
    name: "get_skin_assessment_questions",
    description: "Returns the SkinLabs AI Formulator skin-assessment question set, for building a client-side quiz or gathering structured input before calling analyze_skin_profile.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "analyze_skin_profile",
    description: "Generates a dermatologist-grounded personalized skincare routine (skin profile, AM/PM routine, actives schedule, product-type recommendations) from a set of quiz answers.",
    inputSchema: {
      type: "object",
      properties: {
        answers: {
          type: "array",
          description: "List of {question, answer} pairs describing the client's skin.",
          items: {
            type: "object",
            properties: { question: { type: "string" }, answer: { type: "string" } },
            required: ["question", "answer"],
          },
        },
        clientName: { type: "string", description: "Optional name to personalise the report." },
      },
      required: ["answers"],
      additionalProperties: false,
    },
  },
  {
    name: "search_product_reviews",
    description: "Searches SkinLabs' independent SA product review engine by category and/or skin type, returning scores, verdict and rand pricing.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "e.g. Moisturiser, Cleanser, Serum, Sunscreen, Body" },
        skinType: { type: "string", description: "e.g. Oily, Dry, Sensitive, Combination" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "search_newsroom",
    description: "Searches The Daily Skinny (SkinLabs' skincare-science newsroom) by keyword, returning matching briefing titles and topic tags.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", description: "Keyword to match against titles and tags." } },
      additionalProperties: false,
    },
  },
  {
    name: "get_podcast_episodes",
    description: "Lists episodes of The Skin Deep Podcast with slug, duration and topics.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "find_practitioners",
    description: "Finds SA dermatologists/aesthetic practitioners available for virtual consultation, optionally filtered by city or speciality.",
    inputSchema: {
      type: "object",
      properties: {
        city: { type: "string" },
        speciality: { type: "string" },
      },
      additionalProperties: false,
    },
  },
] as const;

// ---- Tool implementations ----

async function callTool(name: string, args: Record<string, unknown>, req: Request) {
  switch (name) {
    case "get_skin_assessment_questions":
      return { questions: QUIZ_QUESTIONS };

    case "analyze_skin_profile": {
      // Authentication check: validate shared secret or JWT
      const authHeader = req.headers.get("authorization");
      const MCP_SHARED_SECRET = Deno.env.get("MCP_SHARED_SECRET");
      if (MCP_SHARED_SECRET) {
        if (!authHeader || authHeader !== `Bearer ${MCP_SHARED_SECRET}`) {
          throw new Error("Unauthorized: invalid or missing authentication");
        }
      }
      // If MCP_SHARED_SECRET is not set, the function is open (legacy/dev mode)

      const answers = args.answers as Array<{ question: string; answer: string }> | undefined;
      if (!answers?.length) throw new Error("`answers` is required and must be non-empty.");

      // Size limits to prevent abuse
      const MAX_ANSWERS = 50;
      const MAX_ANSWER_LENGTH = 500;
      if (answers.length > MAX_ANSWERS) {
        throw new Error(`Too many answers: maximum ${MAX_ANSWERS} allowed`);
      }
      for (const qa of answers) {
        if (qa.answer && qa.answer.length > MAX_ANSWER_LENGTH) {
          throw new Error(`Answer too long: maximum ${MAX_ANSWER_LENGTH} characters per answer`);
        }
      }

      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured on this function.");

      const answersText = answers.map((qa) => `- ${qa.question}\n  → ${qa.answer}`).join("\n");
      const systemPrompt = `You are SKINLABS' senior AI skincare formulator. You produce dermatologist-grade personalized skincare routines for clients in South Africa. You are NOT a dermatologist — always remind users to consult one for medical concerns.\n\nGround every recommendation in this reference:\n${DERMATOLOGIST_KNOWLEDGE}\n\nUse clean markdown with sections: Skin Profile, Morning Routine, Evening Routine, Actives Schedule, Product-Type Recommendations, Lifestyle Tips, Important Notes.`;
      const userPrompt = `Generate a personalized skincare report for ${(args.clientName as string) || "this client"} based on:\n${answersText}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });
      if (!response.ok) throw new Error(`AI gateway error: ${response.status}`);
      const data = await response.json();
      const recommendation = data.choices?.[0]?.message?.content;
      if (!recommendation) throw new Error("No recommendation returned by AI");
      return { recommendation };
    }

    case "search_product_reviews": {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
      if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase env not configured on this function.");
      let url = `${supabaseUrl}/rest/v1/products?select=id,product_name,brand,category,local_price_zar,verdict,skin_type_match`;
      if (args.category) url += `&category=eq.${encodeURIComponent(args.category as string)}`;
      const res = await fetch(url, { headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` } });
      if (!res.ok) throw new Error(`Supabase query failed: ${res.status}`);
      let rows = (await res.json()) as Array<{ skin_type_match: string[] }>;
      if (args.skinType) {
        const needle = (args.skinType as string).toLowerCase();
        rows = rows.filter((r) => r.skin_type_match?.some((s) => s.toLowerCase().includes(needle)));
      }
      return { products: rows };
    }

    case "search_newsroom": {
      const query = ((args.query as string) || "").toLowerCase();
      const matches = query
        ? NEWSROOM_ARTICLES.filter((a) => a.title.toLowerCase().includes(query) || a.tag.toLowerCase().includes(query))
        : NEWSROOM_ARTICLES;
      return { articles: matches };
    }

    case "get_podcast_episodes":
      return { episodes: PODCAST_EPISODES };

    case "find_practitioners": {
      let results = PRACTITIONERS;
      if (args.city) results = results.filter((p) => p.city.toLowerCase() === (args.city as string).toLowerCase());
      if (args.speciality) {
        const needle = (args.speciality as string).toLowerCase();
        results = results.filter((p) => p.specialities.some((s) => s.toLowerCase().includes(needle)));
      }
      return { practitioners: results };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ---- JSON-RPC 2.0 / MCP request handling ----

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

function jsonRpcResult(id: JsonRpcRequest["id"], result: unknown) {
  return { jsonrpc: "2.0", id, result };
}

function jsonRpcError(id: JsonRpcRequest["id"], code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("MCP server — POST JSON-RPC 2.0 requests here.", {
      status: 405,
      headers: corsHeaders,
    });
  }

  let body: JsonRpcRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify(jsonRpcError(null, -32700, "Parse error")), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { id = null, method, params = {} } = body;

  try {
    switch (method) {
      case "initialize": {
        const SUPPORTED_VERSIONS = ["2025-03-26"];
        const clientVersion = (params as { protocolVersion?: string }).protocolVersion;
        const protocolVersion = clientVersion && SUPPORTED_VERSIONS.includes(clientVersion)
          ? clientVersion
          : SUPPORTED_VERSIONS[0];
        return Response.json(
          jsonRpcResult(id, {
            protocolVersion,
            capabilities: { tools: {} },
            serverInfo: { name: "skinlabs-mcp-server", version: "0.1.0" },
          }),
          { headers: corsHeaders },
        );
      }

      case "notifications/initialized":
        // Notifications have no id and expect no body — 202 Accepted.
        return new Response(null, { status: 202, headers: corsHeaders });

      case "tools/list":
        return Response.json(jsonRpcResult(id, { tools: TOOLS }), { headers: corsHeaders });

      case "tools/call": {
        const toolName = params.name as string;
        const toolArgs = (params.arguments as Record<string, unknown>) ?? {};
        try {
          const output = await callTool(toolName, toolArgs, req);
          return Response.json(
            jsonRpcResult(id, { content: [{ type: "text", text: JSON.stringify(output) }] }),
            { headers: corsHeaders },
          );
        } catch (toolError) {
          // Tool-execution errors return as 200 OK with isError:true per MCP convention
          const errorMessage = toolError instanceof Error ? toolError.message : String(toolError);
          return Response.json(
            jsonRpcResult(id, { content: [{ type: "text", text: JSON.stringify({ isError: true, error: errorMessage }) }] }),
            { status: 200, headers: corsHeaders },
          );
        }
      }

      default:
        return Response.json(jsonRpcError(id, -32601, `Method not found: ${method}`), {
          status: 404,
          headers: corsHeaders,
        });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return Response.json(jsonRpcError(id, -32000, message), { status: 500, headers: corsHeaders });
  }
});
