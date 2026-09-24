/**
 * Safe, user-facing error mapping (section 22). Every RPC/provider failure
 * this engine can produce is mapped here to a stable code, an HTTP status,
 * and a message that never repeats a raw Postgres/provider error string
 * back to the client. Full detail is still `console.error`-logged
 * server-side (Supabase edge function logs) for debugging.
 */
export interface AssessmentApiError {
  status: number;
  code: string;
  message: string;
}

// Keyed by the literal RAISE EXCEPTION message text from the SQL functions
// (supabase/migrations/20260916164921_advanced_assessment_engine_core.sql),
// which PostgREST surfaces verbatim as error.message — more specific and
// more useful to the client than the shared ERRCODEs a few of these
// deliberately reuse (e.g. not_eligible and insufficient_passes both raise
// 42501, but need different user-facing copy).
const PG_MESSAGE_MAP: Record<string, AssessmentApiError> = {
  not_eligible: { status: 403, code: "not_eligible", message: "You need an Analysis Pass or an eligible membership to start or submit this assessment." },
  insufficient_passes: { status: 402, code: "insufficient_passes", message: "You don't have an Analysis Pass available. Purchase one to continue." },
  assessment_not_configured: { status: 503, code: "not_configured", message: "The Advanced Assessment isn't available yet. Please check back soon." },
  session_not_found: { status: 404, code: "not_found", message: "That assessment session could not be found." },
  session_not_editable: { status: 409, code: "not_editable", message: "This assessment can no longer be edited." },
  assessment_incomplete: { status: 422, code: "incomplete", message: "Please complete all required questions before submitting." },
  consent_required: { status: 422, code: "consent_required", message: "We need your consent to process your skin information before we can create your report." },
};

const PG_CODE_MAP: Record<string, AssessmentApiError> = {
  "42501": { status: 403, code: "forbidden", message: "You don't have access to do that." },
  "P0001": { status: 503, code: "not_configured", message: "The Advanced Assessment isn't available yet. Please check back soon." },
  "P0002": { status: 404, code: "not_found", message: "That assessment session could not be found." },
  "22023": { status: 422, code: "incomplete", message: "Please complete all required questions before submitting." },
};

const PROVIDER_ERROR_MAP: Record<string, AssessmentApiError> = {
  not_configured: { status: 503, code: "not_configured", message: "The Advanced Assessment isn't available yet. Please check back soon." },
  rate_limited: { status: 429, code: "rate_limited", message: "SKYNN is receiving a lot of requests right now — please try again in a moment." },
  invalid_response: { status: 502, code: "generation_failed", message: "We couldn't generate your report this time. Please try again." },
  upstream_error: { status: 502, code: "generation_failed", message: "We couldn't generate your report this time. Please try again." },
  timeout: { status: 504, code: "timeout", message: "Generating your report took too long. Please try again." },
};

export function mapPostgrestError(error: { code?: string; message?: string } | null | undefined): AssessmentApiError {
  const msg = (error?.message ?? "").trim();
  if (msg && PG_MESSAGE_MAP[msg]) return PG_MESSAGE_MAP[msg];
  if (error?.code && PG_CODE_MAP[error.code]) return PG_CODE_MAP[error.code];
  return { status: 500, code: "internal_error", message: "Something went wrong. Please try again." };
}

export function mapProviderErrorCode(code: string): AssessmentApiError {
  return PROVIDER_ERROR_MAP[code] ?? { status: 500, code: "internal_error", message: "Something went wrong generating your report." };
}
