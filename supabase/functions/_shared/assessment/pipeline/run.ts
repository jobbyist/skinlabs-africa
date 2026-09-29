/**
 * SKYNN AI v2 orchestration (framework §3):
 *
 *   (1) deterministic input validation + PII minimisation
 *   (2) Haiku intake normaliser
 *   (3) Haiku safety screener — combined with a deterministic floor; a red
 *       flag short-circuits the reasoner into escalation-only mode
 *   (4) deterministic scoring (TypeScript, never the model)
 *   (5) Sonnet fairness calibrator, Sonnet reasoner, Sonnet writer
 *   (6) Opus compliance/QA gate — one redline revision, then reject
 *   (7) result handed back for persistence + mandatory human review
 *
 * Resumable: every completed stage's output is written to `state` and
 * persisted through deps.saveState() before the next stage starts, so a
 * worker that runs out of wall-clock time (or crashes) picks up from the
 * last completed stage on its next tick instead of re-spending tokens.
 *
 * Every external effect is injected (deps), so this module is pure logic and
 * unit-tested under bun with a mocked model call.
 */
import { computeDeterministicScores, type DeterministicScores } from "../scoring/index.ts";
import { computeDeterministicTriage, stricterTriage, type Triage } from "../safety.ts";
import { scanRegulatoryFlags } from "../compliance.ts";
import { applySalt, wrapUserData } from "./userData.ts";
import { validateAgainstSchema } from "./jsonSchema.ts";
import { filterCitationCodes, formatEvidenceForPrompt, type EvidenceEntry } from "./evidenceV2.ts";
import {
  STAGES,
  type FairnessOutput,
  type QaOutput,
  type SafetyTriageOutput,
  type SkinIntake,
  type SkinReportOutput,
  type StageRole,
  type StageSpec,
  type WriterOutput,
} from "./stages.ts";

export const ENGINE_VERSION = "2.0.0";
export const MAX_QA_ATTEMPTS = 2;

export const STANDARD_DISCLAIMER =
  "This report is AI-generated cosmetic skincare guidance from SKYNN AI (beta). It is not a medical diagnosis, " +
  "does not replace a consultation with a doctor or dermatologist, and was reviewed by the SkinLabs team before " +
  "release. Scores are based on your own answers. If you're worried about any spot, mole or change in your skin, " +
  "please see a doctor or dermatologist.";

const ESCALATION_MESSAGES: Record<string, string> = {
  suspected_malignancy:
    "Something you shared about a mole, spot, nail or sore should be looked at by a doctor or dermatologist soon. " +
    "Please book that visit — this report can't assess it, and we've kept your skincare guidance gentle in the meantime.",
  possible_infection:
    "Signs like spreading redness, pus, fever or worsening pain should be seen by a doctor promptly. " +
    "Please do that first — we've kept your skincare guidance gentle in the meantime.",
  severe_systemic:
    "What you described (such as deep painful breakouts, a widespread rash, blistering or signs of an allergic " +
    "reaction) is best managed with a doctor or dermatologist. Please see one — we've kept your skincare guidance gentle.",
  pregnancy_breastfeeding:
    "Because you're pregnant or breastfeeding, please check any active ingredient with your doctor or pharmacist " +
    "before using it. We've kept this report to a gentle, low-risk routine.",
  distress:
    "How you feel about your skin matters. If it's weighing on you, talking to someone can help — your GP, or the " +
    "South African Depression and Anxiety Group (SADAG, sadag.org), which offers free support.",
};

export interface PromptEntry {
  version: string;
  systemPrompt: string;
}

export interface PipelineState {
  salt: string;
  startedAt?: string;
  intake?: SkinIntake;
  safety?: SafetyTriageOutput;
  triage?: { level: Triage; categories: string[]; deterministic: string[] };
  scores?: DeterministicScores;
  fairness?: FairnessOutput;
  reasoner?: SkinReportOutput;
  strippedCitations?: string[];
  writer?: WriterOutput;
  regulatoryFlags?: string[];
  qa?: QaOutput;
  qaAttempts?: number;
  models?: Partial<Record<StageRole, string>>;
  completedStages?: StageRole[];
}

export interface PipelineInput {
  sessionId: string;
  responses: Record<string, unknown>;
  profile: Record<string, unknown>;
  prompts: Record<StageRole, PromptEntry>;
  evidence: EvidenceEntry[];
  methodologyEvidence: EvidenceEntry[];
}

export interface ModelCall {
  (spec: StageSpec, system: string, user: string): Promise<{ output: unknown; model: string }>;
}

export interface PipelineDeps {
  callModel: ModelCall;
  saveState: (state: PipelineState, completed: StageRole | "scores") => Promise<void>;
  now: () => number;
  /** Stop starting new stages after this many ms; resume next tick. */
  timeBudgetMs: number;
}

