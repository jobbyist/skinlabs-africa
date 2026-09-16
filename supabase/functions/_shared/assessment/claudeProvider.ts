/**
 * ClaudeAssessmentProvider — the Anthropic-backed implementation of
 * AssessmentAIProvider (section 4). Called server-side only; the frontend
 * never sees ANTHROPIC_API_KEY, the system prompt, or this module at all.
 *
 * Uses the Messages API directly via fetch (no SDK dependency — none of
 * this repo's edge functions currently import the Anthropic SDK, and the
 * existing convention here is a thin fetch wrapper per provider, see
 * supabase/functions/_shared/ai.ts for the Lovable Gateway equivalent).
 * Structured output is obtained the standard, officially-documented way for
 * the Messages API: a single forced tool call whose input_schema mirrors
 * reportSchema.ts, rather than asking for free-form JSON in prose.
 */
import { AssessmentProviderError, type AssessmentGenerationInput, type AssessmentGenerationResult } from "./types.ts";
import { validateReportShape } from "./reportSchema.ts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

// Configurable via SKYNN_ADVANCED_MODEL (section 4) — never assume this stays
// the production model. Confirm against Anthropic's current model list
// before activating this engine in production (same caution CLAUDE.md
// already documents for the Gemini model id used elsewhere in this repo).
const DEFAULT_MODEL = "claude-sonnet-5";
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
        max_tokens: 4096,
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

export class ClaudeAssessmentProvider {
  constructor(private readonly systemPrompt: string, private readonly promptVersion: string) {}

  async generateReport(input: AssessmentGenerationInput): Promise<AssessmentGenerationResult> {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      throw new AssessmentProviderError("ANTHROPIC_API_KEY is not configured.", "not_configured");
    }
    const model = Deno.env.get("SKYNN_ADVANCED_MODEL") || DEFAULT_MODEL;
    const userMessage = buildUserMessage(input);

    // One repair retry on a malformed response (section 12/20) — a network
    // retry from the caller is a separate, idempotent concern handled by
    // the edge function's use of submit_advanced_assessment_session's
    // idempotency key, not by retrying Claude calls silently forever here.
    let raw = await callAnthropic({ apiKey, model, systemPrompt: this.systemPrompt, userMessage });
    let validated = validateReportShape(raw);

    if (!validated.success) {
      raw = await callAnthropic({
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
