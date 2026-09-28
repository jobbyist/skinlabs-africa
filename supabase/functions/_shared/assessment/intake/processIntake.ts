/**
 * Pre-approval intake job (Deno only): for one claimed fallback submission,
 * compute the deterministic scores (no AI), render + store the intake PDF in
 * the private `skynn-advanced-intake` bucket, and email it to
 * reports@skinlabs.co.za through send-email. Each step records its own
 * outcome via record_advanced_intake_result(), so a PDF or email failure is
 * retried with backoff and never loses the submission.
 *
 * Never calls an AI provider and never needs an Anthropic key.
 */
import { jsPDF } from "https://esm.sh/jspdf@4.2.1?target=deno";

import { computeDeterministicScores } from "../scoring/index.ts";
import { computeDeterministicTriage } from "../safety.ts";
import { formatResponses, formatSast, summariseScores, summariseTriage, type IntakeSection } from "./format.ts";
import { buildIntakePdf } from "./intakePdf.ts";
import { buildInternalIntakeEmail, INTAKE_RECIPIENT } from "./internalEmail.ts";
import { BASIC_NAME, SKYNN_FEATURE_VERSION, SKYNN_RELEASE_LABEL } from "../../skynn/terminology.ts";

export const INTAKE_BUCKET = "skynn-advanced-intake";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- deno-lint-ignore no-explicit-any
type Admin = any;

export interface IntakeJob {
  report_id: string;
  session_id: string;
  user_id: string;
  reference_number: string;
  submitted_at: string | null;
  pdf_status: string | null;
  pdf_storage_path: string | null;
  internal_email_status: string | null;
  intake_attempts: number;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function safeError(err: unknown): string {
  return (err instanceof Error ? err.message : String(err)).slice(0, 300);
}

export async function processIntakeJob(admin: Admin, job: IntakeJob, env: { supabaseUrl: string; serviceKey: string }) {
  const reportId = job.report_id;

  const { data: report } = await admin
    .from("advanced_assessment_reports")
    .select("prompt_set, definition_version, scoring_version, evidence_version, consent_snapshot, internal_email_attempts, processing_mode, intake_status")
    .eq("id", reportId)
    .single();
  // Withdrawn/promoted between claim and now: nothing to do.
  if (!report || report.processing_mode !== "fallback" || report.intake_status !== "pending") {
    return { reportId, status: "skipped" };
  }

  const { data: session } = await admin
    .from("advanced_assessment_sessions")
    .select("responses, assessment_definition_id, access_type, pass_transaction_id, engine_version, basic_analysis_id, prefilled_question_ids")
    .eq("id", job.session_id)
    .single();
  if (!session) {
    await admin.rpc("record_advanced_intake_result", { p_report_id: reportId, p_pdf_error: "session_missing" });
    return { reportId, status: "error", step: "session" };
  }
  const { data: definition } = await admin
    .from("assessment_definitions")
    .select("sections")
    .eq("id", session.assessment_definition_id)
    .single();
  const { data: userData } = await admin.auth.admin.getUserById(job.user_id);
  const userEmail: string | null = userData?.user?.email ?? null;

  const responses = (session.responses ?? {}) as Record<string, unknown>;
  const scores = computeDeterministicScores(responses);
  const triage = computeDeterministicTriage(responses, { nodularAcneReported: scores.acne.nodularReported });

  const submittedAt = formatSast(job.submitted_at);
  const versions: Array<[string, string]> = [
    ["Prompt set", report.prompt_set ?? "—"],
    ["Questionnaire version", report.definition_version ?? "—"],
    ["Scoring rules version", report.scoring_version ?? "—"],
    ["Evidence catalogue version", report.evidence_version ?? "—"],
    ["Engine", `SKYNN AI v${session.engine_version ?? "2.0.0"} (beta)`],
    ["Release", `${SKYNN_RELEASE_LABEL} (${SKYNN_FEATURE_VERSION})`],
  ];
  // Started from the member's Basic AI Skin Analysis? (Suggested answers the
  // member could check and change; nothing forces a change.)
  if (session.basic_analysis_id) {
    const { data: basic } = await admin
      .from("skincare_recommendations")
      .select("created_at")
      .eq("id", session.basic_analysis_id)
      .maybeSingle();
    const count = Array.isArray(session.prefilled_question_ids) ? session.prefilled_question_ids.length : 0;
    versions.push([
      "Started from",
      `${BASIC_NAME} of ${basic?.created_at ? formatSast(basic.created_at) : "an earlier date"} (${count} suggested answer${count === 1 ? "" : "s"}, which the member could check and change)`,
    ]);
  }
  const accessText = session.access_type === "analysis_pass"
    ? `Analysis Pass${session.pass_transaction_id ? " (1 pass consumed at submission)" : ""}`
    : String(session.access_type ?? "—");

  // ---- PDF ----
  let pdfBytes: Uint8Array | null = null;
  let pdfPath: string | null = job.pdf_storage_path;
  if (job.pdf_status !== "generated" || !pdfPath) {
    try {
      const consent = (report.consent_snapshot ?? {}) as Record<string, unknown>;
      pdfBytes = buildIntakePdf(jsPDF as never, {
        referenceNumber: job.reference_number,
        submittedAt,
        userId: job.user_id,
        userEmail,
        processingMode: "Pre-approval intake (fallback) — no AI processing",
        status: "Pending",
        versions,
        consent: [
          ["Special personal information", consent.popia_special_info_consent === "agree" ? "Consented" : "Not recorded"],
          ["Cross-border processing", consent.popia_cross_border_consent === "agree" ? "Consented" : "Not recorded"],
          ["Consent recorded", formatSast(consent.recorded_at as string | undefined)],
        ],
        access: [["Access", accessText]],
        scores: summariseScores(scores),
        triage: summariseTriage(triage),
        sections: formatResponses(((definition?.sections ?? []) as IntakeSection[]), responses),
        generatedAt: formatSast(new Date().toISOString()),
      });
      pdfPath = `${job.user_id}/${job.reference_number}.pdf`;
      const { error: upErr } = await admin.storage.from(INTAKE_BUCKET).upload(pdfPath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });
      if (upErr) throw new Error(`storage upload failed: ${upErr.message}`);
    } catch (err) {
      console.error(`intake ${reportId}: PDF step failed`, safeError(err));
      await admin.rpc("record_advanced_intake_result", {
        p_report_id: reportId, p_scores: scores, p_triage: triage, p_pdf_error: safeError(err),
      });
      return { reportId, status: "error", step: "pdf" };
    }
  }

