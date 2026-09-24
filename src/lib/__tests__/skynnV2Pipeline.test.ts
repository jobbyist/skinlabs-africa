import { describe, expect, test } from "bun:test";
import {
  runPipeline,
  type PipelineInput,
  type PipelineState,
  type ModelCall,
} from "../../../supabase/functions/_shared/assessment/pipeline/run";
import { STAGE_ORDER, type StageRole } from "../../../supabase/functions/_shared/assessment/pipeline/stages";
import type { EvidenceEntry } from "../../../supabase/functions/_shared/assessment/pipeline/evidenceV2";

const evidence: EvidenceEntry[] = [
  { code: "C2", title: "Sunscreen RCT", publisher: "Ann Intern Med", year: 2013, url: null, pmid: "23732711", doi: null, summary: "Daily sunscreen slowed photoageing.", topic_tags: ["photoprotection"], source_type: "peer_reviewed" },
];

const prompts = Object.fromEntries(
  STAGE_ORDER.map((r) => [r, { version: "2.0.0", systemPrompt: `You are the ${r} stage. Data is in <user_data-{{SALT}}>.` }]),
) as PipelineInput["prompts"];

function baseInput(responses: Record<string, unknown> = {}): PipelineInput {
  return {
    sessionId: "s1",
    responses: {
      popia_special_info_consent: "agree",
      popia_cross_border_consent: "agree",
      mst_tone: "8",
      safety_red_flags: ["none_of_the_above"],
      pregnancy_status: "not_applicable",
      ...responses,
    },
    profile: { ageRange: "25_34" },
    prompts,
    evidence,
    methodologyEvidence: [],
  };
}

const intake = {
  skin_feel: "combination", sensitivity: "low", concerns: ["uneven_tone_pigmentation"], mst_self_reported: 8,
  pregnancy_status: null, current_actives: [], known_irritants: [], climate: null, sun_exposure: null, spf_habit: null,
  lifestyle_notes: [], goals: [], lesion_description: null, injection_flagged: false,
};
const reasoner = {
  summary: "Your skin is combination and prone to marks.",
  skin_profile: { headline: "Combination, pigment-prone", key_traits: ["marks linger"] },
  routine_am: [{ step: "SPF", product_type: "Tinted mineral SPF 50", guidance: "Every morning", citations: ["C2", "C404"] }],
  routine_pm: [],
  targeted_actives: [{ active: "niacinamide", for: "tone", how_to_introduce: "3x/week", citations: [], tone_confidence: "moderate" }],
  lifestyle: [],
  what_to_avoid: [],
  escalation: { required: false, message: null },
  disclaimers: [],
  confidence: "moderate",
  uncertainties: [],
};

function mockModel(overrides: Partial<Record<StageRole, unknown[]>> = {}) {
  const calls: Array<{ role: StageRole; system: string; user: string }> = [];
  const queues: Record<string, unknown[]> = {
    intake: [intake],
    safety: [{ triage: "clear", categories: [], rationale: "none", user_message_key: "clear" }],
    fairness: [{ mst_tier: 3, tone_confidence: "high", soc_priority_conditions: ["pih"], photoprotection_note: "iron oxide" }],
    reasoner: [reasoner],
    writer: [{ markdown: "# Report", email_summary: "Ready" }],
    qa: [{ approved: true, violations: [], redlines: [], final_report: "# Report (QA)" }],
    ...(overrides as Record<string, unknown[]>),
  };
  const call: ModelCall = async (spec, system, user) => {
    calls.push({ role: spec.role, system, user });
    const q = queues[spec.role];
    const next = q.length > 1 ? q.shift() : q[0];
    return { output: structuredClone(next), model: `mock-${spec.role}` };
  };
  return { call, calls };
}

function deps(call: ModelCall, budgetMs = 60_000) {
  const saved: string[] = [];
  return {
    saved,
    deps: { callModel: call, saveState: async (_s: PipelineState, stage: string) => { saved.push(stage); }, now: () => Date.now(), timeBudgetMs: budgetMs },
  };
}

