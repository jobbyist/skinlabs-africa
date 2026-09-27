/**
 * Admin-side calls for SKYNN AI v2 human review (20260923100000_skynn_v2_
 * framework.sql). Every function here is a SECURITY DEFINER RPC that checks
 * has_role(auth.uid(), 'admin') itself, so a non-admin session gets a
 * 'forbidden' error no matter how it reaches these. The RPCs aren't in the
 * generated Supabase types yet, hence the single untyped call site.
 */
import { supabase } from "@/integrations/supabase/client";
import type { AdvancedDermatologyReportV2, AdvancedReportScores, AssessmentSection, ReportReviewStatus, Triage } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = (fn: string, args?: Record<string, unknown>) => (supabase as any).rpc(fn, args) as Promise<{ data: unknown; error: { message: string } | null }>;

export interface ReviewQueueRow {
  report_id: string;
  session_id: string;
  created_at: string;
  generated_at: string | null;
  review_status: ReportReviewStatus;
  triage: Triage | null;
  mst_tier: number | null;
  confidence: string | null;
  prompt_set: string | null;
  qa_attempts: number;
  regulatory_flags: string[];
  reviewed_at: string | null;
}

export interface ReviewDetail {
  report_id: string;
  session_id: string;
  review_status: ReportReviewStatus | null;
  generation_status: string;
  triage: Triage | null;
  mst_tier: number | null;
  confidence: string | null;
  report: (AdvancedDermatologyReportV2 & {
    review?: {
      qaViolations: string[];
      qaRedlines: string[];
      qaAttempts: number;
      regulatoryFlags: string[];
      strippedCitations: string[];
      injectionFlagged: boolean;
    };
  }) | null;
  rendered_markdown: string | null;
  email_summary: string | null;
  qa_result: { approved: boolean; violations: string[]; redlines: string[] } | null;
  scores: AdvancedReportScores | null;
  models: Record<string, string> | null;
  prompt_set: string | null;
  engine_version: string | null;
  generated_at: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  responses: Record<string, unknown> | null;
}

export interface PromptSignoff {
  prompt_set: string;
  definition_version: string;
  status: "pending_details" | "signed_off" | "revoked";
  dermatologist_name: string | null;
  hpcsa_number: string | null;
  approved_on: string | null;
  recorded_at: string | null;
  is_active: boolean;
}

const ERROR_COPY: Record<string, string> = {
  signoff_incomplete: "Record the dermatologist sign-off (name, HPCSA number, date) before releasing any report.",
  not_awaiting_review: "This report has already been reviewed.",
  invalid_hpcsa_number: "That doesn't look like an HPCSA registration number (e.g. MP0123456).",
  invalid_signoff_name: "Please enter the dermatologist's full name.",
  invalid_signoff_date: "The approval date can't be empty or in the future.",
  forbidden: "Your account doesn't have admin access.",
  not_retryable: "This submission is no longer pending, so it can't be changed here.",
  production_mode_required: "Switch report_mode to 'production' before handing submissions to the production pipeline.",
};

function unwrap<T>(res: { data: unknown; error: { message: string } | null }): T {
  if (res.error) throw new Error(ERROR_COPY[res.error.message] ?? res.error.message);
  return res.data as T;
}

export const listReviewQueue = async (status: ReportReviewStatus | null) =>
  unwrap<ReviewQueueRow[]>(await rpc("admin_list_advanced_assessment_reviews", { p_status: status }));

export const getReviewDetail = async (reportId: string) =>
  unwrap<ReviewDetail>(await rpc("admin_get_advanced_assessment_review", { p_report_id: reportId }));

export const submitReviewDecision = async (reportId: string, decision: "approve" | "reject", notes: string | null) =>
  unwrap<{ review_status: string; refunded: boolean }>(
    await rpc("admin_review_advanced_assessment", { p_report_id: reportId, p_decision: decision, p_notes: notes }),
  );

export const listPromptSignoffs = async () => unwrap<PromptSignoff[]>(await rpc("admin_get_prompt_signoffs"));