  // ---- Internal email ----
  if (job.internal_email_status === "sent") {
    await admin.rpc("record_advanced_intake_result", { p_report_id: reportId, p_scores: scores, p_triage: triage, p_pdf_path: pdfPath });
    return { reportId, status: "done" };
  }
  try {
    if (!pdfBytes) {
      const { data: blob, error: dlErr } = await admin.storage.from(INTAKE_BUCKET).download(pdfPath);
      if (dlErr || !blob) throw new Error(`could not read stored PDF: ${dlErr?.message ?? "missing"}`);
      pdfBytes = new Uint8Array(await blob.arrayBuffer());
    }
    const email = buildInternalIntakeEmail({
      referenceNumber: job.reference_number,
      submittedAt,
      userId: job.user_id,
      userEmail,
      versions,
      access: accessText,
    });
    const resp = await fetch(`${env.supabaseUrl}/functions/v1/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.serviceKey}` },
      body: JSON.stringify({
        to: INTAKE_RECIPIENT,
        subject: email.subject,
        html: email.html,
        // Stable per attempt: a crash after Resend accepted the send but
        // before we recorded it reuses the same key, so no duplicate.
        idempotency_key: `skynn-intake:${reportId}:${report.internal_email_attempts ?? 0}`,
        attachments: [{ filename: email.filename, content: toBase64(pdfBytes) }],
      }),
    });
    const body = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const detail = typeof body?.detail?.message === "string" ? body.detail.message : body?.error ?? `HTTP ${resp.status}`;
      throw new Error(`send-email ${resp.status}: ${detail}`);
    }
  } catch (err) {
    console.error(`intake ${reportId}: email step failed`, safeError(err));
    await admin.rpc("record_advanced_intake_result", {
      p_report_id: reportId, p_scores: scores, p_triage: triage, p_pdf_path: pdfPath, p_email_error: safeError(err),
    });
    return { reportId, status: "error", step: "email" };
  }

  await admin.rpc("record_advanced_intake_result", {
    p_report_id: reportId, p_scores: scores, p_triage: triage, p_pdf_path: pdfPath, p_email_sent: true,
  });
  return { reportId, status: "done" };
}
