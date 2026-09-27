/**
 * The internal "new submission" email to reports@skinlabs.co.za. Pure so it
 * can be unit-tested. Carries identifiers and metadata only — the member's
 * answers live in the attached PDF, never in the email body. Every value is
 * HTML-escaped by emailKeyValueTable, and the subject is built only from a
 * server-generated reference that must match REFERENCE_PATTERN, so nothing a
 * member typed can reach an email header.
 */
import { renderEmailLayout } from "../../email/layout.ts";
import { emailHeading, emailKeyValueTable, emailNotice, emailParagraph } from "../../email/components.ts";
import { REFERENCE_PATTERN } from "./format.ts";

export const INTAKE_RECIPIENT = "reports@skinlabs.co.za";

export interface InternalEmailInput {
  referenceNumber: string;
  submittedAt: string;
  userId: string;
  userEmail: string | null;
  versions: Array<[string, string]>;
  access: string;
}

export function buildInternalIntakeEmail(input: InternalEmailInput): { subject: string; html: string; filename: string } {
  if (!REFERENCE_PATTERN.test(input.referenceNumber)) {
    throw new Error("invalid reference number");
  }
  const subject = `SKYNN AI Advanced Report Submission — ${input.referenceNumber}`;
  const body = `
    ${emailHeading("New Advanced Dermatology Report submission")}
    ${emailParagraph("A member has submitted the SKYNN AI Advanced Dermatology Report questionnaire. It is stored securely and queued for the production workflow; no report has been generated.")}
    ${emailKeyValueTable([
      ["Reference", input.referenceNumber],
      ["Submitted", input.submittedAt],
      ["Account ID", input.userId],
      ["Account email", input.userEmail ?? "—"],
      ["Status", "Pending (awaiting the production workflow)"],
      ["Processing mode", "Pre-approval intake (fallback)"],
      ...input.versions,
      ["Access", input.access],
      ["Attachment", "Intake record PDF attached"],
    ])}
    ${emailNotice("The attached PDF contains special personal information (POPIA). Keep it confidential, don't forward it, and delete it if the member withdraws their submission. The full record is also in Admin → SKYNN Reviews → Advanced Reports.", "warning")}
  `;
  return {
    subject,
    html: renderEmailLayout({ preheader: `Submission ${input.referenceNumber} is queued (PDF attached).`, bodyHtml: body }),
    filename: `${input.referenceNumber}.pdf`,
  };
}
