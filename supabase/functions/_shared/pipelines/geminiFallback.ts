/**
 * Shared Gemini model-fallback chain for the Supabase-cron content pipelines
 * (product-review-sync, briefings-sync). Ported verbatim from the former
 * api/_lib/geminiFallback.ts (Vercel Node runtime) -- this module only ever
 * used fetch/AbortController/JSON, never process.env or any Node-specific
 * API, so it runs unmodified under Deno.
 *
 * PRIMARY   gemini-3.6-flash
 *   |  transient failure / quota pressure / timeout
 *   v
 * FALLBACK 1 gemini-3.1-flash-lite
 *   |  still unavailable
 *   v
 * FALLBACK 2 gemini-3.5-flash-lite
 *   |  still unavailable
 *   v
 * caller queues the candidate for retry (see pipeline_retry_queue in both
 * callers -- this module itself has no persistence, only classification +
 * the fallback loop).
 *
 * Error handling per attempt (the actual routing table this module
 * implements -- see classifyOutcome()):
 *   - 429 (rate limited)         -> fallback to next model, no same-model retry
 *   - 5xx (transient server)     -> retry once on the same model, then fallback
 *   - timeout / network error    -> retry once on the same model, then fallback
 *   - 404 (model unavailable)    -> fallback to next model, no same-model retry
 *   - malformed structured output-> one repair re-prompt on the same model, then fallback
 *   - 401/403 (auth)             -> THROWN immediately as GeminiFatalError, no
 *     fallback attempted at all -- an auth failure means the API key/config
 *     is broken, and silently trying weaker models would just fail three
 *     times instead of once and mask a config bug as a "capacity" problem.
 *   - 400 (invalid request)      -> THROWN immediately as GeminiFatalError --
 *     a bad prompt/schema is an application bug that every model will reject
 *     identically; falling back can't fix it and would just burn quota on
 *     all three models for nothing.
 */

export type GeminiErrorKind =
  | "rate_limited"
  | "server_error"
  | "timeout"
  | "model_unavailable"
  | "malformed_output"
  | "auth_error"
  | "invalid_request"
  | "network_error";

export interface GeminiAttemptLog {
  model: string;
  attemptNumber: 1 | 2;
  outcome: "success" | GeminiErrorKind;
  httpStatus?: number;
  message?: string;
  durationMs: number;
  timestamp: string;
}

/** Auth or invalid-request failure -- never fall back further, alert instead. */
export class GeminiFatalError extends Error {
  readonly kind: "auth_error" | "invalid_request";
  readonly attempts: GeminiAttemptLog[];
  constructor(message: string, kind: "auth_error" | "invalid_request", attempts: GeminiAttemptLog[]) {
    super(message);
    this.name = "GeminiFatalError";
    this.kind = kind;
    this.attempts = attempts;
  }
}

/** Every model in the chain was exhausted (rate limits, capacity, or repeated malformed output). */
export class GeminiAllModelsExhaustedError extends Error {
  readonly attempts: GeminiAttemptLog[];
  constructor(attempts: GeminiAttemptLog[]) {
    super(`All Gemini models in the fallback chain were exhausted after ${attempts.length} attempt(s).`);
    this.name = "GeminiAllModelsExhaustedError";
    this.attempts = attempts;
  }
}

const REPAIR_NOTE =
  "Your previous response was not valid JSON matching the required schema. " +
  "Re-read the instructions above and respond again with ONLY valid JSON matching the schema exactly -- " +
  "no markdown fences, no commentary, no text before or after the JSON object.";

interface RawGeminiResult {
  status: number;
  text: string | null;
}

