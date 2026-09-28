/**
 * The member's own branded summary of an Advanced AI Dermatology Analysis
 * submission (SKYNN AI v2.1 — beta).
 *
 * While the analysis is in its pre-approval stage this is a SUBMISSION
 * record, never a report: it says "Pending", lists every answer exactly as
 * asked (formatAnswers.ts, from the pinned definition) and carries the same
 * boundaries as the rest of SKYNN AI. Released reports are read in the app.
 */
import type jsPDF from "jspdf";
import { BrandDoc, formatPdfDate, loadLogoDataUrl, safeFileName } from "@/lib/pdf/brandPdf";
import { formatResponses } from "@/lib/assessment/formatAnswers";
import {
  getReportDisplayStatus,
  INTAKE_EXPECTED_DELIVERY,
  REPORT_STATUS_LABEL,
  type AdvancedAssessmentReportSummary,
  type AssessmentDefinitionSummary,
} from "@/lib/assessment/types";
import {
  ADVANCED_NAME,
  ADVANCED_SUBMISSION_NAME,
  BASIC_NAME,
  SKYNN_FEATURE_VERSION,
  SKYNN_RELEASE_LABEL,
} from "@/lib/skynn/terminology";

export interface AdvancedSubmissionPdfData {
  memberName: string;
  email: string;
  submission: Pick<
    AdvancedAssessmentReportSummary,
    "reference_number" | "submitted_at" | "created_at" | "generation_status" | "review_status" | "processing_mode" | "intake_status"
  >;
  responses: Record<string, unknown>;
  definition: AssessmentDefinitionSummary;
  /** When the session started from a Basic AI Skin Analysis. */
  basicAnalysisDate?: string | null;
  prefilledCount?: number;
}

export const ADVANCED_SUBMISSION_DISCLAIMER = `This is a record of the answers you submitted for your ${ADVANCED_NAME}. It is not a report, it has not been reviewed, and it contains no diagnosis or treatment advice. SkinLabs does not analyse photos or infer your skin tone. If you are worried about a mole, a wound that won't heal, sudden or severe symptoms, or anything that feels urgent, please see a doctor or dermatologist now rather than waiting for this analysis.`;

export async function buildAdvancedSubmissionPdf(data: AdvancedSubmissionPdfData): Promise<jsPDF> {
  const status = getReportDisplayStatus(data.submission);
  const isPending = status === "pending_intake";
  const submittedAt = data.submission.submitted_at ?? data.submission.created_at;
  const b = new BrandDoc({
    title: `${ADVANCED_SUBMISSION_NAME}`,
    subtitle: `${SKYNN_RELEASE_LABEL} · ${data.submission.reference_number ?? "reference pending"}`,
    footer: `${SKYNN_RELEASE_LABEL} · ${ADVANCED_SUBMISSION_NAME} · Status: ${REPORT_STATUS_LABEL[status]} · Not medical advice`,
    logoDataUrl: await loadLogoDataUrl(),
  });

  b.section("Your submission");
  b.keyValues([
    ["Reference", data.submission.reference_number ?? "-"],
    ["Submitted", submittedAt ? formatPdfDate(submittedAt) : "-"],
    ["Status", REPORT_STATUS_LABEL[status]],
    ["Prepared for", [data.memberName, data.email].filter(Boolean).join(" · ") || "-"],
    ["Questionnaire version", data.definition.version],
    ["Release", `${SKYNN_RELEASE_LABEL} (${SKYNN_FEATURE_VERSION})`],
    ...(data.basicAnalysisDate
      ? ([[
          "Started from",
          `Your ${BASIC_NAME} of ${formatPdfDate(data.basicAnalysisDate)}${data.prefilledCount ? ` (${data.prefilledCount} suggested answers, each confirmed or changed by you)` : ""}`,
        ]] as Array<[string, string]>)
      : []),
  ]);

  if (isPending) {
    b.callout(
      "What happens next",
      `Your submission has been received and securely queued. Expected delivery: ${INTAKE_EXPECTED_DELIVERY}. We'll email you when your ${ADVANCED_NAME} is ready to read in your dashboard. You can withdraw and delete this submission from your dashboard at any time before then; your Analysis Pass is returned if you do.`,
    );
  }

  const consentAgreed = (id: string) => data.responses[id] === "agree";
  b.section("Your consent");
  b.keyValues([
    ["Processing your skin information (special personal information)", consentAgreed("popia_special_info_consent") ? "Given" : "Not given"],
    ["Processing outside South Africa", consentAgreed("popia_cross_border_consent") ? "Given" : "Not given"],
  ]);

  // Consent is summarised above; every other answer is listed as it was asked.
  const sections = formatResponses(data.definition.sections, data.responses)
    .map((s) => ({ ...s, answers: s.answers.filter((a) => !a.questionId.startsWith("popia_")) }))
    .filter((s) => s.answers.length > 0);
  for (const section of sections) {
    b.section(section.title);
    b.keyValues(section.answers.map((a) => [a.prompt, a.answer]));
  }

  b.callout("Important", ADVANCED_SUBMISSION_DISCLAIMER);
  return b.finish();
}

export async function downloadAdvancedSubmissionPdf(data: AdvancedSubmissionPdfData) {
  const doc = await buildAdvancedSubmissionPdf(data);
  doc.save(`skinlabs-advanced-ai-dermatology-analysis-${safeFileName(data.submission.reference_number ?? data.memberName)}.pdf`);
}
