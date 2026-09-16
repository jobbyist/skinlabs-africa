import { registerTemplate } from "./registry.ts";
import { BRAND } from "../layout.ts";
import { emailHeading, emailParagraph, emailKeyValueTable, emailButton } from "../components.ts";

registerTemplate({
  id: "admin_payment_needs_review",
  category: "ADMIN",
  internalName: "Payment needs manual review",
  transactional: false,
  requiredVars: ["reference"],
  subject: () => "Payment needs review — founding member slot race",
  preheader: () => "A payment succeeded after the founding-member offer sold out.",
  render: (vars) => `
    ${emailHeading("Payment needs manual review")}
    ${emailParagraph(`A customer's payment succeeded, but the founding-member offer had just sold out. The plan was granted without the founding badge — reconcile manually.`)}
    ${emailKeyValueTable([
      ["Reference", String(vars.reference ?? "")],
      ["User ID", String(vars.user_id ?? "")],
      ["Purchase type", String(vars.purchase_type ?? "")],
      ["Amount (ZAR)", String(vars.amount_zar ?? "")],
    ])}
    ${emailButton("Open admin dashboard", `${BRAND.siteUrl}/admin`)}
  `,
});

registerTemplate({
  id: "admin_delivery_failed",
  category: "ADMIN",
  internalName: "Transactional email permanently failed",
  transactional: false,
  requiredVars: ["outbox_id"],
  subject: () => "A transactional email failed to send",
  preheader: () => "A transactional email exhausted its retries.",
  render: (vars) => `
    ${emailHeading("Transactional email failed")}
    ${emailParagraph(`A transactional email exhausted all retry attempts and was not delivered.`)}
    ${emailKeyValueTable([
      ["Outbox ID", String(vars.outbox_id ?? "")],
      ["Template", String(vars.template_id ?? "")],
      ["Recipient", String(vars.recipient_email ?? "")],
      ["Last error", String(vars.error ?? "")],
    ])}
  `,
});
