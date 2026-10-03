import { registerTemplate, TemplateVars } from "./registry.ts";
import { BRAND, escapeHtml } from "../layout.ts";
import { emailHeading, emailParagraph, emailKeyValueTable } from "../components.ts";

// Six lead-capture/support forms all share one shape: a user confirmation
// ("we got your message") and an admin notification with the submitted
// fields — this factory avoids six near-duplicate template pairs.
function registerFormPair(opts: {
  slug: string;
  formLabel: string;
  confirmationCopy: string;
  adminFields: Array<[key: string, label: string]>;
}) {
  registerTemplate({
    id: `form_confirmation_${opts.slug}`,
    category: "FORMS",
    internalName: `${opts.formLabel} — user confirmation`,
    transactional: true,
    requiredVars: [],
    subject: () => `We received your ${opts.formLabel.toLowerCase()}`,
    preheader: () => `Thanks for reaching out to SkinLabs® — we'll be in touch soon.`,
    render: () => `
      ${emailHeading("Thanks — we've got it")}
      ${emailParagraph(opts.confirmationCopy)}
    `,
  });

  registerTemplate({
    id: `admin_form_notification_${opts.slug}`,
    category: "ADMIN",
    internalName: `${opts.formLabel} — admin notification`,
    transactional: false,
    requiredVars: [],
    subject: () => `New ${opts.formLabel.toLowerCase()}`,
    preheader: () => `A new ${opts.formLabel.toLowerCase()} was submitted on skinlabs.co.za.`,
    render: (vars: TemplateVars) => `
      ${emailHeading(`New ${opts.formLabel.toLowerCase()}`)}
      ${emailKeyValueTable(
        opts.adminFields
          .filter(([key]) => vars[key] !== undefined && vars[key] !== null && vars[key] !== "")
          .map(([key, label]) => [label, String(vars[key])])
      )}
      ${emailParagraph(`Submitted via ${escapeHtml(BRAND.siteUrl)}.`)}
    `,
  });
}

registerFormPair({
  slug: "contact",
  formLabel: "Contact message",
  confirmationCopy: `We received your message and will respond within 24 hours.`,
  adminFields: [
    ["first_name", "First name"], ["last_name", "Last name"], ["email", "Email"],
    ["subject", "Subject"], ["message", "Message"],
  ],
});

registerFormPair({
  slug: "partner",
  formLabel: "Partnership enquiry",
  confirmationCopy: `Thanks for your interest in the SkinLabs® Partner Program. Our team will review your enquiry and follow up shortly.`,
  adminFields: [
    ["full_name", "Name"], ["work_email", "Work email"],
    ["business_name", "Business"], ["partnership_model", "Model"],
  ],
});

registerFormPair({
  slug: "spotlight_brand",
  formLabel: "Spotlight brand request",
  confirmationCopy: `Thanks — we've received your Spotlight brand request and will be in touch soon.`,
  adminFields: [
    ["contact_name", "Name"], ["contact_email", "Email"],
    ["brand_name", "Brand"], ["request_type", "Type"],
  ],
});

registerFormPair({
  slug: "custom_formula",
  formLabel: "Custom formula request",
  confirmationCopy: `Thanks for your custom formula request. Our lab will be in touch within 48 hours.`,
  adminFields: [
    ["contact_name", "Name"], ["contact_email", "Email"], ["product_type", "Product type"],
  ],
});

registerFormPair({
  slug: "business",
  formLabel: "Business enquiry",
  confirmationCopy: `Thanks for reaching out about working with SkinLabs®. Our team will follow up shortly.`,
  adminFields: [
    ["contact_name", "Name"], ["contact_email", "Email"], ["company_name", "Company"],
  ],
});

registerFormPair({
  slug: "openhaus_waitlist",
  formLabel: "OpenHaus waitlist request",
  confirmationCopy: `Thanks for joining the OpenHaus marketplace waitlist — we'll email you the moment it's ready.`,
  adminFields: [
    ["first_name", "First name"], ["last_name", "Last name"], ["email", "Email"],
    ["phone", "Phone"], ["city", "City"], ["country", "Country"],
  ],
});