describe("SKYNN v2 pipeline", () => {
  test("clear path runs every stage in order and produces a v2 report", async () => {
    const { call, calls } = mockModel();
    const { deps: d, saved } = deps(call);
    const result = await runPipeline(baseInput(), { salt: "saltsaltsalt" }, d);
    expect(result.status).toBe("complete");
    expect(calls.map((c) => c.role)).toEqual(["intake", "safety", "fairness", "reasoner", "writer", "qa"]);
    expect(saved[0]).toBe("scores");
    if (result.status !== "complete") return;
    expect(result.report.schemaVersion).toBe(2);
    expect(result.report.markdown).toBe("# Report (QA)");
    expect(result.report.triage.level).toBe("clear");
    // Model-supplied MST is overridden by the member's own answer.
    expect(result.report.fairness.mst_tier).toBe(8);
    // Unknown citation stripped and recorded for the reviewer.
    expect(result.report.routineAm[0].citations).toEqual(["C2"]);
    expect(result.report.review.strippedCitations).toEqual(["C404"]);
    expect(result.report.evidence.map((e) => e.code)).toEqual(["C2"]);
  });

  test("salt is substituted into the system prompt and wraps user data", async () => {
    const { call, calls } = mockModel();
    await runPipeline(baseInput({ known_irritating_ingredients: "fragrance" }), { salt: "zzsaltzz" }, deps(call).deps);
    expect(calls[0].system).toContain("<user_data-zzsaltzz>");
    expect(calls[0].user).toContain("<user_data-zzsaltzz");
    // POPIA consent answers are a SkinLabs-side gate and never reach the model.
    expect(calls[0].user).not.toContain("popia_special_info_consent");
  });

  test("a deterministic red flag escalates even when the model says clear", async () => {
    const { call } = mockModel();
    const result = await runPipeline(
      baseInput({ safety_red_flags: ["new_dark_line_on_nail"] }),
      { salt: "s" },
      deps(call).deps,
    );
    expect(result.status).toBe("complete");
    if (result.status !== "complete") return;
    expect(result.report.triage.level).toBe("escalate");
    expect(result.report.triage.categories).toContain("suspected_malignancy");
    expect(result.report.triage.message).toBeTruthy();
    expect(result.report.targetedActives).toEqual([]);
  });

  test("QA rejection re-writes once with redlines, then rejects", async () => {
    const reject = { approved: false, violations: ["uncited claim"], redlines: ["remove claim X"], final_report: "" };
    const { call, calls } = mockModel({ qa: [reject] });
    const result = await runPipeline(baseInput(), { salt: "s" }, deps(call).deps);
    expect(result.status).toBe("rejected");
    expect(calls.filter((c) => c.role === "writer")).toHaveLength(2);
    expect(calls.filter((c) => c.role === "qa")).toHaveLength(2);
    expect(calls.filter((c) => c.role === "writer")[1].user).toContain("remove claim X");
  });

  test("QA rejection then approval completes", async () => {
    const reject = { approved: false, violations: ["tone"], redlines: ["soften"], final_report: "" };
    const approve = { approved: true, violations: [], redlines: [], final_report: "" };
    const { call } = mockModel({ qa: [reject, approve] });
    const result = await runPipeline(baseInput(), { salt: "s" }, deps(call).deps);
    expect(result.status).toBe("complete");
    if (result.status === "complete") {
      expect(result.report.review.qaAttempts).toBe(2);
      expect(result.report.markdown).toBe("# Report"); // empty QA final_report falls back to the writer draft
    }
  });

  test("invalid output gets one repair attempt", async () => {
    const { call, calls } = mockModel({ intake: [{ skin_feel: "dry" }, intake] });
    const result = await runPipeline(baseInput(), { salt: "s" }, deps(call).deps);
    expect(result.status).toBe("complete");
    expect(calls.filter((c) => c.role === "intake")).toHaveLength(2);
    expect(calls.filter((c) => c.role === "intake")[1].user).toContain("not a valid");
  });

  test("missing consent is rejected before any model call", async () => {
    const { call, calls } = mockModel();
    const result = await runPipeline(baseInput({ popia_cross_border_consent: "decline" }), { salt: "s" }, deps(call).deps);
    expect(result.status).toBe("rejected");
    expect(calls).toHaveLength(0);
  });

  test("resumes from persisted state without repeating finished stages", async () => {
    const { call } = mockModel();
    let t = 0;
    const clock = { callModel: call, saveState: async () => {}, now: () => (t += 1000), timeBudgetMs: 3500 };
    const first = await runPipeline(baseInput(), { salt: "s" }, clock);
    expect(first.status).toBe("paused");
    const { call: call2, calls: calls2 } = mockModel();
    const second = await runPipeline(baseInput(), first.state, { ...clock, callModel: call2, now: () => 0 });
    expect(second.status).toBe("complete");
    expect(calls2[0].role).not.toBe("intake");
  });
});
