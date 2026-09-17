/**
 * ClaudeAssessmentProvider — the Anthropic-backed implementation of
 * AssessmentAIProvider (section 4). Called server-side only; the frontend
 * never sees ANTHROPIC_API_KEY, AI_GATEWAY_API_KEY, the system prompt, or
 * this module at all.
 *
 * Two transports, same model family and same report contract — this is
 * still "Claude" either way, so it stays one provider class rather than a
 * second AssessmentAIProvider implementation:
 *   1. AI_GATEWAY_API_KEY (the DEFAULT, 2026-09-17) -> Vercel's AI Gateway
 *      — the same key already configured as a Vercel project env var for
 *      the product-review pipeline's Gemini calls, see CLAUDE.md — routed
 *      to Claude via its OpenAI-compatible chat completions endpoint with
 *      an `anthropic/<model>` model string and OpenAI-style forced
 *      function-calling for structured output. Standardising on the
 *      Gateway here keeps this engine on the same "no direct Anthropic
 *      key needed" operational story as the rest of the app's AI calls
 *      (all of which already run through a Vercel-managed key), rather
 *      than requiring a second, differently-scoped secret.
 *   2. ANTHROPIC_API_KEY set, AI_GATEWAY_API_KEY absent -> falls back to
 *      Anthropic's own Messages API directly via fetch (no SDK dependency
 *      — matches this repo's existing thin-fetch-wrapper convention, see
 *      supabase/functions/_shared/ai.ts for the Lovable Gateway
 *      equivalent). Structured output via a single forced tool call whose
 *      input_schema mirrors reportSchema.ts. Useful for local/manual
 *      testing against Anthropic directly without going through Vercel.
 *   Neither key set -> AssessmentProviderError("not_configured").
 *
 * Model selection is per-task via modelConfig.ts's resolveModelForTask —
 * see that file for the full Opus 5 / Sonnet 5 / Haiku 4.5 routing table.
 * SKYNN_ADVANCED_MODEL remains a global override on top of that routing.
 */
import { AssessmentProviderError, type AssessmentGenerationInput, type AssessmentGenerationResult } from "./types.ts";
import { validateReportShape } from "./reportSchema.ts";
import { resolveModelForTask } from "./modelConfig.ts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const AI_GATEWAY_CHAT_COMPLETIONS_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";

// Non-streaming request against a reasoning-heavy model (Opus 5 by default
// for report_generation — see modelConfig.ts) whose adaptive thinking
// shares this same token budget: 4096 left real reports at risk of being
// cut off mid-generation before the model ever emits the forced tool call.
const MAX_REPORT_TOKENS = 8192;
const REPORT_TOOL_NAME = "submit_advanced_dermatology_report";

const REPORT_INPUT_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    skinProfile: {
      type: "object",
      properties: { skinType: { type: "string" }, keyTraits: { type: "array", items: { type: "string" } } },
      required: ["skinType", "keyTraits"],
    },
    observations: { type: "array", items: { type: "string" } },
    primaryConcerns: {
      type: "array",
      items: {
        type: "object",
        properties: { concern: { type: "string" }, priority: { type: "integer" }, rationale: { type: "string" } },
        required: ["concern", "priority", "rationale"],
      },
    },
    secondaryConcerns: { type: "array", items: { type: "string" } },
    contributingFactors: {
      type: "array",
      items: {
        type: "object",
        properties: { factor: { type: "string" }, explanation: { type: "string" } },
        required: ["factor", "explanation"],
      },
    },
    routineAssessment: {
      type: "object",
      properties: { strengths: { type: "array", items: { type: "string" } }, gaps: { type: "array", items: { type: "string" } } },
      required: ["strengths", "gaps"],
    },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: { area: { type: "string" }, recommendation: { type: "string" }, rationale: { type: "string" } },
        required: ["area", "recommendation", "rationale"],
      },
    },
    ingredientGuidance: {
      type: "array",
      items: {
        type: "object",
        properties: { ingredientOrCategory: { type: "string" }, guidance: { type: "string" } },
        required: ["ingredientOrCategory", "guidance"],
      },
    },
    routineStrategy: {
      type: "object",
      properties: { amFocus: { type: "string" }, pmFocus: { type: "string" }, notes: { type: "string" } },
      required: ["amFocus", "pmFocus", "notes"],
    },
    lifestyleContext: { type: "array", items: { type: "string" } },
    whatToAvoid: { type: "array", items: { type: "string" } },
    evidence: {
      type: "array",
      items: {
        type: "object",
        properties: { id: { type: "string" }, title: { type: "string" }, relevance: { type: "string" } },
        required: ["id"],
      },
      description: "Only cite evidence ids from the ALLOWED EVIDENCE list provided in the prompt. Never invent an id, title or source.",
    },
    confidence: { type: "string", enum: ["high", "moderate", "limited"] },
    uncertainties: { type: "array", items: { type: "string" } },
  },
  required: [
    "summary", "skinProfile", "observations", "primaryConcerns", "secondaryConcerns", "contributingFactors",
    "routineAssessment", "recommendations", "ingredientGuidance", "routineStrategy", "lifestyleContext",
    "whatToAvoid", "confidence", "uncertainties",
  ],
} as const;

