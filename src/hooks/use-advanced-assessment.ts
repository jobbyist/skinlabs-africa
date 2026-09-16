import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  AssessmentApiError,
  createAdvancedAssessmentSession,
  getAdvancedAssessmentAccess,
  getAdvancedAssessmentSession,
  saveAdvancedAssessmentProgress,
  submitAdvancedAssessment,
} from "@/lib/assessment/client";
import { computeAssessmentCompleteness } from "@/lib/assessment/completeness";
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
  const [submission, setSubmission] = useState<{ reportId: string; status: string } | null>(null);

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
      } else {
        const { session: s, definition: d } = await createAdvancedAssessmentSession();
        setSession(s);
        setDefinition(d);
        setResponses({});
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
      console.warn("Advanced Assessment autosave failed:", err);
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

  const completenessPct = definition ? computeAssessmentCompleteness(definition.sections, responses) : 0;

  const submit = useCallback(async () => {
    if (!session) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSubmitting(true);
    setError(null);
    try {
      await persist();
      const result = await submitAdvancedAssessment(session.id);
      setSubmission({ reportId: result.reportId, status: result.status });
      if (result.status === "failed") {
        setError(result.errorMessage ?? "We couldn't generate your report this time.");
      }
    } catch (err) {
      setError(err instanceof AssessmentApiError ? err.message : "Couldn't submit your assessment.");
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
  };
};
