import { registerTemplate } from "./registry.ts";
import { BRAND, escapeHtml } from "../layout.ts";
import { emailHeading, emailParagraph, emailButton, emailNotice, emailKeyValueTable } from "../components.ts";

const PURCHASE_TYPE_LABELS: Record<string, string> = {
  plan: "Membership",
  credit_pack: "Analysis Pass",
  founding_member: "Founding Member",
};

function formatZar(amount: unknown): string {
  const n = Number(amount);
  if (Number.isNaN(n)) return String(amount ?? "");
  return `R${n.toFixed(2)}`;
}

registerTemplate({
  id: "payment_succeeded",
  category: "BILLING",
  internalName: "Payment receipt",
  transactional: true,
  requiredVars: ["amount_zar", "reference"],
  subject: (vars) =>
    vars.purchase_type === "credit_pack" ? "Your Analysis Pass is ready" : "Payment received — thank you",
  preheader: (vars) => `Receipt for ${escapeHtml(vars.description ?? "your purchase")}.`,
  render: (vars) => `
    ${emailHeading(vars.purchase_type === "credit_pack" ? "Your Analysis Pass is ready" : "Payment received")}
    ${emailParagraph(
      vars.purchase_type === "credit_pack"
        ? `Your Analysis Pass purchase is confirmed and ready to use on your next SKYNN AI analysis.`
        : `Thank you — your payment was successful.`
    )}
    ${emailKeyValueTable([
      ["Item", String(vars.description ?? PURCHASE_TYPE_LABELS[String(vars.purchase_type)] ?? "Purchase")],
      ["Amount", formatZar(vars.amount_zar)],
      ["Reference", String(vars.reference ?? "")],
    ])}
    ${emailButton("View billing history", `${BRAND.siteUrl}/dashboard?tab=billing`)}
  `,
});

registerTemplate({
  id: "payment_failed",
  category: "BILLING",
  internalName: "Payment failed",
  transactional: true,
  requiredVars: ["amount_zar"],
  subject: () => "Your SkinLabs® payment didn't go through",
  preheader: () => "No charge was made — you can try again any time.",
  render: (vars) => `
    ${emailHeading("Payment didn't go through")}
    ${emailParagraph(`We couldn't process your payment for ${escapeHtml(String(vars.description ?? "your purchase"))}. No charge was made.`)}
    ${emailKeyValueTable([["Amount", formatZar(vars.amount_zar)]])}
    ${emailButton("Try again", `${BRAND.siteUrl}/pricing`)}
    ${emailNotice(`If this keeps happening, contact <a href="mailto:${BRAND.supportEmail}">${BRAND.supportEmail}</a> and we'll help directly.`, "info")}
  `,
});