async function rawGeminiCall(args: {
  model: string;
  apiKey: string;
  systemInstruction: string;
  userContent: string;
  responseSchema: Record<string, unknown>;
  temperature: number;
  maxOutputTokens: number;
  timeoutMs: number;
  repairNote?: string;
}): Promise<RawGeminiResult> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${args.model}:generateContent`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), args.timeoutMs);
  try {
    const promptText = args.repairNote ? `${args.userContent}\n\n${args.repairNote}` : args.userContent;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": args.apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: args.systemInstruction }] },
        contents: [{ parts: [{ text: promptText.slice(0, 20000) }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: args.responseSchema,
          temperature: args.temperature,
          maxOutputTokens: args.maxOutputTokens,
        },
      }),
      signal: controller.signal,
    });
    const body = (await res.json().catch(() => null)) as
      | { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
      | null;
    const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;
    return { status: res.status, text: typeof text === "string" ? text : null };
  } finally {
    clearTimeout(timer);
  }
}

export interface CallGeminiWithFallbackOptions<T> {
  apiKey: string;
  /** Ordered model chain: [primary, fallback1, fallback2, ...]. */
  models: string[];
  systemInstruction: string;
  userContent: string;
  responseSchema: Record<string, unknown>;
  temperature?: number;
  maxOutputTokens?: number;
  requestTimeoutMs?: number;
  /** Parses + validates the raw response text into T. Throw on anything
   *  malformed/invalid -- that throw is what drives the repair-retry path. */
  parse: (text: string) => T;
  /** Invoked after every individual attempt (success or failure) so the
   *  caller can persist a live model-usage log without waiting for the
   *  whole call to finish. Never allowed to throw into the fallback loop --
   *  wrap your own persistence in try/catch if it can fail. */
  onAttempt?: (log: GeminiAttemptLog) => void | Promise<void>;
}

export interface CallGeminiWithFallbackResult<T> {
  data: T;
  modelUsed: string;
  attempts: GeminiAttemptLog[];
}

export async function callGeminiWithFallback<T>(
  opts: CallGeminiWithFallbackOptions<T>,
): Promise<CallGeminiWithFallbackResult<T>> {
  const attempts: GeminiAttemptLog[] = [];
  const temperature = opts.temperature ?? 0.4;
  const maxOutputTokens = opts.maxOutputTokens ?? 8192;
  const timeoutMs = opts.requestTimeoutMs ?? 45_000;

  const record = async (log: Omit<GeminiAttemptLog, "timestamp">) => {
    const full: GeminiAttemptLog = { ...log, timestamp: new Date().toISOString() };
    attempts.push(full);
    if (opts.onAttempt) {
      try {
        await opts.onAttempt(full);
      } catch {
        // Logging must never break the fallback loop itself.
      }
    }
  };

  for (const model of opts.models) {
    for (let attemptNumber = 1 as 1 | 2; attemptNumber <= 2; attemptNumber++) {
      const priorWasMalformed = attemptNumber === 2 && attempts.at(-1)?.model === model && attempts.at(-1)?.outcome === "malformed_output";
      const start = Date.now();

      let result: RawGeminiResult | null = null;
      let networkError: unknown = null;
      try {
        result = await rawGeminiCall({
          model,
          apiKey: opts.apiKey,
          systemInstruction: opts.systemInstruction,
          userContent: opts.userContent,
          responseSchema: opts.responseSchema,
          temperature,
          maxOutputTokens,
          timeoutMs,
          repairNote: priorWasMalformed ? REPAIR_NOTE : undefined,
        });
      } catch (err) {
        networkError = err;
      }
      const durationMs = Date.now() - start;

      if (networkError) {
        const isAbort = networkError instanceof Error && networkError.name === "AbortError";
        const kind: GeminiErrorKind = isAbort ? "timeout" : "network_error";
        await record({ model, attemptNumber, outcome: kind, message: String(networkError).slice(0, 300), durationMs });
        if (attemptNumber === 1) continue; // retry once on the same model
        break; // exhausted -> next model
      }

      const { status, text } = result!;

      if (status === 401 || status === 403) {
        await record({ model, attemptNumber, outcome: "auth_error", httpStatus: status, durationMs });
        throw new GeminiFatalError(
          `Gemini authentication failed (HTTP ${status}) on model ${model} -- check the API key, this is not a capacity issue.`,
          "auth_error",
          attempts,
        );
      }

      if (status === 400) {
        await record({ model, attemptNumber, outcome: "invalid_request", httpStatus: status, durationMs });
        throw new GeminiFatalError(
          `Gemini rejected the request as invalid (HTTP 400) on model ${model} -- this is a prompt/schema bug, not a capacity issue.`,
          "invalid_request",
          attempts,
        );
      }

      if (status === 404) {
        await record({ model, attemptNumber, outcome: "model_unavailable", httpStatus: status, durationMs });
        break; // no same-model retry -- a missing model won't reappear
      }

      if (status === 429) {
        await record({ model, attemptNumber, outcome: "rate_limited", httpStatus: status, durationMs });
        break; // no same-model retry -- move straight to the next model
      }

      if (status >= 500 || status < 200 || (status >= 300 && status < 400)) {
        // 5xx and any other unanticipated non-2xx are treated as transient server errors.
        await record({ model, attemptNumber, outcome: "server_error", httpStatus: status, durationMs });
        if (attemptNumber === 1) continue;
        break;
      }

      if (text === null) {
        await record({ model, attemptNumber, outcome: "malformed_output", httpStatus: status, message: "No text in response", durationMs });
        if (attemptNumber === 1) continue; // one repair retry
        break;
      }

      try {
        const data = opts.parse(text);
        await record({ model, attemptNumber, outcome: "success", httpStatus: status, durationMs });
        return { data, modelUsed: model, attempts };
      } catch (parseErr) {
        await record({
          model,
          attemptNumber,
          outcome: "malformed_output",
          httpStatus: status,
          message: String(parseErr).slice(0, 300),
          durationMs,
        });
        if (attemptNumber === 1) continue; // one repair retry
        break; // repair also failed -> next model
      }
    }
  }

  throw new GeminiAllModelsExhaustedError(attempts);
}