function buildUserMessage(input: AssessmentGenerationInput): string {
  // Structured, labelled JSON rather than a concatenated prose blob
  // (section 25) — sanitised already by the caller (sanitize.ts) before
  // this function ever sees it.
  return [
    "Generate an Advanced Dermatology Report for this SkinLabs member from the structured data below.",
    "Only use the ALLOWED EVIDENCE entries for the `evidence` field — never cite anything not listed there.",
    "",
    "=== USER PROFILE (sanitised) ===",
    JSON.stringify(input.userProfile, null, 2),
    "",
    "=== ASSESSMENT RESPONSES ===",
    JSON.stringify(input.assessment, null, 2),
    "",
    "=== SAFETY SCREEN (already computed deterministically — do not override) ===",
    JSON.stringify(input.safetyContext.screen, null, 2),
    "",
    "=== ALLOWED EVIDENCE ===",
    JSON.stringify(input.evidence, null, 2),
    input.routineContext ? "\n=== CURRENT ROUTINE CONTEXT ===\n" + JSON.stringify(input.routineContext, null, 2) : "",
  ].join("\n");
}

interface AnthropicToolUseBlock {
  type: "tool_use";
  name: string;
  input: unknown;
}

async function callAnthropic(args: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userMessage: string;
}): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": args.apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: args.model,
        max_tokens: MAX_REPORT_TOKENS,
        system: args.systemPrompt,
        messages: [{ role: "user", content: args.userMessage }],
        tools: [
          {
            name: REPORT_TOOL_NAME,
            description: "Submit the structured Advanced Dermatology Report.",
            input_schema: REPORT_INPUT_SCHEMA,
          },
        ],
        tool_choice: { type: "tool", name: REPORT_TOOL_NAME },
      }),
    });
  } catch (err) {
    throw new AssessmentProviderError(`Could not reach the AI provider: ${(err as Error).message}`, "upstream_error");
  }

  if (res.status === 429) {
    throw new AssessmentProviderError("The AI provider is rate-limited. Please try again shortly.", "rate_limited");
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new AssessmentProviderError(`AI provider error ${res.status}: ${detail.slice(0, 300)}`, "upstream_error");
  }

  const data = await res.json();
  const toolUse = (data.content ?? []).find((b: AnthropicToolUseBlock) => b.type === "tool_use" && b.name === REPORT_TOOL_NAME);
  if (!toolUse) {
    throw new AssessmentProviderError("AI provider did not return a structured report.", "invalid_response");
  }
  return toolUse.input;
}

/** `claude-sonnet-5` -> `anthropic/claude-sonnet-5`. Left untouched if an
 *  operator already supplies a provider-prefixed model string. */
function toGatewayModelId(model: string): string {
  return model.includes("/") ? model : `anthropic/${model}`;
}

