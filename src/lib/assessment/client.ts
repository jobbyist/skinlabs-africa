/**
 * Thin client for the skynn-advanced-assessment edge function — the only
 * way the frontend talks to the Advanced Assessment engine (see that
 * function's own header comment). Every call is action-routed through a
 * single POST body, matching this repo's existing convention for
 * multi-endpoint edge functions (payfast-payment, newsroom-sync).
 */
import { supabase } from "@/integrations/supabase/client";
import type {
  AdvancedAssessmentAccess,
  AdvancedAssessmentReportRow,
  AdvancedAssessmentSession,
  AssessmentDefinitionSummary,
  SafetyScreenResult,
} from "./types";

export class AssessmentApiError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
  }
}

/**
 * supabase-js does not automatically surface a non-2xx edge function
 * response body as `data` — it comes back as a FunctionsHttpError whose
 * `.context` is the raw Response. This extracts the safe {error, code}
 * body the edge function always sends (see errors.ts server-side) so the
 * UI can show SKYNN's actual message ("You've reached today's limit...")
 * instead of a generic fallback, while still degrading gracefully if the
 * body can't be read.
 */
async function extractEdgeError(error: unknown): Promise<AssessmentApiError> {
  const withContext = error as { context?: Response; message?: string };
  if (withContext?.context && typeof withContext.context.json === "function") {
    try {
      const body = await withContext.context.clone().json();
      if (body?.error) return new AssessmentApiError(body.error, body.code);
    } catch {
      // fall through to generic
    }
  }
  return new AssessmentApiError("Something went wrong — please try again.");
}

async function invoke<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke("skynn-advanced-assessment", {
    body: { action, ...payload },
  });
  if (error) throw await extractEdgeError(error);
  if (data?.error) throw new AssessmentApiError(data.error, data.code);
  return data as T;
}

export const getAdvancedAssessmentAccess = () => invoke<AdvancedAssessmentAccess>("access");

export const createAdvancedAssessmentSession = () =>
  invoke<{ session: AdvancedAssessmentSession; definition: AssessmentDefinitionSummary }>("create_session");

export const getAdvancedAssessmentSession = (sessionId: string) =>
  invoke<{ session: AdvancedAssessmentSession; definition: AssessmentDefinitionSummary; report: { id: string; generation_status: string } | null }>(
    "get_session",
    { sessionId },
  );

export const saveAdvancedAssessmentProgress = (sessionId: string, responses: Record<string, unknown>, currentSectionId: string | null) =>
  invoke<{ session: AdvancedAssessmentSession; safetyScreen: SafetyScreenResult }>("update_session", {
    sessionId,
    responses,
    currentSectionId,
  });

export const submitAdvancedAssessment = (sessionId: string) =>
  invoke<{ sessionId: string; reportId: string; status: string; errorMessage: string | null }>("submit", { sessionId });

export const getAdvancedAssessmentStatus = (sessionId: string) =>
  invoke<{ sessionStatus: string | null; report: { id: string; generation_status: string; error_message: string | null } | null }>("status", {
    sessionId,
  });

export const getAdvancedAssessmentReport = (params: { reportId?: string; sessionId?: string }) =>
  invoke<{ report: AdvancedAssessmentReportRow }>("get_report", params);

export const listAdvancedAssessmentReports = () => invoke<{ reports: AdvancedAssessmentReportRow[] }>("list_reports");

export const logRoutineHandoffClicked = (sessionId: string) =>
  invoke<{ ok: boolean }>("log_event", { eventType: "routine_handoff_clicked", sessionId });
