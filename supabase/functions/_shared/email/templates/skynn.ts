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
