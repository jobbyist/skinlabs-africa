import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  AssessmentApiError,
  createAdvancedAssessmentSession,
  getAdvancedAssessmentAccess,
  getAdvancedAssessmentSession,
  linkBasicAnalysisToSession,
  saveAdvancedAssessmentProgress,
  submitAdvancedAssessment,
} from "@/lib/assessment/client";
import { computeAssessmentCompleteness } from "@/lib/assessment/completeness";
import { trackSkynnEvent } from "@/lib/skynn/analytics";
import { buildAdvancedPrefill, type BasicAnalysisRow } from "@/lib/skynn/basicToAdvancedPrefill";
import { supabase } from "@/integrations/supabase/client";
import type {
  AdvancedAssessmentAccess,
  AdvancedAssessmentSession,
  AssessmentDefinitionSummary,
  SafetyScreenResult,
} from "@/lib/assessment/types";

/** Server-side access/entitlement check (section 18) — never trust a
 *  frontend-only guess at whether the member can start an assessment. */
export const useAdvancedAssessmentAccess = () => {
  const { user, loading: authLoading } = useAuth();
  const [access, setAccess] = useState<AdvancedAssessmentAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setAccess(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setAccess(await getAdvancedAssessmentAccess());
      setError(null);
    } catch (err) {
      setError(err instanceof AssessmentApiError ? err.message : "Couldn't check your access.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) void refresh();
  }, [authLoading, refresh]);

  return { access, loading: loading || authLoading, error, refresh };
};

const AUTOSAVE_DEBOUNCE_MS = 1200;

/**
 * Drives one Advanced Assessment session: create-or-resume, local answer
 * state with debounced autosave, submit, and the resulting report status.
 * The stored `responses` on the server is always replaced wholesale on
 * autosave (see save_advanced_assessment_progress in the core migration),
 * so this hook always sends the full accumulated answer set, never a delta.
 */
export const useAdvancedAssessment = (existingSessionId?: string) => {
  const [session, setSession] = useState<AdvancedAssessmentSession | null>(null);
  const [definition, setDefinition] = useState<AssessmentDefinitionSummary | null>(null);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const [safetyScreen, setSafetyScreen] = useState<SafetyScreenResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<{
    reportId: string;
    status: string;
    referenceNumber: string | null;
    processingMode: string | null;
  } | null>(null);

  /** Answers suggested from the member's Basic AI Skin Analysis (new sessions only). */
  const [prefill, setPrefill] = useState<PrefillState | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestResponses = useRef(responses);
  latestResponses.current = responses;

  const start = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (existingSessionId) {
        const { session: s, definition: d } = await getAdvancedAssessmentSession(existingSessionId);
        setSession(s);
        setDefinition(d);
        setResponses(s.responses ?? {});
        setCurrentSectionId(s.current_section_id ?? d.sections[0]?.id ?? null);
        const ids = (s as { prefilled_question_ids?: string[] | null }).prefilled_question_ids;
        if (ids?.length) setPrefill({ ids, basicAnalysisDate: "" });
      } else {
        const { session: s, definition: d } = await createAdvancedAssessmentSession();
        const seeded = await seedFromBasicAnalysis(s, d);
        setSession(seeded.session);
        setDefinition(d);
        setResponses(seeded.responses);
        setPrefill(seeded.prefill);
        setCurrentSectionId(d.sections[0]?.id ?? null);
      }
    } catch (err) {
      setError(err instanceof AssessmentApiError ? err.message : "Couldn't start the assessment.");
    } finally {
      setLoading(false);
    }
  }, [existingSessionId]);

  useEffect(() => {
    void start();
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingSessionId]);

  const persist = useCallback(async () => {
    if (!session) return;
    setSaving(true);
    try {
      const { session: updated, safetyScreen: screen } = await saveAdvancedAssessmentProgress(
        session.id,
        latestResponses.current,
        currentSectionId,
      );
      setSession(updated);
      setSafetyScreen(screen);
    } catch (err) {
      // Autosave failures are surfaced quietly — the user's local answers
      // are never lost client-side, and the next successful save catches up.
      console.warn("Advanced AI Dermatology Analysis autosave failed:", err);
    } finally {
      setSaving(false);
    }
  }, [session, currentSectionId]);

  const setAnswer = useCallback(
    (questionId: string, value: unknown) => {
      setResponses((prev) => {
        const next = { ...prev, [questionId]: value };
        return next;
      });
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => void persist(), AUTOSAVE_DEBOUNCE_MS);
    },
    [persist],
  );

  const goToSection = useCallback(
    (sectionId: string) => {
      setCurrentSectionId(sectionId);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      void persist();
    },
    [persist],
  );

  // The "check it still fits" hint goes away once the member changes the answer.
  const isPrefilled = useCallback(
    (questionId: string) => {
      if (!prefill?.ids.includes(questionId)) return false;
      const suggested = prefill.values?.[questionId];
      return suggested === undefined || JSON.stringify(suggested) === JSON.stringify(responses[questionId]);
    },
    [prefill, responses],
  );

  const completenessPct = definition ? computeAssessmentCompleteness(definition.sections, responses) : 0;

  const submit = useCallback(async () => {
    if (!session) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSubmitting(true);
    setError(null);
    trackSkynnEvent("skynn_advanced_submission_started", { mode: "advanced" });
    try {
      await persist();
      const result = await submitAdvancedAssessment(session.id);
      setSubmission({
        reportId: result.reportId,
        status: result.status,
        referenceNumber: result.referenceNumber ?? null,
        processingMode: result.processingMode ?? null,
      });
      if (result.status === "failed") {
        setError(result.errorMessage ?? "We couldn't generate your report this time.");
        trackSkynnEvent("skynn_advanced_submission_failed", { mode: "advanced", error_category: "submission_failed" });
      } else {
        const processingMode = result.processingMode === "fallback" ? "fallback" : "production";
        trackSkynnEvent("skynn_advanced_submission_succeeded", { mode: "advanced", processing_mode: processingMode });
        // Never the reference number itself — only that one was issued.
        if (result.referenceNumber) trackSkynnEvent("skynn_advanced_reference_created", { mode: "advanced", processing_mode: processingMode });
        if (processingMode === "fallback") trackSkynnEvent("skynn_advanced_pending", { mode: "advanced", processing_mode: processingMode });
      }
    } catch (err) {
      setError(err instanceof AssessmentApiError ? err.message : "Couldn't submit your assessment.");
      trackSkynnEvent("skynn_advanced_submission_failed", {
        mode: "advanced",
        error_category: err instanceof AssessmentApiError ? "submission_failed" : "network",
      });
    } finally {
      setSubmitting(false);
    }
  }, [session, persist]);

  return {
    session,
    definition,
    responses,
    currentSectionId,
    safetyScreen,
    completenessPct,
    loading,
    saving,
    submitting,
    submission,
    error,
    setAnswer,
    goToSection,
    submit,
    refresh: start,
    prefill,
    isPrefilled,
  };
};

