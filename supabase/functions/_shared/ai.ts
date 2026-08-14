/**
 * Lovable AI Gateway helper (Responses API, streaming).
 *
 * Every call streams — reasoning models routinely run for minutes and a
 * buffered request would be severed by the platform request timeout.
 */

const RESPONSES_URL = "https://ai.gateway.lovable.dev/v1/responses";

export const AI_MODEL = "openai/gpt-5.6-sol";

export class AiGatewayError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

interface GenerateJsonArgs {
  instructions: string;
  input: string;
  /** Strict JSON schema: every property required, additionalProperties false. */
  schema: Record<string, unknown>;
  schemaName: string;
  effort?: "low" | "medium" | "high";
}

/**
 * Runs a strict-JSON generation through the gateway and returns the parsed object.
 * No client-side timeout: aborted work is still billed and the answer is lost.
 */
export async function generateJson<T>({
  instructions,
  input,
  schema,
  schemaName,
  effort = "low",
}: GenerateJsonArgs): Promise<T> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new AiGatewayError(500, "LOVABLE_API_KEY is not configured");

  const res = await fetch(RESPONSES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      instructions,
      input,
      stream: true,
      store: false,
      reasoning: { effort, summary: "auto" },
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          strict: true,
          schema,
        },
      },
    }),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new AiGatewayError(res.status, `AI gateway error ${res.status}: ${detail.slice(0, 500)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const evt = JSON.parse(payload);
        if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
          text += evt.delta;
        } else if (evt.type === "response.completed" && typeof evt.response?.output_text === "string" && !text) {
          text = evt.response.output_text;
        }
      } catch {
        // Ignore keep-alive / partial frames.
      }
    }
  }

  if (!text.trim()) throw new AiGatewayError(502, "AI returned an empty response");

  try {
    return JSON.parse(text) as T;
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1)) as T;
    throw new AiGatewayError(502, "AI returned malformed JSON");
  }
}
