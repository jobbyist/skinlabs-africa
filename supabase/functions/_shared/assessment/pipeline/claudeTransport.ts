/**
 * Generic structured-output Claude call for the SKYNN AI v2 pipeline — one
 * function every stage uses, generalised from ClaudeAssessmentProvider
 * (../claudeProvider.ts) so the two transports and their error mapping live
 * in one place per call shape:
 *
 *   1. AI_GATEWAY_API_KEY (default) -> Vercel AI Gateway, OpenAI-compatible
 *      chat completions, `anthropic/<model>`.
 *   2. ANTHROPIC_API_KEY (fallback) -> Anthropic Messages API directly.
 *
 * Structured output: the stage's schema is offered as a single tool and the
 * model is told to answer only by calling it. tool_choice is "auto", not
 * forced: Opus 5 runs adaptive thinking by default and forced tool use
 * doesn't combine with thinking, so a forced call would either fail or
 * silently lose the reasoning the QA/reasoner stages rely on. A response
 * without the tool call is treated as invalid_response and retried once by
 * the caller (run.ts) with a repair instruction.
 *
 * Deno-only (reads Deno.env); the pipeline itself takes this as an injected
 * dependency so it stays unit-testable under bun.
 */
import { AssessmentProviderError } from "../types.ts";
import { resolveModelForTask, type AssessmentTask } from "../modelConfig.ts";
import type { JsonSchema } from "./jsonSchema.ts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const AI_GATEWAY_CHAT_COMPLETIONS_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";

export interface StructuredCallArgs {
  task: AssessmentTask;
  system: string;
  user: string;
  toolName: string;
  toolDescription: string;
  schema: JsonSchema;
  maxTokens: number;
}

export interface StructuredCallResult {
  output: unknown;
  model: string;
  usage: { inputTokens: number | null; outputTokens: number | null };
}

const TOOL_INSTRUCTION = (toolName: string) =>
  `\n\nRespond ONLY by calling the \`${toolName}\` tool exactly once with your complete answer. Do not reply with prose.`;

function isHaiku(model: string): boolean {
  return model.includes("haiku");
}

async function readError(res: Response, label: string): Promise<never> {
  if (res.status === 429) throw new AssessmentProviderError(`${label} is rate-limited.`, "rate_limited");
  const detail = await res.text().catch(() => "");
  throw new AssessmentProviderError(`${label} error ${res.status}: ${detail.slice(0, 300)}`, "upstream_error");
}

async function callAnthropic(apiKey: string, model: string, args: StructuredCallArgs): Promise<StructuredCallResult> {
  const body: Record<string, unknown> = {
    model,
    max_tokens: args.maxTokens,
    system: [{ type: "text", text: args.system + TOOL_INSTRUCTION(args.toolName), cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: args.user }],
    tools: [{ name: args.toolName, description: args.toolDescription, input_schema: args.schema }],
  };
  if (isHaiku(model)) {
    // Haiku 4.5 has no adaptive thinking; a forced call is valid and cheapest.
    body.tool_choice = { type: "tool", name: args.toolName };
  } else {
    body.tool_choice = { type: "auto" };
    body.thinking = { type: "adaptive" };
  }

  let res: Response;
  try {
    res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": ANTHROPIC_VERSION },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new AssessmentProviderError(`Could not reach the AI provider: ${(err as Error).message}`, "upstream_error");
  }
  if (!res.ok) await readError(res, "AI provider");

  const data = await res.json();
  if (data.stop_reason === "refusal") {
    throw new AssessmentProviderError("The AI provider declined this request.", "invalid_response");
  }
  const toolUse = (data.content ?? []).find(
    (b: { type: string; name?: string }) => b.type === "tool_use" && b.name === args.toolName,
  );
  if (!toolUse) throw new AssessmentProviderError("AI provider did not return the structured tool call.", "invalid_response");
  return {
    output: toolUse.input,
    model,
    usage: { inputTokens: data.usage?.input_tokens ?? null, outputTokens: data.usage?.output_tokens ?? null },
  };
}

function toGatewayModelId(model: string): string {
  return model.includes("/") ? model : `anthropic/${model}`;
}

async function callGateway(apiKey: string, model: string, args: StructuredCallArgs): Promise<StructuredCallResult> {
  let res: Response;
  try {
    res = await fetch(AI_GATEWAY_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: toGatewayModelId(model),
        max_tokens: args.maxTokens,
        messages: [
          { role: "system", content: args.system + TOOL_INSTRUCTION(args.toolName) },
          { role: "user", content: args.user },
        ],
        tools: [{ type: "function", function: { name: args.toolName, description: args.toolDescription, parameters: args.schema } }],
        tool_choice: isHaiku(model) ? { type: "function", function: { name: args.toolName } } : "auto",
      }),
    });
  } catch (err) {
    throw new AssessmentProviderError(`Could not reach the AI gateway: ${(err as Error).message}`, "upstream_error");
  }
  if (!res.ok) await readError(res, "AI gateway");

  const data = await res.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.find(
    (t: { type: string; function?: { name: string } }) => t.type === "function" && t.function?.name === args.toolName,
  );
  const rawArgs = toolCall?.function?.arguments;
  if (typeof rawArgs !== "string") {
    throw new AssessmentProviderError("AI gateway did not return the structured tool call.", "invalid_response");
  }
  let output: unknown;
  try {
    output = JSON.parse(rawArgs);
  } catch {
    throw new AssessmentProviderError("AI gateway returned malformed JSON.", "invalid_response");
  }
  return {
    output,
    model,
    usage: { inputTokens: data.usage?.prompt_tokens ?? null, outputTokens: data.usage?.completion_tokens ?? null },
  };
}

export function transportConfigured(): boolean {
  return Boolean(Deno.env.get("AI_GATEWAY_API_KEY") || Deno.env.get("ANTHROPIC_API_KEY"));
}

export async function callClaudeStructured(args: StructuredCallArgs): Promise<StructuredCallResult> {
  const model = resolveModelForTask(args.task);
  const gatewayKey = Deno.env.get("AI_GATEWAY_API_KEY");
  if (gatewayKey) return callGateway(gatewayKey, model, args);
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (anthropicKey) return callAnthropic(anthropicKey, model, args);
  throw new AssessmentProviderError("Neither AI_GATEWAY_API_KEY nor ANTHROPIC_API_KEY is configured.", "not_configured");
}