/**
 * A new session starts from the member's latest saved Basic AI Skin Analysis:
 * suggested answers are saved straight away (the server recomputes
 * completeness) and the session records which analysis it came from. Any
 * failure just leaves an empty questionnaire.
 */
interface PrefillState {
  ids: string[];
  basicAnalysisDate: string;
  /** The suggested values, so a changed answer stops being flagged. Absent when reloaded from a saved session. */
  values?: Record<string, unknown>;
}

async function seedFromBasicAnalysis(
  session: AdvancedAssessmentSession,
  definition: AssessmentDefinitionSummary,
): Promise<{
  session: AdvancedAssessmentSession;
  responses: Record<string, unknown>;
  prefill: PrefillState | null;
}> {
  const empty = { session, responses: session.responses ?? {}, prefill: null };
  try {
    const { data } = await supabase
      .from("skincare_recommendations")
      .select("id, created_at, mst_tone, result_payload")
      .eq("user_id", session.user_id)
      .eq("status", "delivered")
      .not("result_payload", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return empty;
    const p = buildAdvancedPrefill(data as BasicAnalysisRow, definition);
    if (!p.prefilledIds.length) return empty;
    const { session: saved } = await saveAdvancedAssessmentProgress(session.id, p.responses, null);
    // The link is the provenance the reviewers and the PDF rely on: retry once,
    // and if it still fails say so rather than pretend it was recorded.
    const link = () => linkBasicAnalysisToSession(session.id, p.basicAnalysisId, p.prefilledIds);
    await link().catch(() => link()).catch((err) => console.warn("Recording the Basic analysis link failed:", err));
    trackSkynnEvent("skynn_advanced_prefill_applied", { mode: "advanced", count: p.prefilledIds.length });
    return {
      session: saved,
      responses: p.responses,
      prefill: { ids: p.prefilledIds, basicAnalysisDate: p.basicAnalysisDate, values: Object.fromEntries(p.prefilledIds.map((id) => [id, p.responses[id]])) },
    };
  } catch (err) {
    console.warn("Starting from the Basic AI Skin Analysis failed:", err);
    return empty;
  }
}
