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
  id: "admin_notify_me_request",
  category: "ADMIN",
  internalName: "Notify-me request (coming-soon feature)",
  transactional: false,
  requiredVars: ["feature_key"],
  subject: (vars) => `New notify-me request: ${vars.feature_key}`,
  preheader: () => "A visitor asked to be notified about an upcoming feature.",
  render: (vars) => `
    ${emailHeading("New notify-me request")}
    ${emailParagraph(`A visitor asked to be notified when this feature launches — no automated reminder is sent, this is a manual outreach list.`)}
    ${emailKeyValueTable([
      ["Feature", String(vars.feature_key ?? "")],
      ["Contact method", String(vars.contact_method ?? "")],
      ["Email", String(vars.email ?? "—")],
      ["Phone", String(vars.phone ?? "—")],
    ])}
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

registerTemplate({
  id: "admin_skynn_review_needed",
  category: "ADMIN",
  internalName: "SKYNN AI report awaiting human review",
  transactional: false,
  requiredVars: ["report_id"],
  subject: (vars) => `SKYNN AI report awaiting review${vars.triage && vars.triage !== "clear" ? ` (${String(vars.triage)})` : ""}`,
  preheader: () => "A QA-approved Advanced AI Dermatology Report is held for release.",
  render: (vars) => `
    ${emailHeading("A SKYNN AI report needs review")}
    ${emailParagraph(`A new Advanced AI Dermatology Report passed automated QA and is held until someone on the team approves or rejects it. No member details are included in this email.`)}
    ${emailKeyValueTable([
      ["Report ID", String(vars.report_id ?? "")],
      ["Safety triage", String(vars.triage ?? "")],
      ["MST group", String(vars.mst_group ?? "")],
    ])}
    ${emailButton("Open SKYNN Reviews", `${BRAND.siteUrl}/admin`)}
  `,
});
