import { registerTemplate } from "./registry.ts";
import { BRAND, escapeHtml } from "../layout.ts";
import { emailHeading, emailParagraph, emailButton, emailNotice } from "../components.ts";

registerTemplate({
  id: "analysis_completed",
  category: "SKYNN",
  internalName: "SKYNN AI analysis completed",
  transactional: true,
  requiredVars: [],
  subject: () => "Your SKYNN AI skin analysis is ready",
  preheader: (vars) => `Your ${escapeHtml(vars.skin_type ?? "personalised")} skin recommendation is ready to view.`,
  render: (vars) => `
    ${emailHeading("Your skin analysis is ready")}
    ${emailParagraph(
      vars.skin_type
        ? `Your new ${escapeHtml(vars.skin_type)} skin recommendation from SKYNN AI is ready to view.`
        : `Your new skin recommendation from SKYNN AI is ready to view.`
    )}
    ${emailButton("View my analysis", `${BRAND.siteUrl}/dashboard?tab=analysis`)}
  `,
});

registerTemplate({
  id: "analysis_failed",
  category: "SKYNN",
  internalName: "SKYNN AI analysis failed",
  transactional: true,
  requiredVars: [],
  subject: () => "We couldn't complete your SKYNN AI analysis",
  preheader: () => "Something went wrong — no credit was charged.",
  render: () => `
    ${emailHeading("We couldn't complete your analysis")}
    ${emailParagraph(`Something went wrong while generating your SKYNN AI skin analysis. If a credit or Analysis Pass was used, it has been refunded automatically.`)}
    ${emailButton("Try again", `${BRAND.siteUrl}/skynn-ai`)}
    ${emailNotice(`Still stuck? Reach us at <a href="mailto:${BRAND.supportEmail}">${BRAND.supportEmail}</a>.`, "info")}
  `,
});

// SKYNN AI v2 Advanced AI Dermatology Report — every report is held for a
// human review before release (see 20260923100000_skynn_v2_framework.sql's
// admin_review_advanced_assessment). The email never contains report
// content: it points the member back to the signed-in page.
// Pre-approval intake (report_mode = 'fallback'): confirms RECEIPT of a
// submission only. It must never read like a report or imply clinical
// review — the report itself follows later through the production workflow.
registerTemplate({
  id: "advanced_intake_received",
  category: "SKYNN",
  internalName: "SKYNN AI Advanced AI Dermatology Analysis submission received (pre-approval intake)",
  transactional: true,
  requiredVars: ["reference_number"],
  subject: (vars) => `We've received your Advanced AI Dermatology Analysis submission (${escapeHtml(vars.reference_number)})`,
  preheader: () => "Your submission is pending — no need to complete the questionnaire again.",
  render: (vars) => `
    ${emailHeading("Your submission has been received")}
    ${emailParagraph(`Thanks for completing the SKYNN AI - v2.2 (beta) Advanced AI Dermatology Analysis questionnaire. Your reference is <strong>${escapeHtml(vars.reference_number)}</strong>.`)}
    ${emailParagraph("Your submission is currently <strong>pending</strong> while we complete the upgraded SKYNN AI dermatology review system and clinical approval process. Your answers are securely recorded and queued, so you don't need to complete the assessment again.")}
    ${emailParagraph("Expected delivery: <strong>approximately 3–4 weeks</strong>. We'll email you as soon as your report is ready to read.")}
    ${emailButton("View submission status", `${BRAND.siteUrl}/skynn-ai/advanced${vars.session_id ? `?session=${encodeURIComponent(String(vars.session_id))}` : ""}`)}
    ${emailNotice("This email confirms we've received your submission. It isn't a report, a diagnosis or a dermatologist review. Changed your mind? You can withdraw and delete your submission from the same page; an unused Analysis Pass is refunded.", "info")}
  `,
});

registerTemplate({
  id: "advanced_report_ready",
  category: "SKYNN",
  internalName: "SKYNN AI Advanced AI Dermatology Analysis report released",
  transactional: true,
  requiredVars: [],
  subject: () => "Your Advanced AI Dermatology Analysis report is ready",
  preheader: () => "Reviewed by the SkinLabs team and ready to read.",
  render: (vars) => `
    ${emailHeading("Your report is ready")}
    ${emailParagraph(`Your Advanced AI Dermatology Analysis report from SKYNN AI has been reviewed by the SkinLabs team and is ready to read.`)}
    ${emailButton("Read my report", `${BRAND.siteUrl}/skynn-ai/advanced${vars.session_id ? `?session=${encodeURIComponent(String(vars.session_id))}` : ""}`)}
    ${emailNotice(`This is AI-generated cosmetic skincare guidance, not a medical diagnosis. If you're worried about any spot, mole or change in your skin, please see a doctor or dermatologist.`, "info")}
  `,
});

registerTemplate({
  id: "advanced_report_not_released",
  category: "SKYNN",
  internalName: "SKYNN AI Advanced AI Dermatology Analysis report not released after review",
  transactional: true,
  requiredVars: [],
  subject: () => "About your Advanced AI Dermatology Analysis report",
  preheader: () => "We couldn't release this report — your Analysis Pass has been refunded.",
  render: (vars) => `
    ${emailHeading("We couldn't release your report")}
    ${emailParagraph(`Every Advanced AI Dermatology Analysis report is checked by the SkinLabs team before it's released. This one didn't meet our standards, so we haven't sent it.${vars.refunded ? " Your Analysis Pass has been refunded, so you can start a new assessment whenever you like." : ""}`)}
    ${emailButton("Start a new assessment", `${BRAND.siteUrl}/skynn-ai/advanced`)}
    ${emailNotice(`Questions? Reach us at <a href="mailto:${BRAND.supportEmail}">${BRAND.supportEmail}</a>.`, "info")}
  `,
});