export interface FinalReportV2 {
  schemaVersion: 2;
  engineVersion: string;
  summary: string;
  skinProfile: { headline: string; keyTraits: string[]; baumannStyleType: string | null };
  scores: DeterministicScores;
  triage: { level: Triage; categories: string[]; message: string | null };
  fairness: FairnessOutput;
  routineAm: SkinReportOutput["routine_am"];
  routinePm: SkinReportOutput["routine_pm"];
  targetedActives: SkinReportOutput["targeted_actives"];
  lifestyle: SkinReportOutput["lifestyle"];
  whatToAvoid: string[];
  disclaimers: string[];
  confidence: SkinReportOutput["confidence"];
  uncertainties: string[];
  evidence: Array<Omit<EvidenceEntry, "topic_tags" | "summary">>;
  methodology: Array<Omit<EvidenceEntry, "topic_tags" | "summary">>;
  markdown: string;
  emailSummary: string;
  review: {
    qaViolations: string[];
    qaRedlines: string[];
    qaAttempts: number;
    regulatoryFlags: string[];
    strippedCitations: string[];
    injectionFlagged: boolean;
  };
}

export type PipelineResult =
  | { status: "complete"; report: FinalReportV2; state: PipelineState; models: Partial<Record<StageRole, string>> }
  | { status: "paused"; state: PipelineState }
  | { status: "rejected"; reason: string; state: PipelineState };

export class PipelineStageError extends Error {
  constructor(message: string, public stage: StageRole, public code: "invalid_response" | "not_configured") {
    super(message);
  }
}

function publicEvidence(e: EvidenceEntry) {
  const { topic_tags: _t, summary: _s, ...rest } = e;
  return rest;
}

async function runStage<T>(
  role: StageRole,
  input: PipelineInput,
  state: PipelineState,
  deps: PipelineDeps,
  user: string,
): Promise<T> {
  const spec = STAGES[role];
  const prompt = input.prompts[role];
  if (!prompt?.systemPrompt?.trim()) throw new PipelineStageError(`No active prompt for role ${role}`, role, "not_configured");
  const system = applySalt(prompt.systemPrompt, state.salt);

  let lastErrors: string[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    const repair = attempt === 0
      ? ""
      : `\n\nYour previous answer was not a valid \`${spec.toolName}\` call (${lastErrors.slice(0, 5).join("; ") || "no tool call"}). Call the tool again with a complete, valid object.`;
    let result: { output: unknown; model: string };
    try {
      result = await deps.callModel(spec, system, user + repair);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "invalid_response" && attempt === 0) {
        lastErrors = ["no tool call"];
        continue;
      }
      throw err;
    }
    const errors = validateAgainstSchema(spec.schema, result.output);
    if (errors.length === 0) {
      state.models = { ...(state.models ?? {}), [role]: result.model };
      return result.output as T;
    }
    lastErrors = errors;
  }
  throw new PipelineStageError(`Stage ${role} returned an invalid structure after one repair attempt.`, role, "invalid_response");
}

function markDone(state: PipelineState, role: StageRole) {
  state.completedStages = [...new Set([...(state.completedStages ?? []), role])];
}

function escalationMessage(categories: string[]): string | null {
  const order = ["suspected_malignancy", "possible_infection", "severe_systemic", "pregnancy_breastfeeding", "distress"];
  const msgs = order.filter((c) => categories.includes(c)).map((c) => ESCALATION_MESSAGES[c]);
  return msgs.length ? msgs.join("\n\n") : null;
}

function modelFacingAnswers(responses: Record<string, unknown>): Record<string, unknown> {
  // Consent answers are an SkinLabs-side gate, not skin data — never sent.
  const { popia_special_info_consent: _a, popia_cross_border_consent: _b, ...rest } = responses;
  return rest;
}

export function consentGiven(responses: Record<string, unknown>): boolean {
  return responses["popia_special_info_consent"] === "agree" && responses["popia_cross_border_consent"] === "agree";
}

