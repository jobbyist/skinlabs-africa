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
registerTemplate({
  id: "advanced_report_ready",
  category: "SKYNN",
  internalName: "SKYNN AI Advanced AI Dermatology Report released",
  transactional: true,
  requiredVars: [],
  subject: () => "Your Advanced AI Dermatology Report is ready",
  preheader: () => "Reviewed by the SkinLabs team and ready to read.",
  render: (vars) => `
    ${emailHeading("Your report is ready")}
    ${emailParagraph(`Your Advanced AI Dermatology Report from SKYNN AI has been reviewed by the SkinLabs team and is ready to read.`)}
    ${emailButton("Read my report", `${BRAND.siteUrl}/skynn-ai/advanced${vars.session_id ? `?session=${encodeURIComponent(String(vars.session_id))}` : ""}`)}
    ${emailNotice(`This is AI-generated cosmetic skincare guidance, not a medical diagnosis. If you're worried about any spot, mole or change in your skin, please see a doctor or dermatologist.`, "info")}
  `,
});

registerTemplate({
  id: "advanced_report_not_released",
  category: "SKYNN",
  internalName: "SKYNN AI Advanced report not released after review",
  transactional: true,
  requiredVars: [],
  subject: () => "About your Advanced AI Dermatology Report",
  preheader: () => "We couldn't release this report — your Analysis Pass has been refunded.",
  render: (vars) => `
    ${emailHeading("We couldn't release your report")}
    ${emailParagraph(`Every Advanced AI Dermatology Report is checked by the SkinLabs team before it's released. This one didn't meet our standards, so we haven't sent it.${vars.refunded ? " Your Analysis Pass has been refunded, so you can start a new assessment whenever you like." : ""}`)}
    ${emailButton("Start a new assessment", `${BRAND.siteUrl}/skynn-ai/advanced`)}
    ${emailNotice(`Questions? Reach us at <a href="mailto:${BRAND.supportEmail}">${BRAND.supportEmail}</a>.`, "info")}
  `,
});
