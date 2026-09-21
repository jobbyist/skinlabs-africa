import { registerTemplate } from "./registry.ts";
import { BRAND } from "../layout.ts";
import { emailHeading, emailParagraph, emailButton, emailNotice } from "../components.ts";

registerTemplate({
  id: "account_deactivated",
  category: "ACCOUNT",
  internalName: "Account deactivated",
  transactional: true,
  requiredVars: [],
  subject: () => "Your SkinLabs® account is deactivated",
  preheader: () => "You can reactivate any time — nothing has been deleted.",
  render: () => `
    ${emailHeading("Account deactivated")}
    ${emailParagraph(`Your SkinLabs® account has been temporarily deactivated, as you requested. Nothing has been deleted — your data and history are safely kept.`)}
    ${emailButton("Reactivate my account", `${BRAND.siteUrl}/dashboard?tab=account`)}
  `,
});

registerTemplate({
  id: "account_reactivated",
  category: "ACCOUNT",
  internalName: "Account reactivated",
  transactional: true,
  requiredVars: [],
  subject: () => "Welcome back to SkinLabs®",
  preheader: () => "Your account is active again.",
  render: () => `
    ${emailHeading("Welcome back")}
    ${emailParagraph(`Your SkinLabs® account is active again. Everything is exactly as you left it.`)}
    ${emailButton("Go to your dashboard", `${BRAND.siteUrl}/dashboard`)}
  `,
});

registerTemplate({
  id: "account_deleted",
  category: "ACCOUNT",
  internalName: "Account permanently deleted",
  transactional: true,
  requiredVars: [],
  subject: () => "Your SkinLabs® account has been deleted",
  preheader: () => "Confirming your account and data have been permanently removed.",
  render: () => `
    ${emailHeading("Account deleted")}
    ${emailParagraph(`Your SkinLabs® account and associated data have been permanently deleted, as you requested. This action cannot be undone.`)}
    ${emailNotice(`If you didn't request this, contact <a href="mailto:${BRAND.supportEmail}">${BRAND.supportEmail}</a> immediately.`, "warning")}
  `,
});