registerFormPair({
  slug: "newsletter",
  formLabel: "Early access signup",
  confirmationCopy: `You're on the early access list for virtual dermatologist consultations. We'll email you the moment it launches.`,
  adminFields: [["email", "Email"]],
});

// Feature waitlist only sends a user confirmation — it's an opt-in, not a
// lead requiring admin follow-up (admins can query feature_waitlist
// directly when scoping the feature).
registerTemplate({
  id: "form_confirmation_feature_waitlist",
  category: "FORMS",
  internalName: "Feature waitlist join — user confirmation",
  transactional: true,
  requiredVars: [],
  subject: () => "You're on the list",
  preheader: () => "We'll email you the moment this feature launches.",
  render: (vars: TemplateVars) => `
    ${emailHeading("You're on the list")}
    ${emailParagraph(
      `We've added you to the waitlist${vars.feature_key ? ` for <strong>${escapeHtml(String(vars.feature_key).replace(/_/g, " "))}</strong>` : ""}. ` +
      `We'll email you the moment it launches.`
    )}
  `,
});

// Mobile contextual feedback surveys: admin-only, delivered to feedback@ only
// (email-processor ADMIN_TEMPLATE_RECIPIENT_OVERRIDE). Carries no member identity.
registerTemplate({
  id: "admin_feedback_survey_response",
  category: "ADMIN",
  internalName: "Member feedback survey — admin notification",
  transactional: false,
  requiredVars: [],
  subject: (vars: TemplateVars) =>
    `Member feedback${vars.surface ? `: ${escapeHtml(String(vars.surface))}` : ""}`,
  preheader: () => "A signed-in member answered a contextual feedback survey on skinlabs.co.za.",
  render: (vars: TemplateVars) => {
    const rows: Array<[string, string]> = [
      ["Surface", String(vars.surface ?? "")],
      ["Survey", String(vars.survey_id ?? "")],
      ["Question", String(vars.question ?? "")],
      ["Answer", String(vars.answer ?? "")],
      ["Comment", String(vars.comment ?? "")],
      ["Page", String(vars.path ?? "")],
    ];
    return `
      ${emailHeading("New member feedback")}
      ${emailKeyValueTable(rows.filter(([, v]) => v !== ""))}
      ${emailParagraph("Sent by a signed-in member from a mobile device. No name or email address is attached.")}
    `;
  },
});

// /consult survey: admin-only (anonymous visitors, nothing to confirm to).
registerTemplate({
  id: "admin_consult_survey_response",
  category: "ADMIN",
  internalName: "Consult directory survey — admin notification",
  transactional: false,
  requiredVars: [],
  subject: (vars: TemplateVars) =>
    `New consult survey response${vars.sentiment ? ` (usefulness ${escapeHtml(String(vars.sentiment))}/5)` : ""}`,
  preheader: () => "A visitor completed the /consult directory survey on skinlabs.co.za.",
  render: (vars: TemplateVars) => {
    const features = Array.isArray(vars.useful_features) ? (vars.useful_features as unknown[]).map(String).join(", ") : "";
    const rows: Array<[string, string]> = [
      ["Directory usefulness (1-5)", String(vars.sentiment ?? "")],
      ["First use", String(vars.primary_use ?? "")],
      ["Booking importance (1-5)", String(vars.booking_priority ?? "")],
      ["Features to ship first", features],
      ["Trust in unverified listings (1-5)", String(vars.trust_score ?? "")],
      ["Other feedback", String(vars.feedback_text ?? "")],
      ["Signed in", vars.signed_in ? "Yes" : "No"],
    ];
    return `
      ${emailHeading("New consult survey response")}
      ${emailKeyValueTable(rows.filter(([, v]) => v !== ""))}
      ${emailParagraph(`Submitted via ${escapeHtml(BRAND.siteUrl)}/consult.`)}
    `;
  },
});