export const recordPromptSignoff = async (args: { promptSet: string; name: string; hpcsa: string; approvedOn: string; notes: string | null }) =>
  unwrap<null>(
    await rpc("admin_record_prompt_signoff", {
      p_prompt_set: args.promptSet,
      p_dermatologist_name: args.name,
      p_hpcsa_number: args.hpcsa,
      p_approved_on: args.approvedOn,
      p_notes: args.notes,
    }),
  );

// ---------------------------------------------------------------------------
// Advanced Reports (pre-approval intake + production), 20260927100000.
// ---------------------------------------------------------------------------
export type AdvancedReportAdminStatus =
  | "submitted" | "pending" | "processing" | "review_required" | "approved" | "released" | "rejected" | "failed";

export interface IntakeListRow {
  report_id: string;
  session_id: string;
  reference_number: string | null;
  user_id: string;
  user_email: string | null;
  submitted_at: string;
  status: AdvancedReportAdminStatus;
  processing_mode: "fallback" | "production";
  definition_version: string | null;
  access_type: string | null;
  pass_consumed: boolean;
  pdf_status: "pending" | "generated" | "failed" | null;
  internal_email_status: "pending" | "sent" | "failed" | "retrying" | null;
  internal_email_attempts: number;
  updated_at: string;
  total_count: number;
}

export interface IntakeDetail {
  report_id: string;
  session_id: string;
  reference_number: string | null;
  user_id: string;
  user_email: string | null;
  submitted_at: string;
  updated_at: string;
  processing_mode: "fallback" | "production";
  intake_status: AdvancedReportAdminStatus | null;
  generation_status: string;
  review_status: string | null;
  versions: { prompt_set: string | null; definition_version: string | null; scoring_version: string | null; evidence_version: string | null; engine_version: string | null };
  consent: { popia_special_info_consent?: string; popia_cross_border_consent?: string; recorded_at?: string } | null;
  access: { access_type: string | null; pass_consumed: boolean };
  scores: AdvancedReportScores | null;
  triage: { triage: Triage; categories: string[] } | null;
  pdf: { status: string | null; available: boolean; generated_at: string | null; error: string | null };
  email: { status: string | null; recipient: string | null; sent_at: string | null; attempts: number; last_attempt_at: string | null; error: string | null };
  intake_attempts: number;
  review_notes: string | null;
  report_mode: "disabled" | "fallback" | "production";
  responses: Record<string, unknown>;
  sections: AssessmentSection[];
}

export interface IntakeListFilters {
  status?: AdvancedReportAdminStatus | null;
  mode?: "fallback" | "production" | null;
  search?: string | null;
  from?: string | null;
  to?: string | null;
  limit?: number;
  offset?: number;
}

export const listAdvancedIntake = async (f: IntakeListFilters) =>
  unwrap<IntakeListRow[]>(
    await rpc("admin_list_advanced_intake", {
      p_status: f.status ?? null,
      p_mode: f.mode ?? null,
      p_search: f.search?.trim() || null,
      p_from: f.from ?? null,
      p_to: f.to ?? null,
      p_limit: f.limit ?? 50,
      p_offset: f.offset ?? 0,
    }),
  );

export const getAdvancedIntake = async (reportId: string) =>
  unwrap<IntakeDetail>(await rpc("admin_get_advanced_intake", { p_report_id: reportId }));

export const retryAdvancedIntake = async (reportId: string, what: "pdf" | "email" | "all") =>
  unwrap<null>(await rpc("admin_retry_advanced_intake", { p_report_id: reportId, p_what: what }));

export const rejectAdvancedIntake = async (reportId: string, notes: string | null) =>
  unwrap<{ refunded: boolean }>(await rpc("admin_reject_advanced_intake", { p_report_id: reportId, p_notes: notes }));

export const promoteAdvancedIntake = async (reportIds: string[] | null) =>
  unwrap<number>(await rpc("admin_promote_advanced_intake_to_production", { p_report_ids: reportIds }));
