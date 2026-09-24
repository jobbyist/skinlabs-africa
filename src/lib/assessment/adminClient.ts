/**
 * Admin-side calls for SKYNN AI v2 human review (20260923100000_skynn_v2_
 * framework.sql). Every function here is a SECURITY DEFINER RPC that checks
 * has_role(auth.uid(), 'admin') itself, so a non-admin session gets a
 * 'forbidden' error no matter how it reaches these. The RPCs aren't in the
 * generated Supabase types yet, hence the single untyped call site.
 */
import { supabase } from "@/integrations/supabase/client";
import type { AdvancedDermatologyReportV2, AdvancedReportScores, ReportReviewStatus, Triage } from "./types";

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
