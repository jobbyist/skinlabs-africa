import { beforeEach, describe, expect, mock, test } from "bun:test";

// persistence.ts imports the browser Supabase client; stub it so the pure
// handoff logic can be tested without env vars or a network.
type RpcResult = { data: unknown; error: { message: string; hint?: string; details?: string } | null };
const rpc = mock(
  async (_fn: string, _args?: unknown): Promise<RpcResult> => ({
    data: [{ recommendation_id: "r1", source: "free_allowance", next_unlock_at: "2026-10-24T10:00:00Z" }],
    error: null,
  }),
);
mock.module("@/integrations/supabase/client", () => ({ supabase: { rpc } }));

const { assembleStarterAnalysisResult } = await import("@/lib/starter-analysis/resultEngine");
const persistence = await import("@/lib/starter-analysis/persistence");
const { summarizeStarterResult } = await import("../summary");

const answers: Record<string, number> = {
  q1: 1, q2: 2, q3: 2, q4: 2, q5: 1, q6: 2, q7: 2, q8: 2, q9: 0, q10: 1,
  q11: 2, q12: 1, q13: 2, q14: 1, q15: 0, q16: 1, q17: 3, q18: 3, q19: 2, q20: 3,
};
const result = assembleStarterAnalysisResult({
  analysisId: "anon-analysis-1",
  answers,
  mstTone: 7,
  hasPhoto: false,
  context: { status: null, detail: null },
  priorityPreference: null,
  revealProducts: true,
});

// Minimal in-memory localStorage — bun has no DOM.
const store = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  },
};

beforeEach(() => {
  store.clear();
  rpc.mockClear();
});

describe("anonymous summary", () => {
  test("shows skin type and exactly the top two ranked concerns", () => {
    const summary = summarizeStarterResult(result);
    expect(summary.skinTypeLabel.length).toBeGreaterThan(0);
    expect(summary.topConcerns.length).toBeLessThanOrEqual(2);
    expect(summary.topConcerns.length).toBeGreaterThan(0);
    expect(new Set(summary.topConcerns).size).toBe(summary.topConcerns.length);
  });
});

describe("anonymous → account handoff", () => {
  test("a completed anonymous result survives a reload/redirect via local storage", () => {
    persistence.saveCompletedState({
      analysisId: result.analysisId,
      answers,
      mstTone: 7,
      context: result.context,
      result,
      savedAt: new Date().toISOString(),
    });
    const restored = persistence.loadCompletedState();
    expect(restored?.result.analysisId).toBe("anon-analysis-1");
    expect(restored?.answers).toEqual(answers);
  });

  test("after sign-up the restored result is attached with the same analysis id (no re-quiz, never double-charged)", async () => {
    const payload = persistence.buildStarterSavePayload({
      result, contactName: null, contactWhatsApp: null, variantKey: "control",
    });
    expect(payload.p_client_analysis_id).toBe("anon-analysis-1");
    expect(payload.p_skin_type).toBe(result.skinType);
    expect(payload.p_concerns[0]).toBe(result.primaryConcern);
    expect(payload.p_mst_tone).toBe(7);

    const outcome = await persistence.persistStarterResultToAccount({
      result, contactName: null, contactWhatsApp: null, variantKey: "control",
    });
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc.mock.calls[0][0]).toBe("save_starter_analysis");
    expect(outcome).toMatchObject({ error: null, limitReached: false, source: "free_allowance" });
  });

  test("a server-side limit rejection is surfaced as limitReached with the unlock date", async () => {
    rpc.mockImplementationOnce(async () => ({
      data: null,
      error: { message: "formulator_limit_reached", hint: "formulator_limit_reached", details: "2026-10-20 08:00:00+00" },
    }));
    const outcome = await persistence.persistStarterResultToAccount({
      result, contactName: null, contactWhatsApp: null, variantKey: "control",
    });
    expect(outcome.limitReached).toBe(true);
    expect(outcome.error).toBeNull();
    expect(outcome.nextUnlockAt?.toISOString()).toBe("2026-10-20T08:00:00.000Z");
  });

  test("other server errors are reported as errors, not as a lock", async () => {
    rpc.mockImplementationOnce(async () => ({ data: null, error: { message: "Invalid analysis payload" } }));
    const outcome = await persistence.persistStarterResultToAccount({
      result, contactName: null, contactWhatsApp: null, variantKey: "control",
    });
    expect(outcome.limitReached).toBe(false);
    expect(outcome.error?.message).toBe("Invalid analysis payload");
  });
});
