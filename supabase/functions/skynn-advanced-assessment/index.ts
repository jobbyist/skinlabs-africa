/**
 * SKYNN AI Advanced Dermatology Assessment Engine — API surface.
 *
 * Single edge function, action-routed (same convention as payfast-payment
 * and newsroom-sync in this repo, rather than one function per REST verb —
 * Supabase edge functions are one deployable per directory, so a JSON
 * `action` field is this codebase's existing way of exposing several
 * logical endpoints from one function).
 *
 * Architecture (see CLAUDE.md / this feature's design doc):
 *   Frontend -> this function -> entitlement/session RPCs (user-scoped
 *   client, RLS-honest) -> Claude provider (service-role client, reads the
 *   proprietary prompt + evidence) -> validated report -> persistence.
 *
 * The frontend never talks to advanced_assessment_* tables/RPCs directly —
 * every mutation goes through here, so the safety screen, evidence
 * selection and idempotency logic live in exactly one place. (The
 * underlying RPCs are still independently safe against a client calling
 * them directly — see the migration's RLS/column-grant comments — this is
 * defense in depth, not the only thing standing between a client and a bad
 * write.)
 *
 * verify_jwt is off (supabase/config.toml) and auth is checked manually
 * below, same as supabase/functions/skincare-ai/index.ts, so this function
 * can return a clean 401 JSON body instead of the platform's default.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { AssessmentProviderError, type AssessmentGenerationInput } from "../_shared/assessment/types.ts";
import { computeSafetyScreen } from "../_shared/assessment/safety.ts";
import { buildSanitizedProfile } from "../_shared/assessment/sanitize.ts";
import { normalizeAssessment, extractRoutineContext, deriveEvidenceTopics, type DefinitionSection } from "../_shared/assessment/normalize.ts";
import { selectEvidenceForTopics, validateCitedEvidence, type EvidenceRow } from "../_shared/assessment/evidence.ts";
import { loadActivePrompt } from "../_shared/assessment/promptRegistry.ts";
import { ClaudeAssessmentProvider } from "../_shared/assessment/claudeProvider.ts";
import { scanComplianceFlags, extractReportText } from "../_shared/assessment/compliance.ts";
import { mapPostgrestError, mapProviderErrorCode } from "../_shared/assessment/errors.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DAILY_SESSION_CREATE_LIMIT = 10;
const DAILY_SUBMIT_LIMIT = 5;

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function since24h(): string {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json(401, { error: "Unauthorized" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User-scoped — every call through this client is RLS-checked as the
    // real signed-in user, exactly like a direct browser call would be.
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    // Service-role — only for reading the proprietary prompt/evidence and
    // for the completion/failure RPCs that run after a request-scoped RPC
    // transaction has already committed (see the migration's comments on
    // fail_advanced_assessment_session / complete_advanced_assessment_session).
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: authError } = await supabaseAuth.auth.getClaims(token);
    if (authError || !claimsData?.claims?.sub) return json(401, { error: "Unauthorized" });
    const userId = claimsData.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const action = body?.action as string | undefined;

    switch (action) {
      case "access": {
        const { data: accessData, error } = await supabaseAuth.rpc("get_advanced_assessment_access");
        if (error) { const m = mapPostgrestError(error); return json(m.status, { error: m.message, code: m.code }); }
        const data = Array.isArray(accessData) ? accessData[0] : accessData;
        return json(200, {
          eligible: data.eligible,
          accessType: data.access_type,
          membershipTier: data.membership_tier,
          passesAvailable: data.passes_available,
          rolloutStage: data.rollout_stage,
        });
      }

      case "create_session": {
        const { count } = await supabaseAuth
          .from("advanced_assessment_sessions")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since24h());
        if ((count ?? 0) >= DAILY_SESSION_CREATE_LIMIT) {
          return json(429, { error: "You've reached today's limit for starting new assessments. Please try again tomorrow.", code: "rate_limited" });
        }

        const { data: sessionData, error } = await supabaseAuth.rpc("start_advanced_assessment_session");
        if (error) { const m = mapPostgrestError(error); return json(m.status, { error: m.message, code: m.code }); }
        // Matches this repo's existing convention for RPC results that may
        // be wrapped as an array (see runAdvancedAnalysisWithPass in
        // src/components/AIFormulator.tsx) rather than assuming shape.
        const session = Array.isArray(sessionData) ? sessionData[0] : sessionData;

        const { data: definition } = await supabaseAuth
          .from("assessment_definitions")
          .select("version, title, sections")
          .eq("id", (session as { assessment_definition_id: string }).assessment_definition_id)
          .single();

        return json(200, { session, definition });
      }

      case "get_session": {
        const sessionId = body?.sessionId as string | undefined;
        if (!sessionId) return json(400, { error: "sessionId is required" });

        const { data: session, error } = await supabaseAuth
          .from("advanced_assessment_sessions")
          .select("*")
          .eq("id", sessionId)
          .single();
        if (error || !session) return json(404, { error: "That assessment session could not be found." });

        const { data: definition } = await supabaseAuth
          .from("assessment_definitions")
          .select("version, title, sections")
          .eq("id", session.assessment_definition_id)
          .single();

        const { data: report } = await supabaseAuth
          .from("advanced_assessment_reports")
          .select("id, generation_status, error_message, generated_at")
          .eq("session_id", sessionId)
          .maybeSingle();

        return json(200, { session, definition, report: report ?? null });
      }

      case "update_session": {
        const sessionId = body?.sessionId as string | undefined;
        const responses = (body?.responses ?? {}) as Record<string, unknown>;
        const currentSectionId = (body?.currentSectionId ?? null) as string | null;
        if (!sessionId) return json(400, { error: "sessionId is required" });

        const safetyScreen = computeSafetyScreen(responses["safety_red_flags"] as string[] | undefined);

        const { data: updatedData, error } = await supabaseAuth.rpc("save_advanced_assessment_progress", {
          p_session_id: sessionId,
          p_responses: responses,
          p_current_section_id: currentSectionId,
          p_safety_screen: safetyScreen,
        });
        if (error) { const m = mapPostgrestError(error); return json(m.status, { error: m.message, code: m.code }); }
        const updated = Array.isArray(updatedData) ? updatedData[0] : updatedData;

        return json(200, { session: updated, safetyScreen });
      }

      case "submit": {
        const sessionId = body?.sessionId as string | undefined;
        if (!sessionId) return json(400, { error: "sessionId is required" });

        const { count: submitCount } = await supabaseAuth
          .from("advanced_assessment_sessions")
          .select("id", { count: "exact", head: true })
          .gte("submitted_at", since24h());
        if ((submitCount ?? 0) >= DAILY_SUBMIT_LIMIT) {
          return json(429, { error: "You've reached today's limit for submitting assessments. Please try again tomorrow.", code: "rate_limited" });
        }

        const { data: sessionRow } = await supabaseAuth
          .from("advanced_assessment_sessions")
          .select("responses")
          .eq("id", sessionId)
          .single();
        const safetyScreen = computeSafetyScreen((sessionRow?.responses as Record<string, unknown> | undefined)?.["safety_red_flags"] as string[] | undefined);

        const { data: submissionData, error: submitError } = await supabaseAuth.rpc("submit_advanced_assessment_session", {
          p_session_id: sessionId,
          p_safety_screen: safetyScreen,
        });
        if (submitError) { const m = mapPostgrestError(submitError); return json(m.status, { error: m.message, code: m.code }); }
        const submission = Array.isArray(submissionData) ? submissionData[0] : submissionData;

        const reportId = (submission as { report_id: string | null }).report_id;
        if (!reportId) return json(500, { error: "Could not start report generation." });

        const { data: reportRow } = await supabaseAuth
          .from("advanced_assessment_reports")
          .select("generation_status")
          .eq("id", reportId)
          .single();

        // Idempotent: only ever generate for a report still 'pending'. A
        // retried submit (network replay, double-click) for an
        // already-completed/failed report just returns its current state.
        if (reportRow?.generation_status !== "pending") {
          return json(200, { sessionId, reportId, status: reportRow?.generation_status ?? "unknown" });
        }

        await generateReport({ supabaseAuth, supabaseAdmin, userId, sessionId, safetyScreen });

        const { data: finalReport } = await supabaseAuth
          .from("advanced_assessment_reports")
          .select("generation_status, error_message")
          .eq("id", reportId)
          .single();

        return json(200, { sessionId, reportId, status: finalReport?.generation_status ?? "unknown", errorMessage: finalReport?.error_message ?? null });
      }

      case "status": {
        const sessionId = body?.sessionId as string | undefined;
        if (!sessionId) return json(400, { error: "sessionId is required" });
        const { data: session } = await supabaseAuth.from("advanced_assessment_sessions").select("status").eq("id", sessionId).single();
        const { data: report } = await supabaseAuth
          .from("advanced_assessment_reports")
          .select("id, generation_status, error_message")
          .eq("session_id", sessionId)
          .maybeSingle();
        return json(200, { sessionStatus: session?.status ?? null, report: report ?? null });
      }

      case "get_report": {
        const reportId = body?.reportId as string | undefined;
        const sessionId = body?.sessionId as string | undefined;
        let query = supabaseAuth.from("advanced_assessment_reports").select("*");
        query = reportId ? query.eq("id", reportId) : query.eq("session_id", sessionId ?? "");
        const { data: report, error } = await query.single();
        if (error || !report) return json(404, { error: "That report could not be found." });

        if (report.generation_status === "completed") {
          await supabaseAuth.from("advanced_assessment_events").insert({
            user_id: userId,
            session_id: report.session_id,
            event_type: "report_viewed",
            metadata: {},
          });
        }
        return json(200, { report });
      }

      case "list_reports": {
        const { data: reports, error } = await supabaseAuth
          .from("advanced_assessment_reports")
          .select("id, session_id, generation_status, generated_at, confidence, created_at")
          .order("created_at", { ascending: false });
        if (error) return json(500, { error: "Could not load your reports." });
        return json(200, { reports: reports ?? [] });
      }

      case "log_event": {
        const eventType = body?.eventType as string | undefined;
        const sessionId = (body?.sessionId ?? null) as string | null;
        const metadata = (body?.metadata ?? {}) as Record<string, unknown>;
        if (!eventType) return json(400, { error: "eventType is required" });
        // Client-triggered events only (report_viewed already logged above,
        // routine_handoff_clicked is the other legitimate client-side one) —
        // never a vector for raw content, since metadata here is only ever
        // small UI-state flags the frontend itself constructs.
        if (eventType !== "routine_handoff_clicked") return json(400, { error: "Unsupported event type for this action." });
        await supabaseAuth.from("advanced_assessment_events").insert({ user_id: userId, session_id: sessionId, event_type: eventType, metadata });
        return json(200, { ok: true });
      }

      default:
        return json(400, { error: "Unknown or missing action." });
    }
  } catch (error) {
    console.error("skynn-advanced-assessment error:", error);
    if (error instanceof AssessmentProviderError) {
      const mapped = mapProviderErrorCode(error.code);
      return json(mapped.status, { error: mapped.message, code: mapped.code });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return json(500, { error: "Something went wrong. Please try again.", code: "internal_error", detail: Deno.env.get("SKYNN_DEBUG") === "1" ? message : undefined });
  }
});

/**
 * Runs generation for a 'pending' report and persists the outcome. Kept
 * synchronous within the request (see section 21's "document the
 * limitation" fallback in the engine brief — this platform has no
 * background worker/queue infra to hand this off to). Structured so a
 * future move to an async worker only needs to call this same function from
 * a different trigger (e.g. a cron/webhook sweep over generation_status =
 * 'pending' reports) rather than a rewrite.
 */
