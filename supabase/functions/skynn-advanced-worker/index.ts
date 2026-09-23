/**
 * SKYNN AI v2 — asynchronous Advanced AI Dermatology Report worker.
 *
 * Triggered every minute by the `skynn-advanced-worker` pg_cron job (only
 * when a pending report exists — see 20260923100000_skynn_v2_framework.sql),
 * and best-effort kicked by skynn-advanced-assessment's `submit` for lower
 * latency. Claims pending reports with a 5-minute lease, runs the
 * multi-model pipeline (_shared/assessment/pipeline/run.ts), persists every
 * stage as it completes, and finishes by HOLDING the report for human review
 * (complete_advanced_assessment_for_review) — it never releases a report to
 * its owner itself.
 *
 * Auth: an `x-cron-secret` header checked against the Vault secret
 * `skynn_worker_cron_secret` via verify_skynn_worker_secret() (using this
 * function's auto-injected service-role key, so no separately-set Edge
 * Function secret is needed), OR a signed-in admin's JWT for manual runs.
 * verify_jwt is off in config.toml because pg_cron sends no JWT.
 *
 * Wall clock: the pipeline stops starting new stages after TIME_BUDGET_MS
 * and releases its lease; the next tick resumes from the last saved stage.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { buildSanitizedProfile } from "../_shared/assessment/sanitize.ts";
import { AssessmentProviderError } from "../_shared/assessment/types.ts";
import { runPipeline, ENGINE_VERSION, PipelineStageError, type PipelineState, type PromptEntry } from "../_shared/assessment/pipeline/run.ts";
import { STAGE_ORDER, type StageRole } from "../_shared/assessment/pipeline/stages.ts";
import { generateSalt } from "../_shared/assessment/pipeline/userData.ts";
import { deriveTopicsV2, selectEvidenceV2, type EvidenceEntry } from "../_shared/assessment/pipeline/evidenceV2.ts";
import { callClaudeStructured, transportConfigured } from "../_shared/assessment/pipeline/claudeTransport.ts";

const TIME_BUDGET_MS = 100_000;
const MAX_JOBS_PER_RUN = 1;

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

// deno-lint-ignore no-explicit-any
type Admin = any;

async function authorised(req: Request, admin: Admin, supabaseUrl: string, anonKey: string): Promise<boolean> {
  const secret = req.headers.get("x-cron-secret");
  if (secret) {
    const { data } = await admin.rpc("verify_skynn_worker_secret", { p_secret: secret });
    if (data === true) return true;
  }
  const authHeader = req.headers.get("Authorization");
  // skynn-advanced-assessment's post-submit kick authenticates with the
  // project's own service-role key (never exposed to a browser).
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceKey && authHeader === `Bearer ${serviceKey}`) return true;
  if (authHeader?.startsWith("Bearer ")) {
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: claims } = await userClient.auth.getClaims(authHeader.slice(7));
    const uid = claims?.claims?.sub;
    if (uid) {
      const { data: isAdmin } = await admin.rpc("has_role", { _user_id: uid, _role: "admin" });
      return isAdmin === true;
    }
  }
  return false;
}

async function loadPrompts(admin: Admin): Promise<{ set: string; prompts: Record<StageRole, PromptEntry> }> {
  const { data: cfg } = await admin.from("skynn_advanced_assessment_config").select("active_prompt_set").eq("id", true).single();
  const set = cfg?.active_prompt_set as string | undefined;
  if (!set) throw new AssessmentProviderError("No active SKYNN prompt set is configured.", "not_configured");
  const { data: rows } = await admin
    .from("assessment_prompt_versions")
    .select("version, role, system_prompt, status, is_placeholder")
    .eq("prompt_set", set);
  const prompts = {} as Record<StageRole, PromptEntry>;
  for (const row of rows ?? []) {
    if (row.status === "active" && !row.is_placeholder && row.system_prompt) {
      prompts[row.role as StageRole] = { version: row.version, systemPrompt: row.system_prompt };
    }
  }
  for (const role of STAGE_ORDER) {
    if (!prompts[role]) throw new AssessmentProviderError(`Prompt set ${set} has no active ${role} prompt.`, "not_configured");
  }
  return { set, prompts };
}

async function loadEvidence(admin: Admin): Promise<EvidenceEntry[]> {
  const { data } = await admin
    .from("advanced_assessment_evidence")
    .select("citation_code, title, publisher, publication_year, url, pmid, doi, summary, topic_tags, source_type")
    .eq("verification_status", "verified")
    .not("citation_code", "is", null);
  return (data ?? []).map((r: Record<string, unknown>) => ({
    code: r.citation_code as string,
    title: r.title as string,
    publisher: (r.publisher as string) ?? null,
    year: (r.publication_year as number) ?? null,
    url: (r.url as string) ?? null,
    pmid: (r.pmid as string) ?? null,
    doi: (r.doi as string) ?? null,
    summary: r.summary as string,
    topic_tags: (r.topic_tags as string[]) ?? [],
    source_type: r.source_type as string,
  }));
}

async function processJob(admin: Admin, job: { report_id: string; session_id: string; user_id: string; pipeline_state: PipelineState | null }) {
  const { report_id: reportId, session_id: sessionId, user_id: userId } = job;

  const { data: session } = await admin
    .from("advanced_assessment_sessions")
    .select("responses, assessment_version")
    .eq("id", sessionId)
    .single();
  if (!session) throw new AssessmentProviderError("Session disappeared.", "upstream_error");

  const { data: profile } = await admin
    .from("profiles")
    .select("date_of_birth, city, province, subscription_status")
    .eq("user_id", userId)
    .maybeSingle();
  const tierRaw = String(profile?.subscription_status ?? "").toLowerCase();
  const sanitizedProfile = buildSanitizedProfile({
    dateOfBirth: profile?.date_of_birth ?? null,
    // City is dropped for the model (province is enough context for climate);
    // data minimisation per POPIA s10.
    city: null,
    province: profile?.province ?? null,
    membershipTier: tierRaw === "vip" ? "vip" : ["insider", "active", "premium"].includes(tierRaw) ? "insider" : tierRaw === "glow_lite" ? "glow_lite" : "explorer",
  });

  const responses = (session.responses ?? {}) as Record<string, unknown>;
  const { set: promptSet, prompts } = await loadPrompts(admin);
  const allEvidence = await loadEvidence(admin);
  const state: PipelineState = job.pipeline_state && job.pipeline_state.salt ? job.pipeline_state : { salt: generateSalt() };

  const mstRaw = Number(responses["mst_tone"]);
  const topics = deriveTopicsV2(responses, {
    mstTier: Number.isInteger(mstRaw) ? mstRaw : null,
    melasmaPresent: responses["pigment_patches_present"] === "yes",
    acnePresent: responses["acne_present"] === "yes",
    pigmentProne: ["dark_mark_weeks", "dark_mark_months"].includes(String(responses["bt_pn_marks_after_spots"])),
  });

  const result = await runPipeline(
    {
      sessionId,
      responses,
      profile: sanitizedProfile as unknown as Record<string, unknown>,
      prompts,
      evidence: selectEvidenceV2(allEvidence, topics),
      methodologyEvidence: allEvidence.filter((e) => e.topic_tags.includes("methodology")),
    },
    state,
    {
      callModel: async (spec, system, user) => {
        const r = await callClaudeStructured({
          task: spec.task,
          system,
          user,
          toolName: spec.toolName,
          toolDescription: spec.toolDescription,
          schema: spec.schema,
          maxTokens: spec.maxTokens,
        });
        console.log(`skynn-advanced-worker: ${spec.role} ok via ${r.model} (in=${r.usage.inputTokens} out=${r.usage.outputTokens})`);
        return { output: r.output, model: r.model };
      },
      saveState: async (s, stage) => {
        await admin.rpc("save_advanced_assessment_pipeline_state", { p_report_id: reportId, p_state: s, p_stage: stage, p_release: false });
      },
      now: () => Date.now(),
      timeBudgetMs: TIME_BUDGET_MS,
    },
  );

  if (result.status === "paused") {
    await admin.rpc("save_advanced_assessment_pipeline_state", {
      p_report_id: reportId, p_state: result.state, p_stage: "paused", p_release: true,
    });
    return { reportId, status: "paused" };
  }

  if (result.status === "rejected") {
    console.warn(`skynn-advanced-worker: report ${reportId} rejected: ${result.reason}`);
    await admin.rpc("save_advanced_assessment_pipeline_state", {
      p_report_id: reportId, p_state: result.state, p_stage: "rejected_by_qa", p_release: false,
    });
    await admin.rpc("fail_advanced_assessment_session", {
      p_session_id: sessionId,
      p_error_message: "We couldn't produce a report that met our quality and safety checks this time. Your Analysis Pass has been refunded.",
    });
    return { reportId, status: "rejected" };
  }

  const { report, models } = result;
  const { error } = await admin.rpc("complete_advanced_assessment_for_review", {
    p_report_id: reportId,
    p_report: report,
    p_markdown: report.markdown,
    p_email_summary: report.emailSummary,
    p_triage: report.triage.level,
    p_mst_tier: report.scores.mst.tier,
    p_scores: report.scores,
    p_qa_result: result.state.qa ?? null,
    p_models: models,
    p_confidence: report.confidence,
    p_prompt_set: promptSet,
    p_engine_version: ENGINE_VERSION,
    p_evidence_version: "2026.2",
  });
  if (error) throw new Error(`complete_advanced_assessment_for_review failed: ${error.message}`);
  return { reportId, status: "awaiting_review" };
}

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  if (!(await authorised(req, admin, supabaseUrl, anonKey))) return json(401, { error: "Unauthorized" });

  if (!transportConfigured()) {
    // Leave jobs pending (not failed) — a missing secret is an operator fix,
    // and failing would refund + email every member in the queue.
    console.error("skynn-advanced-worker: neither AI_GATEWAY_API_KEY nor ANTHROPIC_API_KEY is set; leaving jobs queued.");
    return json(503, { error: "AI transport not configured", code: "not_configured" });
  }

  const workerId = `w-${crypto.randomUUID().slice(0, 8)}`;
  const { data: jobs, error: claimError } = await admin.rpc("claim_advanced_assessment_jobs", { p_limit: MAX_JOBS_PER_RUN, p_worker: workerId });
  if (claimError) return json(500, { error: "claim failed" });

  const results: Array<Record<string, unknown>> = [];
  for (const job of jobs ?? []) {
    try {
      results.push(await processJob(admin, job));
    } catch (err) {
      const code = err instanceof AssessmentProviderError || err instanceof PipelineStageError ? err.code : "internal";
      console.error(`skynn-advanced-worker: job ${job.report_id} errored (${code}):`, err);
      if (code === "not_configured") {
        // Operator problem (prompt set missing): keep the job for later.
        await admin.rpc("save_advanced_assessment_pipeline_state", {
          p_report_id: job.report_id, p_state: job.pipeline_state ?? {}, p_stage: "blocked_not_configured", p_release: true,
        });
      } else {
        // Transient (rate limit, upstream 5xx, malformed output): release the
        // lease so the next tick retries from the last saved stage. The claim
        // RPC fails + refunds the job after 6 attempts.
        await admin.from("advanced_assessment_reports").update({ locked_at: null, locked_by: null }).eq("id", job.report_id);
      }
      results.push({ reportId: job.report_id, status: "error", code });
    }
  }

  return json(200, { ok: true, worker: workerId, processed: results.length, results });
});