export async function runPipeline(input: PipelineInput, state: PipelineState, deps: PipelineDeps): Promise<PipelineResult> {
  const start = deps.now();
  const outOfTime = () => deps.now() - start > deps.timeBudgetMs;
  state.startedAt ??= new Date(start).toISOString();

  // (1) Deterministic validation — the consent gate is also enforced by the
  // question library (required), this is defence in depth.
  if (!consentGiven(input.responses)) {
    return { status: "rejected", reason: "POPIA consent not recorded for this session.", state };
  }

  // (4, computed early — cheap, deterministic, and the safety floor needs
  // the acne grading)
  if (!state.scores) {
    state.scores = computeDeterministicScores(input.responses);
    await deps.saveState(state, "scores");
  }
  const scores = state.scores;

  // (2) Intake normaliser
  if (!state.intake) {
    if (outOfTime()) return { status: "paused", state };
    state.intake = await runStage<SkinIntake>("intake", input, state, deps, [
      "Normalise this SkinLabs questionnaire.",
      wrapUserData(state.salt, "questionnaire", { answers: modelFacingAnswers(input.responses), profile: input.profile }),
    ].join("\n\n"));
    markDone(state, "intake");
    await deps.saveState(state, "intake");
  }

  // (3) Safety screener + deterministic floor
  if (!state.safety || !state.triage) {
    if (outOfTime()) return { status: "paused", state };
    state.safety = await runStage<SafetyTriageOutput>("safety", input, state, deps, [
      "Screen this normalised intake for red flags.",
      wrapUserData(state.salt, "normalised_intake", {
        intake: state.intake,
        self_reported_red_flags: input.responses["safety_red_flags"] ?? [],
        lesion_notes: input.responses["lesion_notes"] ?? null,
        pregnancy_status: input.responses["pregnancy_status"] ?? null,
        skin_distress: input.responses["skin_distress"] ?? null,
      }),
    ].join("\n\n"));
    const floor = computeDeterministicTriage(input.responses, { nodularAcneReported: scores.acne.nodularReported });
    const level = stricterTriage(floor.triage, state.safety.triage);
    state.triage = {
      level,
      categories: [...new Set([...floor.categories, ...state.safety.categories])],
      deterministic: floor.categories,
    };
    markDone(state, "safety");
    await deps.saveState(state, "safety");
  }
  const triage = state.triage;

  // (5a) Fairness calibrator
  if (!state.fairness) {
    if (outOfTime()) return { status: "paused", state };
    const fairness = await runStage<FairnessOutput>("fairness", input, state, deps, [
      "Calibrate this assessment for skin tone.",
      wrapUserData(state.salt, "fairness_input", {
        intake: state.intake,
        self_reported_mst: scores.mst.tier,
        sun_response_context: scores.mst.sunResponse,
        pigment_patch_tracker: scores.melasmaTracker,
        ita_degrees: null,
      }),
    ].join("\n\n"));
    // MST is self-reported and authoritative — never overridden by a model.
    state.fairness = { ...fairness, mst_tier: scores.mst.tier };
    markDone(state, "fairness");
    await deps.saveState(state, "fairness");
  }

  const allowedCodes = new Set(input.evidence.map((e) => e.code));

  // (5b) Reasoner
  if (!state.reasoner) {
    if (outOfTime()) return { status: "paused", state };
    const report = await runStage<SkinReportOutput>("reasoner", input, state, deps, [
      "Produce the SkinReport for this member.",
      wrapUserData(state.salt, "normalised_intake", state.intake),
      "DETERMINISTIC SCORES (computed by SkinLabs from the member's own answers — authoritative, do not recompute):",
      JSON.stringify(scores, null, 2),
      `SAFETY SCREEN (authoritative — never contradict): triage="${triage.level}", categories=${JSON.stringify(triage.categories)}`,
      "FAIRNESS CALIBRATION:",
      JSON.stringify(state.fairness, null, 2),
      "APPROVED EVIDENCE (cite ONLY these codes; if none supports a claim, do not make it):",
      formatEvidenceForPrompt(input.evidence) || "(none available — make no efficacy claims)",
    ].join("\n\n"));

    const stripped: string[] = [];
    const clean = (codes: string[]) => {
      const r = filterCitationCodes(codes, allowedCodes);
      stripped.push(...r.stripped);
      return r.kept;
    };
    report.routine_am = report.routine_am.map((s) => ({ ...s, citations: clean(s.citations) }));
    report.routine_pm = report.routine_pm.map((s) => ({ ...s, citations: clean(s.citations) }));
    report.targeted_actives = report.targeted_actives.map((a) => ({ ...a, citations: clean(a.citations) }));
    report.lifestyle = report.lifestyle.map((l) => ({ ...l, citations: clean(l.citations) }));

    if (triage.level !== "clear") {
      // Escalation is enforced, not requested: the report can never omit it.
      report.escalation = {
        required: true,
        message: report.escalation?.message?.trim() ? report.escalation.message : escalationMessage(triage.categories),
      };
      // The safety prompt's rule: escalated reports carry no targeted actives.
      report.targeted_actives = [];
    }
    state.reasoner = report;
    state.strippedCitations = stripped;
    markDone(state, "reasoner");
    await deps.saveState(state, "reasoner");
  }

  // (5c) Writer, (6) QA — with one redline revision loop.
  while (!state.qa?.approved) {
    const attempts = state.qaAttempts ?? 0;
    if (attempts >= MAX_QA_ATTEMPTS) {
      return {
        status: "rejected",
        reason: `QA reviewer rejected the report ${attempts} times: ${(state.qa?.violations ?? []).slice(0, 5).join("; ")}`,
        state,
      };
    }

    if (!state.writer) {
      if (outOfTime()) return { status: "paused", state };
      const redlines = state.qa && !state.qa.approved
        ? ["QA REDLINES FROM THE PREVIOUS DRAFT (apply every one):", ...state.qa.redlines.map((r) => `- ${r}`), ...state.qa.violations.map((v) => `- Fix: ${v}`)].join("\n")
        : "";
      state.writer = await runStage<WriterOutput>("writer", input, state, deps, [
        "Render this validated SkinReport for the member.",
        "VALIDATED SKINREPORT JSON:",
        JSON.stringify(state.reasoner, null, 2),
        "DETERMINISTIC SCORES (show these exactly, with their labels — they are self-reported, not clinical gradings):",
        JSON.stringify(scores, null, 2),
        `ESCALATION NOTE: ${state.reasoner!.escalation.required ? state.reasoner!.escalation.message : "none"}`,
        "STANDARD DISCLAIMER BLOCK (include verbatim):",
        STANDARD_DISCLAIMER,
        redlines,
      ].filter(Boolean).join("\n\n"));
      state.regulatoryFlags = scanRegulatoryFlags(state.writer.markdown + "\n" + state.writer.email_summary);
      markDone(state, "writer");
      await deps.saveState(state, "writer");
    }

    if (outOfTime()) return { status: "paused", state };
    const qa = await runStage<QaOutput>("qa", input, state, deps, [
      "Review this drafted report before it can reach the member.",
      "DRAFT REPORT (Markdown):",
      state.writer.markdown,
      "EMAIL SUMMARY:",
      state.writer.email_summary,
      "STRUCTURED SKINREPORT (source of every claim):",
      JSON.stringify(state.reasoner, null, 2),
      `APPROVED EVIDENCE CODES: ${[...allowedCodes].join(", ") || "(none)"}`,
      `SAFETY TRIAGE: ${triage.level} ${JSON.stringify(triage.categories)}`,
      `MEMBER MST TIER: ${scores.mst.tier ?? "not provided"} (iron-oxide SPF indicated: ${scores.mst.ironOxideSpfIndicated})`,
      "AUTOMATED REGULATORY FINDINGS (deterministic keyword matches — judge each in context; a warning to AVOID something is fine):",
      JSON.stringify(state.regulatoryFlags ?? []),
    ].join("\n\n"));
    state.qa = qa;
    state.qaAttempts = attempts + 1;
    markDone(state, "qa");
    if (!qa.approved) state.writer = undefined; // next loop re-writes with redlines
    await deps.saveState(state, "qa");
  }

  const reasoner = state.reasoner!;
  const writer = state.writer!;
  const qa = state.qa!;
  const cited = new Set<string>();
  for (const list of [reasoner.routine_am, reasoner.routine_pm, reasoner.targeted_actives, reasoner.lifestyle]) {
    for (const item of list) item.citations.forEach((c) => cited.add(c));
  }

  const report: FinalReportV2 = {
    schemaVersion: 2,
    engineVersion: ENGINE_VERSION,
    summary: reasoner.summary,
    skinProfile: {
      headline: reasoner.skin_profile.headline,
      keyTraits: reasoner.skin_profile.key_traits,
      baumannStyleType: scores.baumannStyle.code,
    },
    scores,
    triage: { level: triage.level, categories: triage.categories, message: reasoner.escalation.required ? reasoner.escalation.message : null },
    fairness: state.fairness!,
    routineAm: reasoner.routine_am,
    routinePm: reasoner.routine_pm,
    targetedActives: reasoner.targeted_actives,
    lifestyle: reasoner.lifestyle,
    whatToAvoid: reasoner.what_to_avoid,
    disclaimers: [STANDARD_DISCLAIMER, ...reasoner.disclaimers.filter((d) => d.trim() && d !== STANDARD_DISCLAIMER)],
    confidence: reasoner.confidence,
    uncertainties: reasoner.uncertainties,
    evidence: input.evidence.filter((e) => cited.has(e.code)).map(publicEvidence),
    methodology: input.methodologyEvidence.map(publicEvidence),
    markdown: qa.final_report?.trim() ? qa.final_report : writer.markdown,
    emailSummary: writer.email_summary,
    review: {
      qaViolations: qa.violations,
      qaRedlines: qa.redlines,
      qaAttempts: state.qaAttempts ?? 1,
      regulatoryFlags: state.regulatoryFlags ?? [],
      strippedCitations: state.strippedCitations ?? [],
      injectionFlagged: Boolean(state.intake?.injection_flagged),
    },
  };

  return { status: "complete", report, state, models: state.models ?? {} };
}