async function generateReport(args: {
  // deno-lint-ignore no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAuth: any;
  // deno-lint-ignore no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any;
  userId: string;
  sessionId: string;
  safetyScreen: ReturnType<typeof computeSafetyScreen>;
}): Promise<void> {
  const { supabaseAuth, supabaseAdmin, userId, sessionId, safetyScreen } = args;

  try {
    await supabaseAdmin.rpc("mark_advanced_assessment_processing", { p_session_id: sessionId });
    await supabaseAuth.from("advanced_assessment_events").insert({ user_id: userId, session_id: sessionId, event_type: "generation_started", metadata: {} });

    const { data: session, error: sessionError } = await supabaseAuth
      .from("advanced_assessment_sessions")
      .select("responses, assessment_version, assessment_definition_id")
      .eq("id", sessionId)
      .single();
    if (sessionError || !session) throw new AssessmentProviderError("Session disappeared during generation.", "upstream_error");

    const { data: definition, error: defError } = await supabaseAuth
      .from("assessment_definitions")
      .select("sections")
      .eq("id", session.assessment_definition_id)
      .single();
    if (defError || !definition) throw new AssessmentProviderError("Assessment definition unavailable.", "not_configured");

    const { data: profile } = await supabaseAuth
      .from("profiles")
      .select("date_of_birth, city, province, subscription_status")
      .eq("user_id", userId)
      .maybeSingle();

    const membershipTierRaw = (profile?.subscription_status ?? "").toLowerCase();
    const membershipTier: "explorer" | "glow_lite" | "insider" | "vip" =
      membershipTierRaw === "vip" ? "vip" : ["insider", "active", "premium"].includes(membershipTierRaw) ? "insider" : membershipTierRaw === "glow_lite" ? "glow_lite" : "explorer";

    const sanitizedProfile = buildSanitizedProfile({
      dateOfBirth: profile?.date_of_birth ?? null,
      city: profile?.city ?? null,
      province: profile?.province ?? null,
      membershipTier,
    });

    const responses = (session.responses ?? {}) as Record<string, unknown>;
    const normalized = normalizeAssessment(definition.sections as DefinitionSection[], responses, session.assessment_version);
    const routineContext = extractRoutineContext(responses);
    const topics = deriveEvidenceTopics(responses);

    const { data: evidenceRows } = await supabaseAdmin
      .from("advanced_assessment_evidence")
      .select("id, title, publisher, source_type, url, publication_date, topic_tags")
      .eq("verification_status", "verified");
    const allowedEvidence = selectEvidenceForTopics((evidenceRows ?? []) as EvidenceRow[], topics);

    const promptOverride = Deno.env.get("SKYNN_SYSTEM_PROMPT_VERSION") || null;
    const activePrompt = await loadActivePrompt(supabaseAdmin, promptOverride);

    const provider = new ClaudeAssessmentProvider(activePrompt.systemPrompt, activePrompt.version);
    const input: AssessmentGenerationInput = {
      assessmentVersion: session.assessment_version,
      userProfile: sanitizedProfile,
      assessment: normalized,
      safetyContext: { screen: safetyScreen },
      evidence: allowedEvidence,
      routineContext,
    };

    const result = await provider.generateReport(input);

    const { valid: citedEvidence, fabricatedIds } = validateCitedEvidence(result.report.evidence ?? [], allowedEvidence);
    if (fabricatedIds.length > 0) {
      console.warn("skynn-advanced-assessment: model cited unknown evidence ids, stripped:", fabricatedIds);
    }

    const finalReport = {
      ...result.report,
      safetyFlags: safetyScreen, // always the deterministic screen, never the model's own
      evidence: citedEvidence, // always the server's own records, never fabricated
    };

    const complianceFlags = scanComplianceFlags(extractReportText(finalReport));
    if (complianceFlags.length > 0) {
      console.warn("skynn-advanced-assessment: compliance flags on generated report:", complianceFlags);
    }

    await supabaseAdmin.rpc("complete_advanced_assessment_session", {
      p_session_id: sessionId,
      p_report: finalReport,
      p_confidence: finalReport.confidence,
      p_safety_flags: safetyScreen,
      p_model: result.metadata.model,
      p_prompt_version: result.metadata.promptVersion,
      p_engine_version: result.metadata.engineVersion,
      p_evidence_version: "2026.1",
    });
    await supabaseAuth.from("advanced_assessment_events").insert({
      user_id: userId,
      session_id: sessionId,
      event_type: "generation_completed",
      metadata: { confidence: finalReport.confidence, complianceFlagCount: complianceFlags.length },
    });
  } catch (error) {
    const message = error instanceof AssessmentProviderError ? error.message : "We couldn't generate your report this time.";
    console.error("skynn-advanced-assessment generation failed:", error);
    await supabaseAdmin.rpc("fail_advanced_assessment_session", { p_session_id: sessionId, p_error_message: message });
  }
}
