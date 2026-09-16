import { registerTemplate } from "./registry.ts";
import { BRAND, escapeHtml } from "../layout.ts";
import { emailHeading, emailParagraph, emailButton, emailNotice } from "../components.ts";

registerTemplate({
  id: "auth_welcome",
  category: "AUTH",
  internalName: "Account welcome",
  transactional: true,
  requiredVars: [],
  subject: () => "Welcome to SkinLabs®",
  preheader: () => "Your South African skincare intelligence account is ready.",
  render: () => `
    ${emailHeading("Welcome to SkinLabs®")}
    ${emailParagraph(
      `Your account is ready. SkinLabs® gives you free AI skin analysis, ingredient intelligence, and grounded, ` +
      `SkinLabs-reviewed product recommendations — built for South African skin, climate and budgets.`
    )}
    ${emailButton("Start your skin analysis", `${BRAND.siteUrl}/skynn-ai`)}
    ${emailParagraph(`Questions any time — just reply to this email.`)}
  `,
});

registerTemplate({
  id: "auth_email_verified",
  category: "AUTH",
  internalName: "Email verified",
  transactional: true,
  requiredVars: [],
  subject: () => "Your email is verified",
  preheader: () => "Your SkinLabs® account email address is now confirmed.",
  render: () => `
    ${emailHeading("Email verified")}
    ${emailParagraph(`Your email address is confirmed. Your account is fully secured.`)}
  `,
});

registerTemplate({
  id: "auth_password_changed",
  category: "SECURITY",
  internalName: "Password changed",
  transactional: true,
  requiredVars: [],
  subject: () => "Your SkinLabs® password was changed",
  preheader: () => "This is a security confirmation — no action needed if this was you.",
  render: () => `
    ${emailHeading("Password changed")}
    ${emailParagraph(`Your SkinLabs® account password was just changed.`)}
    ${emailNotice(`If this wasn't you, contact <a href="mailto:${BRAND.supportEmail}">${BRAND.supportEmail}</a> immediately.`, "warning")}
  `,
});

registerTemplate({
  id: "auth_email_changed",
  category: "SECURITY",
  internalName: "Email address changed",
  transactional: true,
  requiredVars: [],
  subject: () => "Your SkinLabs® email address was changed",
  preheader: () => "This is a security confirmation — no action needed if this was you.",
  render: (vars) => `
    ${emailHeading("Email address changed")}
    ${emailParagraph(
      vars.old_email
        ? `Your SkinLabs® account email was changed from <strong>${escapeHtml(vars.old_email)}</strong> to this address.`
        : `Your SkinLabs® account email address was just changed.`
    )}
    ${emailNotice(`If this wasn't you, contact <a href="mailto:${BRAND.supportEmail}">${BRAND.supportEmail}</a> immediately.`, "warning")}
  `,
});