/**
 * Vercel AI Gateway fallback transport — its chat completions endpoint is
 * OpenAI-compatible, so structured output uses OpenAI-style forced
 * function-calling rather than Anthropic's native tool_use block, even
 * though the underlying model is still Claude (see toGatewayModelId).
 */
async function callViaGateway(args: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userMessage: string;
}): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(AI_GATEWAY_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${args.apiKey}`,
      },
      body: JSON.stringify({
        model: toGatewayModelId(args.model),
        max_tokens: MAX_REPORT_TOKENS,
        messages: [
          { role: "system", content: args.systemPrompt },
          { role: "user", content: args.userMessage },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: REPORT_TOOL_NAME,
              description: "Submit the structured Advanced Dermatology Report.",
              parameters: REPORT_INPUT_SCHEMA,
            },
          },
        ],
        tool_choice: { type: "function", function: { name: REPORT_TOOL_NAME } },
      }),
    });
  } catch (err) {
    throw new AssessmentProviderError(`Could not reach the AI gateway: ${(err as Error).message}`, "upstream_error");
  }

  if (res.status === 429) {
    throw new AssessmentProviderError("The AI gateway is rate-limited. Please try again shortly.", "rate_limited");
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new AssessmentProviderError(`AI gateway error ${res.status}: ${detail.slice(0, 300)}`, "upstream_error");
  }

  const data = await res.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.find(
    (t: { type: string; function?: { name: string } }) => t.type === "function" && t.function?.name === REPORT_TOOL_NAME,
  );
  const rawArgs = toolCall?.function?.arguments;
  if (typeof rawArgs !== "string") {
    throw new AssessmentProviderError("AI gateway did not return a structured report.", "invalid_response");
  }
  try {
    return JSON.parse(rawArgs);
  } catch {
    throw new AssessmentProviderError("AI gateway returned malformed JSON.", "invalid_response");
  }
}

interface ResolvedTransport {
  call: (args: { apiKey: string; model: string; systemPrompt: string; userMessage: string }) => Promise<unknown>;
  apiKey: string;
}

/** AI_GATEWAY_API_KEY wins when both are set — the Vercel AI Gateway is now
 *  the default transport (2026-09-17); ANTHROPIC_API_KEY is a fallback for
 *  direct-Anthropic testing, not the primary path. */
function resolveTransport(): ResolvedTransport {
  const gatewayKey = Deno.env.get("AI_GATEWAY_API_KEY");
  if (gatewayKey) return { call: callViaGateway, apiKey: gatewayKey };

  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (anthropicKey) return { call: callAnthropic, apiKey: anthropicKey };

  throw new AssessmentProviderError("Neither AI_GATEWAY_API_KEY nor ANTHROPIC_API_KEY is configured.", "not_configured");
}

export class ClaudeAssessmentProvider {
  constructor(private readonly systemPrompt: string, private readonly promptVersion: string) {}

  async generateReport(input: AssessmentGenerationInput): Promise<AssessmentGenerationResult> {
    const { call, apiKey } = resolveTransport();
    const model = resolveModelForTask("report_generation");
    const userMessage = buildUserMessage(input);

    // One repair retry on a malformed response (section 12/20) — a network
    // retry from the caller is a separate, idempotent concern handled by
    // the edge function's use of submit_advanced_assessment_session's
    // idempotency key, not by retrying Claude calls silently forever here.
    let raw = await call({ apiKey, model, systemPrompt: this.systemPrompt, userMessage });
    let validated = validateReportShape(raw);

    if (!validated.success) {
      raw = await call({
        apiKey,
        model,
        systemPrompt: this.systemPrompt,
        userMessage: userMessage + "\n\nYour previous submission did not match the required schema exactly. Re-submit, matching every required field precisely.",
      });
      validated = validateReportShape(raw);
    }

    if (!validated.success || !validated.data) {
      throw new AssessmentProviderError("AI provider returned a malformed report after retry.", "invalid_response");
    }

    return {
      report: validated.data,
      metadata: {
        model,
        promptVersion: this.promptVersion,
        engineVersion: "1.0.0",
        generatedAt: new Date().toISOString(),
      },
    };
  }
}
